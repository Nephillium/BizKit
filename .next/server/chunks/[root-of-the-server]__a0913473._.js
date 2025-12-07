module.exports=[70406,(e,t,a)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},74538,e=>e.a(async(t,a)=>{try{let t=await e.y("openai");e.n(t),a()}catch(e){a(e)}},!0),87656,e=>e.a(async(t,a)=>{try{var r=e.i(74538),n=t([r]);[r]=n.then?(await n)():n;let i={short:500,standard:1e3,detailed:2e3};async function s(e,t){if("POST"!==e.method)return t.status(405).json({ok:!1,error:"method_not_allowed"});let a=process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,n=process.env.AI_INTEGRATIONS_OPENAI_API_KEY;if(!a||!n)return t.status(500).json({ok:!1,error:"missing_openai_key"});try{let{tool:s,inputs:o,premiumOptions:l}=e.body;if(!s||!o)return t.status(400).json({ok:!1,error:"invalid_request"});let d=l?.model||"gpt-4o-mini",c=l?.length||"standard",u=l?.creativity??50,p=l?.customInstructions||"",m=Math.min(Math.max(u/100,0),1),g=i[c],{systemPrompt:h,userPrompt:f}=function(e,t){switch(e){case"cold_email":{let{target:e,service:a,tone:r,language:n}=t;return{systemPrompt:"You are an expert B2B sales copywriter.",userPrompt:`Write 3 short cold email variants for the following:

Target audience: ${e||"business owners"}
Service being offered: ${a||"consulting services"}
Tone: ${r||"professional"}
Language: ${n||"English"}

Each email should include:
- A compelling subject line
- A concise body (3-5 sentences max)

Return as a numbered list (1, 2, 3) with clear separation between each variant.`}}case"proposal":{let{clientType:e,projectScope:a,deliverables:r,budgetRange:n,language:s}=t;return{systemPrompt:"You are a professional consultant writing project proposals.",userPrompt:`Write a professional project proposal with the following details:

Client Type: ${e||"business client"}
Project Scope: ${a||"to be defined"}
Deliverables: ${r||"to be defined"}
Budget Range: ${n||"to be discussed"}
Language: ${s||"English"}

Structure the proposal with these sections:
1. Introduction
2. Understanding of Needs
3. Scope of Work
4. Deliverables
5. Timeline
6. Investment
7. Next Steps

Make it professional, clear, and persuasive.`}}case"contract":{let{clientName:e,providerName:a,serviceDescription:r,paymentTerms:n,jurisdiction:s,language:i}=t;return{systemPrompt:"You draft simple, plain-language service agreements (not legal advice).",userPrompt:`Draft a simple service agreement with the following details:

Client Name: ${e||"[CLIENT NAME]"}
Provider Name: ${a||"[PROVIDER NAME]"}
Service Description: ${r||"to be defined"}
Payment Terms: ${n||"to be agreed"}
Jurisdiction: ${s||"to be specified"}
Language: ${i||"English"}

Include these clauses:
1. Parties
2. Services
3. Term
4. Fees and Payment
5. Confidentiality
6. Intellectual Property
7. Termination
8. Governing Law

Keep it concise and in plain language. Add a disclaimer that this is not legal advice.`}}case"social_pack":{let{businessType:e,niche:a,tone:r,platform:n,language:s}=t;return{systemPrompt:"You are a social media strategist.",userPrompt:`Create 10 short social media post ideas for the following:

Business Type: ${e||"business"}
Niche: ${a||"general"}
Tone: ${r||"friendly"}
Platform: ${n||"social media"}
Language: ${s||"English"}

Provide 10 numbered post ideas (1-10) with captions ready to use.
Each post should be engaging and appropriate for the specified platform.`}}default:throw Error(`Unknown tool: ${e}`)}}(s,o),v=p?`${h}

Additional Instructions from User:
${p}`:h,y=new r.default({baseURL:a,apiKey:n}),w=await y.chat.completions.create({model:d,messages:[{role:"system",content:v},{role:"user",content:f}],max_tokens:g,temperature:m}),P=w.choices[0]?.message?.content||"";return t.status(200).json({ok:!0,output:P})}catch(r){console.error("OpenAI API Error:",r);let e=r?.message||String(r),a=r?.code||"";if(e.includes("429")||e.includes("insufficient_quota")||"insufficient_quota"===a)return t.status(200).json({ok:!0,output:"AI quota is exhausted on the server. Please add credits to the OpenAI account."});return t.status(500).json({ok:!1,error:"openai_error"})}}e.s(["default",()=>s]),a()}catch(e){a(e)}},!1),29807,e=>e.a(async(t,a)=>{try{var r=e.i(26747),n=e.i(90406),s=e.i(44898),i=e.i(62950),o=e.i(87656),l=e.i(7031),d=e.i(81927),c=e.i(46432),u=t([o]);[o]=u.then?(await u)():u;let m=(0,i.hoist)(o,"default"),g=(0,i.hoist)(o,"config"),h=new s.PagesAPIRouteModule({definition:{kind:n.RouteKind.PAGES_API,page:"/api/generate",pathname:"/api/generate",bundlePath:"",filename:""},userland:o,distDir:".next",relativeProjectDir:""});async function p(e,t,a){h.isDev&&(0,c.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let n="/api/generate";n=n.replace(/\/index$/,"")||"/";let s=await h.prepare(e,t,{srcPage:n});if(!s){t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve());return}let{query:i,params:o,prerenderManifest:u,routerServerContext:p}=s;try{let a=e.method||"GET",r=(0,l.getTracer)(),s=r.getActiveScopeSpan(),c=h.instrumentationOnRequestError.bind(h),m=async s=>h.render(e,t,{query:{...i,...o},params:o,allowedRevalidateHeaderKeys:[],multiZoneDraftMode:!1,trustHostHeader:!1,previewProps:u.preview,propagateError:!1,dev:h.isDev,page:"/api/generate",internalRevalidate:null==p?void 0:p.revalidate,onError:(...t)=>c(e,...t)}).finally(()=>{if(!s)return;s.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let e=r.getRootSpanAttributes();if(!e)return;if(e.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${e.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let i=e.get("next.route");if(i){let e=`${a} ${i}`;s.setAttributes({"next.route":i,"http.route":i,"next.span_name":e}),s.updateName(e)}else s.updateName(`${a} ${n}`)});s?await m(s):await r.withPropagatedContext(e.headers,()=>r.trace(d.BaseServerSpan.handleRequest,{spanName:`${a} ${n}`,kind:l.SpanKind.SERVER,attributes:{"http.method":a,"http.target":e.url}},m))}catch(e){if(h.isDev)throw e;(0,r.sendError)(t,500,"Internal Server Error")}finally{null==a.waitUntil||a.waitUntil.call(a,Promise.resolve())}}e.s(["config",0,g,"default",0,m,"handler",()=>p]),a()}catch(e){a(e)}},!1)];

//# sourceMappingURL=%5Broot-of-the-server%5D__a0913473._.js.map