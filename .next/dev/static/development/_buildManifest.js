self.__BUILD_MANIFEST = {
  "/": [
    "static/chunks/pages/index.js"
  ],
  "/_error": [
    "static/chunks/pages/_error.js"
  ],
  "/buy-credits": [
    "static/chunks/pages/buy-credits.js"
  ],
  "__rewrites": {
    "afterFiles": [],
    "beforeFiles": [],
    "fallback": []
  },
  "sortedPages": [
    "/",
    "/_app",
    "/_error",
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/me",
    "/api/auth/register",
    "/api/generate",
    "/api/health",
    "/api/init-db",
    "/api/stripe/create-checkout",
    "/api/stripe/webhook",
    "/buy-credits"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()