module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/jsonwebtoken [external] (jsonwebtoken, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("jsonwebtoken", () => require("jsonwebtoken"));

module.exports = mod;
}),
"[project]/lib/usersStore.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "findUserByEmail",
    ()=>findUserByEmail,
    "findUserById",
    ()=>findUserById,
    "generateToken",
    ()=>generateToken,
    "getTokenFromCookie",
    ()=>getTokenFromCookie,
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
    "validatePassword",
    ()=>validatePassword,
    "verifyToken",
    ()=>verifyToken
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$jsonwebtoken__$5b$external$5d$__$28$jsonwebtoken$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/jsonwebtoken [external] (jsonwebtoken, cjs)");
;
;
const users = new Map();
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'bizkit-dev-secret';
const SUPER_USER_EMAIL = process.env.SUPER_USER_EMAIL;
function hashPassword(password) {
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["createHash"])('sha256').update(password).digest('hex');
}
function generateId() {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
function registerUser(email, password, role = 'user') {
    const normalizedEmail = email.toLowerCase().trim();
    if (users.has(normalizedEmail)) {
        return {
            error: 'User already exists'
        };
    }
    const user = {
        id: generateId(),
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        role,
        usageCount: 0,
        createdAt: new Date()
    };
    users.set(normalizedEmail, user);
    return user;
}
function findUserByEmail(email) {
    return users.get(email.toLowerCase().trim());
}
function findUserById(id) {
    for (const user of users.values()){
        if (user.id === id) {
            return user;
        }
    }
    return undefined;
}
function validatePassword(user, password) {
    return user.passwordHash === hashPassword(password);
}
function incrementUserUsage(email) {
    const user = findUserByEmail(email);
    if (user) {
        user.usageCount += 1;
        return user.usageCount;
    }
    return 0;
}
function isUserSuperUser(email) {
    if (!SUPER_USER_EMAIL) return false;
    return email.toLowerCase().trim() === SUPER_USER_EMAIL.toLowerCase().trim();
}
function loginUser(email, password) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = findUserByEmail(normalizedEmail);
    if (!user) {
        return {
            error: 'Invalid email or password'
        };
    }
    if (!validatePassword(user, password)) {
        return {
            error: 'Invalid email or password'
        };
    }
    if (isUserSuperUser(normalizedEmail)) {
        user.role = 'admin';
    }
    const token = generateToken(user);
    const { passwordHash, ...userWithoutPassword } = user;
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
function getUserFromRequest(cookieHeader) {
    const token = getTokenFromCookie(cookieHeader);
    if (!token) return null;
    return verifyToken(token);
}
}),
"[project]/pages/api/auth/me.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$usersStore$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/usersStore.ts [api] (ecmascript)");
;
async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            ok: false,
            error: 'Method not allowed'
        });
    }
    const jwtPayload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$usersStore$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getUserFromRequest"])(req.headers.cookie);
    if (!jwtPayload) {
        return res.status(200).json({
            ok: true,
            user: null
        });
    }
    const user = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$usersStore$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["findUserById"])(jwtPayload.id);
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
    const { passwordHash, ...userWithoutPassword } = user;
    return res.status(200).json({
        ok: true,
        user: userWithoutPassword
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__272d490b._.js.map