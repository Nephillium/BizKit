import type { NextApiRequest, NextApiResponse } from 'next';
import * as client from "openid-client";
import { getOidcConfig, getBaseUrl } from "../../lib/auth";
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const config = await getOidcConfig();
    const baseUrl = getBaseUrl(req);
    
    res.setHeader('Set-Cookie', serialize('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    }));
    
    const endSessionUrl = client.buildEndSessionUrl(config, {
      client_id: process.env.REPL_ID!,
      post_logout_redirect_uri: baseUrl,
    });
    
    res.redirect(endSessionUrl.href);
  } catch (error) {
    console.error("Logout error:", error);
    res.redirect("/");
  }
}
