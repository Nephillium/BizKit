import { pool } from './db';
import { ensureGoogleSchema } from './googleSchema';
import { recordSignIn } from './signInTracking';
import { publicSignupBlockReason } from './superUserPolicy';
import {
  generateToken,
  roleAfterAuthentication,
  signupCredits,
  unusablePasswordHash,
  type User,
  type UserRole,
} from './users';

export type GoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
};

export type GoogleLinkPlan =
  | { action: 'update_link'; userId: string }
  | { action: 'link_existing'; userId: string }
  | { action: 'create' }
  | { action: 'reject'; error: 'email_not_verified' | 'invalid_profile' | 'signup_blocked' | 'identity_conflict' };

/**
 * Decide how a verified Google identity maps onto an account.
 * The subject id wins over the email. A new account is created only when
 * neither the subject nor the verified email already exists.
 */
export function planGoogleLink(input: {
  sub: string;
  email: string;
  emailVerified: boolean;
  linkedUserId: string | null;
  emailUserId: string | null;
  emailUserGoogleSub: string | null;
  signupBlocked: boolean;
}): GoogleLinkPlan {
  const sub = input.sub.trim();
  const email = input.email.trim().toLowerCase();
  if (!input.emailVerified) return { action: 'reject', error: 'email_not_verified' };
  if (!sub || !email || !email.includes('@')) return { action: 'reject', error: 'invalid_profile' };
  if (input.linkedUserId) return { action: 'update_link', userId: input.linkedUserId };
  if (input.emailUserId) {
    if (input.emailUserGoogleSub && input.emailUserGoogleSub !== sub) {
      return { action: 'reject', error: 'identity_conflict' };
    }
    return { action: 'link_existing', userId: input.emailUserId };
  }
  if (input.signupBlocked) return { action: 'reject', error: 'signup_blocked' };
  return { action: 'create' };
}

export type GoogleSignInResult =
  | {
      token: string;
      created: boolean;
      user: {
        id: string;
        email: string;
        role: UserRole;
        credits: number;
        usage_count: number;
        created_at: Date;
      };
    }
  | { error: string };

function sessionFor(user: User, created: boolean): GoogleSignInResult {
  const role = roleAfterAuthentication(user.role, user.email);
  const token = generateToken({ id: user.id, email: user.email, role });
  return {
    token,
    created,
    user: {
      id: user.id,
      email: user.email,
      role,
      credits: user.credits,
      usage_count: user.usage_count,
      created_at: user.created_at,
    },
  };
}

/** Stamp last_sign_in_at, then issue the session. Call only after the user row is committed. */
async function finishGoogleSignIn(user: User, created: boolean): Promise<GoogleSignInResult> {
  await recordSignIn(user.id);
  return sessionFor(user, created);
}

/**
 * Link a Google subject to an existing account with the same verified email,
 * or create an account with the same starting credits as a password signup.
 * Stores the Google subject id, email, and name. The profile photo is not stored.
 * Reuses the normal 7-day session JWT.
 */
export async function signInWithGoogleProfile(profile: GoogleProfile): Promise<GoogleSignInResult> {
  const email = profile.email.trim().toLowerCase();
  const sub = profile.sub.trim();
  const name = profile.name;
  const early = planGoogleLink({
    sub,
    email,
    emailVerified: profile.emailVerified,
    linkedUserId: null,
    emailUserId: null,
    emailUserGoogleSub: null,
    signupBlocked: false,
  });
  if (early.action === 'reject' && (early.error === 'email_not_verified' || early.error === 'invalid_profile')) {
    return { error: early.error };
  }

  await ensureGoogleSchema();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existingLink = await client.query<{ user_id: string }>(
      'SELECT user_id FROM google_accounts WHERE google_sub = $1',
      [sub],
    );
    const linkedUserId = existingLink.rows[0]?.user_id ?? null;
    const userRows = await client.query<User>(
      `SELECT id, email, password_hash, role, credits, usage_count, created_at
       FROM users
       WHERE email = $1 OR id = $2
       ORDER BY id
       FOR UPDATE`,
      [email, linkedUserId],
    );
    const emailUser = userRows.rows.find((row) => row.email.toLowerCase() === email) ?? null;
    const linkedUser = linkedUserId
      ? userRows.rows.find((row) => row.id === linkedUserId) ?? null
      : null;
    const userIds = userRows.rows.map((row) => row.id);
    const linkRows = await client.query<{ google_sub: string; user_id: string }>(
      `SELECT google_sub, user_id
       FROM google_accounts
       WHERE google_sub = $1 OR user_id = ANY($2::varchar[])
       FOR UPDATE`,
      [sub, userIds.length > 0 ? userIds : ['__none__']],
    );
    const subStillLinked = linkRows.rows.find((row) => row.google_sub === sub)?.user_id ?? null;
    const emailUserGoogleSub = emailUser
      ? linkRows.rows.find((row) => row.user_id === emailUser.id)?.google_sub ?? null
      : null;
    const plan = planGoogleLink({
      sub,
      email,
      emailVerified: profile.emailVerified,
      linkedUserId: subStillLinked,
      emailUserId: emailUser?.id ?? null,
      emailUserGoogleSub,
      signupBlocked: publicSignupBlockReason(email) !== null,
    });

    if (plan.action === 'reject') {
      await client.query('ROLLBACK');
      return { error: plan.error };
    }

    if (plan.action === 'update_link') {
      const user = linkedUser && linkedUser.id === plan.userId ? linkedUser : null;
      if (!user) {
        await client.query('ROLLBACK');
        return { error: 'account_missing' };
      }
      await client.query(
        'UPDATE google_accounts SET email = $1, name = $2 WHERE google_sub = $3',
        [email, name, sub],
      );
      await client.query('COMMIT');
      return finishGoogleSignIn(user, false);
    }

    if (plan.action === 'link_existing') {
      if (!emailUser || emailUser.id !== plan.userId) {
        await client.query('ROLLBACK');
        return { error: 'account_missing' };
      }
      if (!emailUserGoogleSub) {
        await client.query(
          'INSERT INTO google_accounts (google_sub, user_id, email, name) VALUES ($1, $2, $3, $4)',
          [sub, emailUser.id, email, name],
        );
      } else {
        await client.query(
          'UPDATE google_accounts SET email = $1, name = $2 WHERE google_sub = $3',
          [email, name, emailUserGoogleSub],
        );
      }
      await client.query('COMMIT');
      return finishGoogleSignIn(emailUser, false);
    }

    const passwordHash = await unusablePasswordHash();
    const credits = signupCredits();
    const inserted = await client.query<User>(
      `INSERT INTO users (email, password_hash, role, credits, usage_count, email_verified)
       VALUES ($1, $2, 'user', $3, 0, TRUE)
       RETURNING id, email, password_hash, role, credits, usage_count, created_at`,
      [email, passwordHash, credits],
    );
    const createdUser = inserted.rows[0];
    if (!createdUser) {
      await client.query('ROLLBACK');
      return { error: 'account_missing' };
    }
    await client.query(
      'INSERT INTO google_accounts (google_sub, user_id, email, name) VALUES ($1, $2, $3, $4)',
      [sub, createdUser.id, email, name],
    );
    await client.query('COMMIT');
    return finishGoogleSignIn(createdUser, true);
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // The transaction is already closed.
    }
    const code = (error as { code?: string }).code;
    if (code === '23505') return { error: 'identity_conflict' };
    throw error;
  } finally {
    client.release();
  }
}
