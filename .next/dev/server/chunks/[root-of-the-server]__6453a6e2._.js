module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/openai [external] (openai, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("openai");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/pages/api/generate.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$openai__$5b$external$5d$__$28$openai$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/openai [external] (openai, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$openai__$5b$external$5d$__$28$openai$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$openai__$5b$external$5d$__$28$openai$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
const MAX_TOKENS_MAP = {
    short: 500,
    standard: 1000,
    detailed: 2000
};
function buildPrompts(tool, inputs) {
    switch(tool){
        case 'cold_email':
            {
                const { target, service, tone, language } = inputs;
                return {
                    systemPrompt: 'You are an expert B2B sales copywriter.',
                    userPrompt: `Write 3 short cold email variants for the following:

Target audience: ${target || 'business owners'}
Service being offered: ${service || 'consulting services'}
Tone: ${tone || 'professional'}
Language: ${language || 'English'}

Each email should include:
- A compelling subject line
- A concise body (3-5 sentences max)

Return as a numbered list (1, 2, 3) with clear separation between each variant.`
                };
            }
        case 'proposal':
            {
                const { clientType, projectScope, deliverables, budgetRange, language } = inputs;
                return {
                    systemPrompt: 'You are a professional consultant writing project proposals.',
                    userPrompt: `Write a professional project proposal with the following details:

Client Type: ${clientType || 'business client'}
Project Scope: ${projectScope || 'to be defined'}
Deliverables: ${deliverables || 'to be defined'}
Budget Range: ${budgetRange || 'to be discussed'}
Language: ${language || 'English'}

Structure the proposal with these sections:
1. Introduction
2. Understanding of Needs
3. Scope of Work
4. Deliverables
5. Timeline
6. Investment
7. Next Steps

Make it professional, clear, and persuasive.`
                };
            }
        case 'contract':
            {
                const { clientName, providerName, serviceDescription, paymentTerms, jurisdiction, language } = inputs;
                return {
                    systemPrompt: 'You draft simple, plain-language service agreements (not legal advice).',
                    userPrompt: `Draft a simple service agreement with the following details:

Client Name: ${clientName || '[CLIENT NAME]'}
Provider Name: ${providerName || '[PROVIDER NAME]'}
Service Description: ${serviceDescription || 'to be defined'}
Payment Terms: ${paymentTerms || 'to be agreed'}
Jurisdiction: ${jurisdiction || 'to be specified'}
Language: ${language || 'English'}

Include these clauses:
1. Parties
2. Services
3. Term
4. Fees and Payment
5. Confidentiality
6. Intellectual Property
7. Termination
8. Governing Law

Keep it concise and in plain language. Add a disclaimer that this is not legal advice.`
                };
            }
        case 'social_pack':
            {
                const { businessType, niche, tone, platform, language } = inputs;
                return {
                    systemPrompt: 'You are a social media strategist.',
                    userPrompt: `Create 10 short social media post ideas for the following:

Business Type: ${businessType || 'business'}
Niche: ${niche || 'general'}
Tone: ${tone || 'friendly'}
Platform: ${platform || 'social media'}
Language: ${language || 'English'}

Provide 10 numbered post ideas (1-10) with captions ready to use.
Each post should be engaging and appropriate for the specified platform.`
                };
            }
        default:
            throw new Error(`Unknown tool: ${tool}`);
    }
}
async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            ok: false,
            error: 'method_not_allowed'
        });
    }
    // Support both Replit AI Integrations and standard OpenAI API key
    const replitBaseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    const replitApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    const standardApiKey = process.env.OPENAI_API_KEY;
    // Use Replit AI Integrations if available, otherwise fall back to standard OpenAI
    const useReplitIntegrations = replitBaseURL && replitApiKey;
    const apiKey = useReplitIntegrations ? replitApiKey : standardApiKey;
    const baseURL = useReplitIntegrations ? replitBaseURL : undefined;
    if (!apiKey) {
        return res.status(500).json({
            ok: false,
            error: 'missing_openai_key'
        });
    }
    try {
        const { tool, inputs, premiumOptions } = req.body;
        if (!tool || !inputs) {
            return res.status(400).json({
                ok: false,
                error: 'invalid_request'
            });
        }
        // Premium options with defaults
        const model = premiumOptions?.model || 'gpt-4o-mini';
        const length = premiumOptions?.length || 'standard';
        const creativity = premiumOptions?.creativity ?? 50 // 0-100 scale
        ;
        const customInstructions = premiumOptions?.customInstructions || '';
        // Convert creativity (0-100) to temperature (0-1)
        const temperature = Math.min(Math.max(creativity / 100, 0), 1);
        const maxTokens = MAX_TOKENS_MAP[length];
        const { systemPrompt, userPrompt } = buildPrompts(tool, inputs);
        // Add custom instructions to system prompt if provided
        const finalSystemPrompt = customInstructions ? `${systemPrompt}\n\nAdditional Instructions from User:\n${customInstructions}` : systemPrompt;
        const openai = new __TURBOPACK__imported__module__$5b$externals$5d2f$openai__$5b$external$5d$__$28$openai$2c$__esm_import$29$__["default"]({
            ...baseURL && {
                baseURL
            },
            apiKey
        });
        const response = await openai.chat.completions.create({
            model,
            messages: [
                {
                    role: 'system',
                    content: finalSystemPrompt
                },
                {
                    role: 'user',
                    content: userPrompt
                }
            ],
            max_tokens: maxTokens,
            temperature
        });
        const content = response.choices[0]?.message?.content || '';
        return res.status(200).json({
            ok: true,
            output: content
        });
    } catch (error) {
        console.error('OpenAI API Error:', error);
        const errorMessage = error?.message || String(error);
        const errorCode = error?.code || '';
        if (errorMessage.includes('429') || errorMessage.includes('insufficient_quota') || errorCode === 'insufficient_quota') {
            return res.status(200).json({
                ok: true,
                output: 'AI quota is exhausted on the server. Please add credits to the OpenAI account.'
            });
        }
        return res.status(500).json({
            ok: false,
            error: 'openai_error'
        });
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__6453a6e2._.js.map