import type { NextApiRequest, NextApiResponse } from 'next';
import * as client from "openid-client";
import { getOidcConfig, getCallbackUrl, upsertUser } from "../../lib/auth";
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const config = await getOidcConfig();
    const callbackUrl = getCallbackUrl(req);
    
    const fullUrl = new URL(callbackUrl);
    if (req.query) {
      Object.entries(req.query).forEach(([key, value]) => {
        if (typeof value === 'string') {
          fullUrl.searchParams.set(key, value);
        }
      });
    }
    
    const tokens = await client.authorizationCodeGrant(config, fullUrl, {
      expectedState: client.skipStateCheck,
    });

    const claims = tokens.claims();
    await upsertUser(claims);

    const userSession = {
      claims,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: claims?.exp,
    };

    const sessionData = Buffer.from(JSON.stringify(userSession)).toString('base64');
    
    res.setHeader('Set-Cookie', serialize('session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    }));
    
    res.redirect("/");
  } catch (error) {
    console.error("Callback error:", error);
    res.redirect("/?error=callback_failed");
  }
}
