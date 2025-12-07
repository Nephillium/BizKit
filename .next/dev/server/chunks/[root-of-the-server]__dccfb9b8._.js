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
    "pool",
    ()=>pool
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/pg [external] (pg, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}
const pool = new __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__["Pool"]({
    connectionString: process.env.DATABASE_URL,
    ssl: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : undefined
});
pool.on('error', (err)=>{
    console.error('Unexpected error on idle client', err);
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/lib/users.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "addCredits",
    ()=>addCredits,
    "createUser",
    ()=>createUser,
    "generateToken",
    ()=>generateToken,
    "getTokenFromCookie",
    ()=>getTokenFromCookie,
    "getUserByEmail",
    ()=>getUserByEmail,
    "getUserById",
    ()=>getUserById,
    "getUserFromRequest",
    ()=>getUserFromRequest,
    "getUserWithCredits",
    ()=>getUserWithCredits,
    "incrementUserUsage",
    ()=>incrementUserUsage,
    "isUserSuperUser",
    ()=>isUserSuperUser,
    "loginUser",
    ()=>loginUser,
    "validatePassword",
    ()=>validatePassword,
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
const BCRYPT_ROUNDS = 10;
async function hashPassword(password) {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$bcryptjs__$5b$external$5d$__$28$bcryptjs$2c$__esm_import$29$__["default"].hash(password, BCRYPT_ROUNDS);
}
async function comparePassword(password, hash) {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$bcryptjs__$5b$external$5d$__$28$bcryptjs$2c$__esm_import$29$__["default"].compare(password, hash);
}
function isUserSuperUser(email) {
    if (!SUPER_USER_EMAIL) return false;
    return email.toLowerCase().trim() === SUPER_USER_EMAIL.toLowerCase().trim();
}
async function getUserByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const result = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["pool"].query('SELECT * FROM users WHERE LOWER(email) = $1', [
        normalizedEmail
    ]);
    return result.rows[0] || null;
}
async function getUserById(id) {
    const result = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["pool"].query('SELECT * FROM users WHERE id = $1', [
        id
    ]);
    return result.rows[0] || null;
}
async function getUserWithCredits(userId) {
    const result = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["pool"].query('SELECT id, email, role, credits, is_admin, usage_count FROM users WHERE id = $1', [
        userId
    ]);
    if (!result.rows[0]) return null;
    const user = result.rows[0];
    return {
        id: user.id,
        email: user.email,
        role: user.is_admin ? 'admin' : user.role || 'user',
        credits: user.credits || 0,
        is_admin: user.is_admin || false,
        usage_count: user.usage_count || 0
    };
}
async function createUser(email, password, role = 'user') {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await getUserByEmail(normalizedEmail);
    if (existing) {
        return {
            error: 'User already exists'
        };
    }
    const passwordHash = await hashPassword(password);
    const isSuperUser = isUserSuperUser(normalizedEmail);
    const finalRole = isSuperUser ? 'admin' : role;
    try {
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["pool"].query(`INSERT INTO users (email, password_hash, role, credits, is_admin, usage_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 0, NOW(), NOW())
       RETURNING *`, [
            normalizedEmail,
            passwordHash,
            finalRole,
            0,
            isSuperUser
        ]);
        return result.rows[0];
    } catch (error) {
        if (error.code === '23505') {
            return {
                error: 'User already exists'
            };
        }
        throw error;
    }
}
async function validatePassword(user, password) {
    if (!user.password_hash) return false;
    return comparePassword(password, user.password_hash);
}
async function loginUser(email, password) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
        return {
            error: 'Invalid email or password'
        };
    }
    if (!user.password_hash) {
        return {
            error: 'Invalid email or password'
        };
    }
    const isValid = await validatePassword(user, password);
    if (!isValid) {
        return {
            error: 'Invalid email or password'
        };
    }
    const isSuperUser = isUserSuperUser(normalizedEmail);
    const finalRole = isSuperUser || user.is_admin ? 'admin' : user.role || 'user';
    if (isSuperUser && !user.is_admin) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["pool"].query('UPDATE users SET is_admin = true, role = $1 WHERE id = $2', [
            'admin',
            user.id
        ]);
    }
    const token = generateToken({
        userId: user.id,
        email: user.email,
        role: finalRole
    });
    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            role: finalRole,
            credits: user.credits || 0,
            is_admin: isSuperUser || user.is_admin || false,
            usage_count: user.usage_count || 0
        }
    };
}
function generateToken(payload) {
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
function getUserFromRequest(cookieHeader) {
    const token = getTokenFromCookie(cookieHeader);
    if (!token) return null;
    return verifyToken(token);
}
async function addCredits(userId, amount, reason) {
    const client = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["pool"].connect();
    try {
        await client.query('BEGIN');
        await client.query('UPDATE users SET credits = credits + $1 WHERE id = $2', [
            amount,
            userId
        ]);
        await client.query('INSERT INTO credit_transactions (user_id, amount, reason, created_at) VALUES ($1, $2, $3, NOW())', [
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
    const result = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["pool"].query('UPDATE users SET usage_count = COALESCE(usage_count, 0) + 1 WHERE id = $1 RETURNING usage_count', [
        userId
    ]);
    return result.rows[0]?.usage_count || 0;
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
    try {
        const jwtPayload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$users$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getUserFromRequest"])(req.headers.cookie);
        if (!jwtPayload) {
            return res.status(200).json({
                ok: true,
                user: null
            });
        }
        const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$users$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getUserWithCredits"])(jwtPayload.userId);
        if (!user) {
            return res.status(200).json({
                ok: true,
                user: {
                    id: jwtPayload.userId,
                    email: jwtPayload.email,
                    role: jwtPayload.role,
                    credits: 0
                }
            });
        }
        return res.status(200).json({
            ok: true,
            user
        });
    } catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({
            ok: false,
            error: 'Internal server error'
        });
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__dccfb9b8._.js.map