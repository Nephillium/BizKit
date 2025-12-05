import * as client from "openid-client";
import memoize from "memoizee";
import { storage } from "../server/storage";

export const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export function getCallbackUrl(req: { headers: { host?: string }; url?: string }) {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = req.headers.host || 'localhost:5000';
  return `${protocol}://${host}/api/callback`;
}

export function getBaseUrl(req: { headers: { host?: string } }) {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = req.headers.host || 'localhost:5000';
  return `${protocol}://${host}`;
}
