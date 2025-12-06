module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/cookie [external] (cookie, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("cookie", () => require("cookie"));

module.exports = mod;
}),
"[externals]/openid-client [external] (openid-client, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("openid-client");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/memoizee [external] (memoizee, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("memoizee", () => require("memoizee"));

module.exports = mod;
}),
"[externals]/drizzle-orm [external] (drizzle-orm, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("drizzle-orm");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/drizzle-orm/pg-core [external] (drizzle-orm/pg-core, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("drizzle-orm/pg-core");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/drizzle-zod [external] (drizzle-zod, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("drizzle-zod");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/shared/schema.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "anonymousUsage",
    ()=>anonymousUsage,
    "generations",
    ()=>generations,
    "insertGenerationSchema",
    ()=>insertGenerationSchema,
    "sessions",
    ()=>sessions,
    "users",
    ()=>users
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/drizzle-orm [external] (drizzle-orm, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/drizzle-orm/pg-core [external] (drizzle-orm/pg-core, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/drizzle-zod [external] (drizzle-zod, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
const sessions = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])("sessions", {
    sid: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])("sid").primaryKey(),
    sess: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["jsonb"])("sess").notNull(),
    expire: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])("expire").notNull()
}, (table)=>[
        (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["index"])("IDX_session_expire").on(table.expire)
    ]);
