import * as client from "openid-client";
import memoize from "memoizee";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  userSession: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  userSession.claims = tokens.claims();
  userSession.access_token = tokens.access_token;
  userSession.refresh_token = tokens.refresh_token;
  userSession.expires_at = userSession.claims?.exp;
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Login route
  app.get("/api/login", async (req, res) => {
    try {
      const config = await getOidcConfig();
      const callbackUrl = `${req.protocol}://${req.hostname}/api/callback`;
      
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
  });

  // Callback route
  app.get("/api/callback", async (req, res) => {
    try {
      const config = await getOidcConfig();
      const callbackUrl = `${req.protocol}://${req.hostname}/api/callback`;
      
      // Construct the full URL with query parameters for openid-client
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

      const userSession = {} as any;
      updateUserSession(userSession, tokens);
      await upsertUser(tokens.claims());

      // Store user in session
      (req.session as any).user = userSession;
      
      res.redirect("/");
    } catch (error) {
      console.error("Callback error:", error);
      res.redirect("/?error=callback_failed");
    }
  });

  // Logout route
  app.get("/api/logout", async (req, res) => {
    try {
      const config = await getOidcConfig();
      
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
        
        const endSessionUrl = client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        });
        
        res.redirect(endSessionUrl.href);
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.redirect("/");
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = (req.session as any)?.user;

  if (!user || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  // Token expired, try to refresh
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export function getUserFromSession(req: any): any {
  return (req.session as any)?.user;
}
