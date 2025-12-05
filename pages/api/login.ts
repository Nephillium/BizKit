import type { NextApiRequest, NextApiResponse } from 'next';
import * as client from "openid-client";
import { getOidcConfig, getCallbackUrl } from "../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const config = await getOidcConfig();
    const callbackUrl = getCallbackUrl(req);
    
    const authUrl = client.buildAuthorizationUrl(config, {
      redirect_uri: callbackUrl,
      scope: "openid email profile offline_access",
      prompt: "login consent",
    });
    
    res.redirect(authUrl.href);
  } catch (error) {
    console.error("Login error:", error);
    res.redirect("/?error=login_failed");
  }
}