const users = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])("users", {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["sql"]`gen_random_uuid()`),
    email: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])("email").unique(),
    firstName: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])("first_name"),
    lastName: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])("last_name"),
    profileImageUrl: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])("profile_image_url"),
    isAdmin: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["boolean"])("is_admin").default(false),
    isSubscribed: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["boolean"])("is_subscribed").default(false),
    stripeCustomerId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])("stripe_customer_id"),
    stripeSubscriptionId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])("stripe_subscription_id"),
    usageCount: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])("usage_count").default(0),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])("created_at").defaultNow(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])("updated_at").defaultNow()
});
const anonymousUsage = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])("anonymous_usage", {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])("id").primaryKey(),
    fingerprint: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])("fingerprint").notNull().unique(),
    usageCount: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["integer"])("usage_count").default(0),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])("created_at").defaultNow()
});
const generations = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["pgTable"])("generations", {
    id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["serial"])("id").primaryKey(),
    userId: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])("user_id").notNull().references(()=>users.id),
    toolType: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["varchar"])("tool_type", {
        length: 50
    }).notNull(),
    inputs: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["jsonb"])("inputs").notNull(),
    output: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["text"])("output").notNull(),
    createdAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$pg$2d$core__$5b$external$5d$__$28$drizzle$2d$orm$2f$pg$2d$core$2c$__esm_import$29$__["timestamp"])("created_at").defaultNow()
});
const insertGenerationSchema = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$zod__$5b$external$5d$__$28$drizzle$2d$zod$2c$__esm_import$29$__["createInsertSchema"])(generations).omit({
    id: true,
    createdAt: true
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/drizzle-orm/node-postgres [external] (drizzle-orm/node-postgres, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("drizzle-orm/node-postgres");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/pg [external] (pg, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("pg");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/server/db.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "db",
    ()=>db,
    "pool",
    ()=>pool
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$node$2d$postgres__$5b$external$5d$__$28$drizzle$2d$orm$2f$node$2d$postgres$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/drizzle-orm/node-postgres [external] (drizzle-orm/node-postgres, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/pg [external] (pg, esm_import)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/schema.ts [api] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$node$2d$postgres__$5b$external$5d$__$28$drizzle$2d$orm$2f$node$2d$postgres$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$node$2d$postgres__$5b$external$5d$__$28$drizzle$2d$orm$2f$node$2d$postgres$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
const { Pool } = __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__["default"];
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});
const db = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm$2f$node$2d$postgres__$5b$external$5d$__$28$drizzle$2d$orm$2f$node$2d$postgres$2c$__esm_import$29$__["drizzle"])(pool, {
    schema: __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/server/storage.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "DatabaseStorage",
    ()=>DatabaseStorage,
    "storage",
    ()=>storage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/schema.ts [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/server/db.ts [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/drizzle-orm [external] (drizzle-orm, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
class DatabaseStorage {
    // User operations (mandatory for Replit Auth)
    async getUser(id) {
        const [user] = await __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["db"].select().from(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["users"]).where((0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["users"].id, id));
        return user;
    }
    async upsertUser(userData) {
        const [user] = await __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["db"].insert(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["users"]).values(userData).onConflictDoUpdate({
            target: __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["users"].id,
            set: {
                ...userData,
                updatedAt: new Date()
            }
        }).returning();
        return user;
    }
    async incrementUserUsage(id) {
        const [updated] = await __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["db"].update(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["users"]).set({
            usageCount: __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["sql"]`${__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["users"].usageCount} + 1`,
            updatedAt: new Date()
        }).where((0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["users"].id, id)).returning();
        return updated?.usageCount ?? 0;
    }
    async updateUserSubscription(id, isSubscribed, stripeCustomerId, stripeSubscriptionId) {
        const [updated] = await __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["db"].update(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["users"]).set({
            isSubscribed,
            stripeCustomerId,
            stripeSubscriptionId,
            updatedAt: new Date()
        }).where((0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["users"].id, id)).returning();
        return updated;
    }
    // Anonymous usage operations
    async getAnonymousUsage(fingerprint) {
        const [usage] = await __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["db"].select().from(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["anonymousUsage"]).where((0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["anonymousUsage"].fingerprint, fingerprint));
        return usage;
    }
    async incrementAnonymousUsage(fingerprint) {
        const [result] = await __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["db"].insert(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["anonymousUsage"]).values({
            fingerprint,
            usageCount: 1
        }).onConflictDoUpdate({
            target: __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["anonymousUsage"].fingerprint,
            set: {
                usageCount: __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["sql"]`${__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["anonymousUsage"].usageCount} + 1`
            }
        }).returning();
        return result?.usageCount ?? 0;
    }
    // Generation operations
    async createGeneration(generation) {
        const [created] = await __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["db"].insert(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["generations"]).values(generation).returning();
        return created;
    }
    async getGenerations(userId) {
        return await __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["db"].select().from(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["generations"]).where((0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["generations"].userId, userId)).orderBy((0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["desc"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["generations"].createdAt));
    }
    async getGeneration(id) {
        const [generation] = await __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["db"].select().from(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["generations"]).where((0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["generations"].id, id));
        return generation;
    }
    async deleteGeneration(id) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$db$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["db"].delete(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["generations"]).where((0, __TURBOPACK__imported__module__$5b$externals$5d2f$drizzle$2d$orm__$5b$external$5d$__$28$drizzle$2d$orm$2c$__esm_import$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$schema$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["generations"].id, id));
    }
}
const storage = new DatabaseStorage();
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/lib/auth.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "getBaseUrl",
    ()=>getBaseUrl,
    "getCallbackUrl",
    ()=>getCallbackUrl,
    "getOidcConfig",
    ()=>getOidcConfig,
    "upsertUser",
    ()=>upsertUser
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$openid$2d$client__$5b$external$5d$__$28$openid$2d$client$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/openid-client [external] (openid-client, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$memoizee__$5b$external$5d$__$28$memoizee$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/memoizee [external] (memoizee, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$storage$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/server/storage.ts [api] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$openid$2d$client__$5b$external$5d$__$28$openid$2d$client$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$storage$2e$ts__$5b$api$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$openid$2d$client__$5b$external$5d$__$28$openid$2d$client$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$storage$2e$ts__$5b$api$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
const getOidcConfig = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$memoizee__$5b$external$5d$__$28$memoizee$2c$__cjs$29$__["default"])(async ()=>{
    return await __TURBOPACK__imported__module__$5b$externals$5d2f$openid$2d$client__$5b$external$5d$__$28$openid$2d$client$2c$__esm_import$29$__["discovery"](new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"), process.env.REPL_ID);
}, {
    maxAge: 3600 * 1000
});
async function upsertUser(claims) {
    await __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$storage$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["storage"].upsertUser({
        id: claims["sub"],
        email: claims["email"],
        firstName: claims["first_name"],
        lastName: claims["last_name"],
        profileImageUrl: claims["profile_image_url"]
    });
}
function getCallbackUrl(req) {
    const protocol = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 'http';
    const host = req.headers.host || 'localhost:5000';
    return `${protocol}://${host}/api/callback`;
}
function getBaseUrl(req) {
    const protocol = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 'http';
    const host = req.headers.host || 'localhost:5000';
    return `${protocol}://${host}`;
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/lib/session.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "getSessionFromCookie",
    ()=>getSessionFromCookie,
    "validateSession",
    ()=>validateSession,
    "withAuth",
    ()=>withAuth
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$cookie__$5b$external$5d$__$28$cookie$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/cookie [external] (cookie, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$openid$2d$client__$5b$external$5d$__$28$openid$2d$client$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/openid-client [external] (openid-client, esm_import)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [api] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$openid$2d$client__$5b$external$5d$__$28$openid$2d$client$2c$__esm_import$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$api$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$openid$2d$client__$5b$external$5d$__$28$openid$2d$client$2c$__esm_import$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$api$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
function getSessionFromCookie(req) {
    const cookies = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$cookie__$5b$external$5d$__$28$cookie$2c$__cjs$29$__["parse"])(req.headers.cookie || '');
    const sessionCookie = cookies.session;
    if (!sessionCookie) {
        return null;
    }
    try {
        const sessionData = Buffer.from(sessionCookie, 'base64').toString('utf-8');
        return JSON.parse(sessionData);
    } catch  {
        return null;
    }
}
async function validateSession(session) {
    if (!session || !session.expires_at) {
        return false;
    }
    const now = Math.floor(Date.now() / 1000);
    if (now <= session.expires_at) {
        return true;
    }
    if (!session.refresh_token) {
        return false;
    }
    try {
        const config = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["getOidcConfig"])();
        await __TURBOPACK__imported__module__$5b$externals$5d2f$openid$2d$client__$5b$external$5d$__$28$openid$2d$client$2c$__esm_import$29$__["refreshTokenGrant"](config, session.refresh_token);
        return true;
    } catch  {
        return false;
    }
}
function withAuth(handler) {
    return async (req, res)=>{
        const session = getSessionFromCookie(req);
        if (!session) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }
        const isValid = await validateSession(session);
        if (!isValid) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }
        return handler(req, res, session);
    };
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/pages/api/auth/user.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/session.ts [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$storage$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/server/storage.ts [api] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2e$ts__$5b$api$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$storage$2e$ts__$5b$api$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2e$ts__$5b$api$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$storage$2e$ts__$5b$api$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
async function handler(req, res, session) {
    try {
        const userId = session.claims?.sub;
        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }
        const user = await __TURBOPACK__imported__module__$5b$project$5d2f$server$2f$storage$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["storage"].getUser(userId);
        res.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({
            message: "Failed to fetch user"
        });
    }
}
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["withAuth"])(handler);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__5c89a47c._.js.map