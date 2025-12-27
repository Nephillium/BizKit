module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/bcryptjs [external] (bcryptjs, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("bcryptjs");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/jsonwebtoken [external] (jsonwebtoken, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("jsonwebtoken", () => require("jsonwebtoken"));

module.exports = mod;
}),
"[externals]/pg [external] (pg, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("pg");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/lib/db.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "execute",
    ()=>execute,
    "pool",
    ()=>pool,
    "query",
    ()=>query,
    "queryOne",
    ()=>queryOne
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/pg [external] (pg, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
let connectionString = process.env.DATABASE_URL || '';
if (connectionString.startsWith("psql ")) {
    connectionString = connectionString.replace("psql ", "").replace(/^'|'$/g, "");
}
const pool = new __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__["Pool"]({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});
async function query(text, params) {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result.rows;
    } finally{
        client.release();
    }
}
async function queryOne(text, params) {
    const rows = await query(text, params);
    return rows[0] || null;
}
async function execute(text, params) {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result.rowCount || 0;
    } finally{
        client.release();
    }
}
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/lib/users.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "addCredits",
    ()=>addCredits,
    "findUserByEmail",
    ()=>findUserByEmail,
    "findUserById",
    ()=>findUserById,
    "generateToken",
    ()=>generateToken,
    "getTokenFromCookie",
    ()=>getTokenFromCookie,
    "getUserCredits",
    ()=>getUserCredits,
    "getUserFromRequest",
    ()=>getUserFromRequest,
    "incrementUserUsage",
    ()=>incrementUserUsage,
    "isUserSuperUser",
    ()=>isUserSuperUser,
    "loginUser",
    ()=>loginUser,
    "registerUser",
    ()=>registerUser,
    "verifyToken",
    ()=>verifyToken
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$bcryptjs__$5b$external$5d$__$28$bcryptjs$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/bcryptjs [external] (bcryptjs, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$jsonwebtoken__$5b$external$5d$__$28$jsonwebtoken$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/jsonwebtoken [external] (jsonwebtoken, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db.ts [api] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$bcryptjs__$5b$external$5d$__$28$bcryptjs$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$bcryptjs__$5b$external$5d$__$28$bcryptjs$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'bizkit-dev-secret';
const SUPER_USER_EMAIL = process.env.SUPER_USER_EMAIL;
const SALT_ROUNDS = 10;
async function hashPassword(password) {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$bcryptjs__$5b$external$5d$__$28$bcryptjs$2c$__esm_import$29$__["default"].hash(password, SALT_ROUNDS);
}
async function verifyPassword(password, hash) {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$bcryptjs__$5b$external$5d$__$28$bcryptjs$2c$__esm_import$29$__["default"].compare(password, hash);
}
function isUserSuperUser(email) {
    if (!SUPER_USER_EMAIL) return false;
    return email.toLowerCase().trim() === SUPER_USER_EMAIL.toLowerCase().trim();
}
async function findUserByEmail(email) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["queryOne"])('SELECT id, email, password_hash, role, credits, usage_count, created_at FROM users WHERE email = $1', [
        email.toLowerCase().trim()
    ]);
}
async function findUserById(id) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["queryOne"])('SELECT id, email, password_hash, role, credits, usage_count, created_at FROM users WHERE id = $1', [
        id
    ]);
}
async function registerUser(email, password) {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
        return {
            error: 'User already exists'
        };
    }
    const passwordHash = await hashPassword(password);
    const role = isUserSuperUser(normalizedEmail) ? 'admin' : 'user';
    const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["queryOne"])(`INSERT INTO users (email, password_hash, role, credits, usage_count) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING id, email, password_hash, role, credits, usage_count, created_at`, [
        normalizedEmail,
        passwordHash,
        role,
        0,
        0
    ]);
    if (!result) {
        return {
            error: 'Failed to create user'
        };
    }
    return result;
}
async function loginUser(email, password) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
        return {
            error: 'Invalid email or password'
        };
    }
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
        return {
            error: 'Invalid email or password'
        };
    }
    let role = user.role;
    if (isUserSuperUser(normalizedEmail) && role !== 'admin') {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["query"])('UPDATE users SET role = $1 WHERE id = $2', [
            'admin',
            user.id
        ]);
        role = 'admin';
    }
    const token = generateToken({
        ...user,
        role
    });
    const { password_hash, ...userWithoutPassword } = {
        ...user,
        role
    };
    return {
        token,
        user: userWithoutPassword
    };
}
function generateToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role
    };
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$jsonwebtoken__$5b$external$5d$__$28$jsonwebtoken$2c$__cjs$29$__["sign"])(payload, JWT_SECRET, {
        expiresIn: '7d'
    });
}
function verifyToken(token) {
    try {
        return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$jsonwebtoken__$5b$external$5d$__$28$jsonwebtoken$2c$__cjs$29$__["verify"])(token, JWT_SECRET);
    } catch  {
        return null;
    }
}
function getTokenFromCookie(cookieHeader) {
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(';').reduce((acc, cookie)=>{
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
    }, {});
    return cookies.bizkit_token || null;
}
function getUserFromRequest(cookieHeader, authHeader) {
    // First try Authorization header (for mobile apps)
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = verifyToken(token);
        if (payload) return payload;
    }
    // Fall back to cookie (for web app)
    const token = getTokenFromCookie(cookieHeader);
    if (!token) return null;
    return verifyToken(token);
}
async function getUserCredits(userId) {
    const user = await findUserById(userId);
    return user?.credits ?? 0;
}
async function addCredits(userId, amount, reason) {
    const client = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["pool"].connect();
    try {
        await client.query('BEGIN');
        const result = await client.query('UPDATE users SET credits = credits + $1 WHERE id = $2 RETURNING credits', [
            amount,
            userId
        ]);
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return false;
        }
        await client.query('INSERT INTO credit_transactions (user_id, amount, reason) VALUES ($1, $2, $3)', [
            userId,
            amount,
            reason
        ]);
        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Failed to add credits:', error);
        return false;
    } finally{
        client.release();
    }
}
async function incrementUserUsage(userId) {
    const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["queryOne"])('UPDATE users SET usage_count = usage_count + 1 WHERE id = $1 RETURNING usage_count', [
        userId
    ]);
    return result?.usage_count ?? 0;
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/pages/api/auth/me.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$users$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/users.ts [api] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$users$2e$ts__$5b$api$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$users$2e$ts__$5b$api$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            ok: false,
            error: 'Method not allowed'
        });
    }
    const jwtPayload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$users$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getUserFromRequest"])(req.headers.cookie, req.headers.authorization);
    if (!jwtPayload) {
        return res.status(401).json({
            ok: false,
            user: null,
            error: 'Not authenticated'
        });
    }
    const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$users$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["findUserById"])(jwtPayload.id);
    if (!user) {
        return res.status(200).json({
            ok: true,
            user: {
                id: jwtPayload.id,
                email: jwtPayload.email,
                role: jwtPayload.role
            }
        });
    }
    const { password_hash, ...userWithoutPassword } = user;
    return res.status(200).json({
        ok: true,
        user: userWithoutPassword
    });
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__dccfb9b8._.js.map