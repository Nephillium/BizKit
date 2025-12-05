module.exports = [
"[project]/pages/index.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/head.js [ssr] (ecmascript)");
;
;
;
const initialFormData = {
    cold_email: {
        target: '',
        service: '',
        tone: '',
        language: 'English'
    },
    proposal: {
        clientType: '',
        projectScope: '',
        deliverables: '',
        budgetRange: '',
        language: 'English'
    },
    contract: {
        clientName: '',
        providerName: '',
        serviceDescription: '',
        paymentTerms: '',
        jurisdiction: '',
        language: 'English'
    },
    social_pack: {
        businessType: '',
        niche: '',
        tone: '',
        platform: '',
        language: 'English'
    }
};
const tabLabels = {
    cold_email: 'Cold Email',
    proposal: 'Proposal',
    contract: 'Contract',
    social_pack: 'Social Pack'
};
function Home() {
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('cold_email');
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(initialFormData);
    const [output, setOutput] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [copyState, setCopyState] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('idle');
    const handleCopyToClipboard = async ()=>{
        if (!output) return;
        try {
            await navigator.clipboard.writeText(output);
            setCopyState('copied');
            setTimeout(()=>setCopyState('idle'), 2000);
        } catch (err) {
            setCopyState('error');
            setTimeout(()=>setCopyState('idle'), 2000);
        }
    };
    const handleRegenerate = async ()=>{
        if (isLoading) return;
        setIsLoading(true);
        setError('');
        const previousOutput = output;
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tool: activeTab,
                    inputs: formData[activeTab]
                })
            });
            const data = await response.json();
            if (data.ok) {
                setOutput(data.output);
            } else {
                setOutput(previousOutput);
                setError(data.error === 'missing_openai_key' ? 'OpenAI API key is not configured. Please add your API key.' : data.error === 'openai_error' ? 'An error occurred while generating content. Please try again.' : data.error || 'An unexpected error occurred.');
            }
        } catch (err) {
            setOutput(previousOutput);
            setError('Network error. Please check your connection and try again.');
        } finally{
            setIsLoading(false);
        }
    };
    const updateFormField = (tool, field, value)=>{
        setFormData((prev)=>({
                ...prev,
                [tool]: {
                    ...prev[tool],
                    [field]: value
                }
            }));
    };
    const handleSubmit = async (e)=>{
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setOutput('');
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tool: activeTab,
                    inputs: formData[activeTab]
                })
            });
            const data = await response.json();
            if (data.ok) {
                setOutput(data.output);
            } else {
                setError(data.error === 'missing_openai_key' ? 'OpenAI API key is not configured. Please add your API key.' : data.error === 'openai_error' ? 'An error occurred while generating content. Please try again.' : data.error || 'An unexpected error occurred.');
            }
        } catch (err) {
            setError('Network error. Please check your connection and try again.');
        } finally{
            setIsLoading(false);
        }
    };
    const inputStyles = {
        base: `
      w-full px-4 py-3 
      bg-white dark:bg-slate-800 
      border border-slate-200 dark:border-slate-700 
      rounded-md 
      text-slate-900 dark:text-slate-100 
      placeholder:text-slate-400 dark:placeholder:text-slate-500
      focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
      transition-all duration-200
    `
    };
    const labelStyles = `
    block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2
  `;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("title", {
                        children: "BizKit AI - Client-Winning Content in Seconds"
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 210,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("meta", {
                        name: "viewport",
                        content: "width=device-width, initial-scale=1"
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 211,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("link", {
                        rel: "icon",
                        href: "/favicon.ico"
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 212,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 209,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    minHeight: '100vh',
                    backgroundColor: 'rgb(250, 250, 250)',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("header", {
                        style: {
                            padding: '64px 16px',
                            textAlign: 'center',
                            borderBottom: '1px solid rgb(226, 232, 240)',
                            background: 'linear-gradient(180deg, rgb(255,255,255) 0%, rgb(248,250,252) 100%)'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            style: {
                                maxWidth: '768px',
                                margin: '0 auto'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                                    style: {
                                        fontSize: 'clamp(2rem, 5vw, 2.5rem)',
                                        fontWeight: 700,
                                        color: 'rgb(15, 23, 42)',
                                        letterSpacing: '-0.02em',
                                        marginBottom: '16px',
                                        lineHeight: 1.2
                                    },
                                    "data-testid": "text-hero-title",
                                    children: "BizKit AI – Client-Winning Content in Seconds"
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.tsx",
                                    lineNumber: 232,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                    style: {
                                        fontSize: '1.125rem',
                                        color: 'rgb(71, 85, 105)',
                                        lineHeight: 1.6,
                                        marginBottom: '16px'
                                    },
                                    "data-testid": "text-hero-subtitle",
                                    children: "Cold emails, proposals, contracts and social media posts for freelancers & agencies."
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.tsx",
                                    lineNumber: 245,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                    style: {
                                        display: 'inline-block',
                                        padding: '6px 12px',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: 'rgb(99, 102, 241)',
                                        backgroundColor: 'rgb(238, 242, 255)',
                                        borderRadius: '9999px',
                                        border: '1px solid rgb(199, 210, 254)'
                                    },
                                    "data-testid": "badge-beta",
                                    children: "Free beta – Pro plans coming soon"
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.tsx",
                                    lineNumber: 256,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/index.tsx",
                            lineNumber: 231,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 223,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("main", {
                        style: {
                            maxWidth: '896px',
                            margin: '0 auto',
                            padding: '32px 16px'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '8px',
                                    marginBottom: '32px'
                                },
                                "data-testid": "tabs-container",
                                children: Object.keys(tabLabels).map((tool)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            setActiveTab(tool);
                                            setOutput('');
                                            setError('');
                                        },
                                        style: {
                                            padding: '10px 20px',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            borderRadius: '6px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            backgroundColor: activeTab === tool ? 'rgb(99, 102, 241)' : 'rgb(241, 245, 249)',
                                            color: activeTab === tool ? 'rgb(255, 255, 255)' : 'rgb(71, 85, 105)',
                                            boxShadow: activeTab === tool ? '0 1px 3px rgba(99, 102, 241, 0.3)' : 'none'
                                        },
                                        "data-testid": `tab-${tool}`,
                                        children: tabLabels[tool]
                                    }, tool, false, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 293,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 283,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("form", {
                                onSubmit: handleSubmit,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        style: {
                                            backgroundColor: 'rgb(255, 255, 255)',
                                            borderRadius: '8px',
                                            border: '1px solid rgb(226, 232, 240)',
                                            padding: '24px',
                                            marginBottom: '24px'
                                        },
                                        children: [
                                            activeTab === 'cold_email' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '20px'
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                htmlFor: "target",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Target Audience"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 343,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                id: "target",
                                                                type: "text",
                                                                placeholder: "e.g. clinic owners in Istanbul",
                                                                value: formData.cold_email.target,
                                                                onChange: (e)=>updateFormField('cold_email', 'target', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-target"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 355,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 342,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                htmlFor: "service",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Service"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 376,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                id: "service",
                                                                type: "text",
                                                                placeholder: "e.g. Google Ads management",
                                                                value: formData.cold_email.service,
                                                                onChange: (e)=>updateFormField('cold_email', 'service', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-service"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 388,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 375,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                htmlFor: "tone",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Tone"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 409,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                id: "tone",
                                                                type: "text",
                                                                placeholder: "friendly, professional, casual",
                                                                value: formData.cold_email.tone,
                                                                onChange: (e)=>updateFormField('cold_email', 'tone', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-tone"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 421,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 408,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                htmlFor: "language",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Language"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 442,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                id: "language",
                                                                type: "text",
                                                                placeholder: "English",
                                                                value: formData.cold_email.language,
                                                                onChange: (e)=>updateFormField('cold_email', 'language', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-language"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 454,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 441,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 341,
                                                columnNumber: 17
                                            }, this),
                                            activeTab === 'proposal' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '20px'
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                htmlFor: "clientType",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Client Type"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 481,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                id: "clientType",
                                                                type: "text",
                                                                placeholder: "e-commerce brand, SaaS founder, etc.",
                                                                value: formData.proposal.clientType,
                                                                onChange: (e)=>updateFormField('proposal', 'clientType', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-clientType"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 493,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 480,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                htmlFor: "projectScope",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Project Scope"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 514,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("textarea", {
                                                                id: "projectScope",
                                                                placeholder: "Describe the project scope...",
                                                                value: formData.proposal.projectScope,
                                                                onChange: (e)=>updateFormField('proposal', 'projectScope', e.target.value),
                                                                rows: 4,
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)',
                                                                    resize: 'vertical',
                                                                    minHeight: '120px'
                                                                },
                                                                "data-testid": "input-projectScope"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 526,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 513,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                htmlFor: "deliverables",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Deliverables"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 549,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("textarea", {
                                                                id: "deliverables",
                                                                placeholder: "List the deliverables...",
                                                                value: formData.proposal.deliverables,
                                                                onChange: (e)=>updateFormField('proposal', 'deliverables', e.target.value),
                                                                rows: 4,
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)',
                                                                    resize: 'vertical',
                                                                    minHeight: '120px'
                                                                },
                                                                "data-testid": "input-deliverables"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 561,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 548,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                htmlFor: "budgetRange",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Budget Range"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 584,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                id: "budgetRange",
                                                                type: "text",
                                                                placeholder: "$2,000 - $5,000",
                                                                value: formData.proposal.budgetRange,
                                                                onChange: (e)=>updateFormField('proposal', 'budgetRange', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-budgetRange"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 596,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 583,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                htmlFor: "proposalLanguage",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Language"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 617,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                id: "proposalLanguage",
                                                                type: "text",
                                                                placeholder: "English",
                                                                value: formData.proposal.language,
                                                                onChange: (e)=>updateFormField('proposal', 'language', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-proposalLanguage"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 629,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 616,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 479,
                                                columnNumber: 17
                                            }, this),
                                            activeTab === 'contract' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '20px'
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                htmlFor: "clientName",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Client Name"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 656,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                id: "clientName",
                                                                type: "text",
                                                                placeholder: "Client's full name or company name",
                                                                value: formData.contract.clientName,
                                                                onChange: (e)=>updateFormField('contract', 'clientName', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-clientName"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 668,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 655,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                htmlFor: "providerName",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Provider Name"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 689,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                id: "providerName",
                                                                type: "text",
                                                                placeholder: "Your name or company name",
                                                                value: formData.contract.providerName,
                                                                onChange: (e)=>updateFormField('contract', 'providerName', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-providerName"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 701,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 688,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                htmlFor: "serviceDescription",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Service Description"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 722,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("textarea", {
                                                                id: "serviceDescription",
                                                                placeholder: "Describe the services to be provided...",
                                                                value: formData.contract.serviceDescription,
                                                                onChange: (e)=>updateFormField('contract', 'serviceDescription', e.target.value),
                                                                rows: 4,
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)',
                                                                    resize: 'vertical',
                                                                    minHeight: '120px'
                                                                },
                                                                "data-testid": "input-serviceDescription"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 734,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 721,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                htmlFor: "paymentTerms",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Payment Terms"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 757,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                id: "paymentTerms",
                                                                type: "text",
                                                                placeholder: "e.g. 50% upfront, 50% on delivery",
                                                                value: formData.contract.paymentTerms,
                                                                onChange: (e)=>updateFormField('contract', 'paymentTerms', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-paymentTerms"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 769,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 756,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                htmlFor: "jurisdiction",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Jurisdiction"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 790,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                id: "jurisdiction",
                                                                type: "text",
                                                                placeholder: "e.g. Turkey",
                                                                value: formData.contract.jurisdiction,
                                                                onChange: (e)=>updateFormField('contract', 'jurisdiction', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-jurisdiction"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 802,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 789,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                htmlFor: "contractLanguage",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Language"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 823,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                id: "contractLanguage",
                                                                type: "text",
                                                                placeholder: "English",
                                                                value: formData.contract.language,
                                                                onChange: (e)=>updateFormField('contract', 'language', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-contractLanguage"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 835,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 822,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 654,
                                                columnNumber: 17
                                            }, this),
                                            activeTab === 'social_pack' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '20px'
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                htmlFor: "businessType",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Business Type"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 862,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                id: "businessType",
                                                                type: "text",
                                                                placeholder: "e.g. coffee shop, agency",
                                                                value: formData.social_pack.businessType,
                                                                onChange: (e)=>updateFormField('social_pack', 'businessType', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-businessType"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 874,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 861,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                htmlFor: "niche",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Niche"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 895,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                id: "niche",
                                                                type: "text",
                                                                placeholder: "Your specific niche or industry",
                                                                value: formData.social_pack.niche,
                                                                onChange: (e)=>updateFormField('social_pack', 'niche', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-niche"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 907,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 894,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                htmlFor: "socialTone",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Tone"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 928,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                id: "socialTone",
                                                                type: "text",
                                                                placeholder: "friendly, playful, educational",
                                                                value: formData.social_pack.tone,
                                                                onChange: (e)=>updateFormField('social_pack', 'tone', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-socialTone"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 940,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 927,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                htmlFor: "platform",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Platform"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 961,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                id: "platform",
                                                                type: "text",
                                                                placeholder: "Instagram, LinkedIn, X",
                                                                value: formData.social_pack.platform,
                                                                onChange: (e)=>updateFormField('social_pack', 'platform', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-platform"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 973,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 960,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                htmlFor: "socialLanguage",
                                                                style: {
                                                                    display: 'block',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(51, 65, 85)',
                                                                    marginBottom: '8px'
                                                                },
                                                                children: "Language"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 994,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                id: "socialLanguage",
                                                                type: "text",
                                                                placeholder: "English",
                                                                value: formData.social_pack.language,
                                                                onChange: (e)=>updateFormField('social_pack', 'language', e.target.value),
                                                                style: {
                                                                    width: '100%',
                                                                    padding: '12px 16px',
                                                                    fontSize: '1rem',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    color: 'rgb(15, 23, 42)'
                                                                },
                                                                "data-testid": "input-socialLanguage"
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1006,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 993,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 860,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 330,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        type: "submit",
                                        disabled: isLoading,
                                        style: {
                                            width: '100%',
                                            padding: '14px 32px',
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            color: 'rgb(255, 255, 255)',
                                            backgroundColor: isLoading ? 'rgb(148, 163, 184)' : 'rgb(99, 102, 241)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: isLoading ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s ease',
                                            boxShadow: isLoading ? 'none' : '0 1px 3px rgba(99, 102, 241, 0.3)'
                                        },
                                        "data-testid": "button-generate",
                                        children: isLoading ? 'Generating...' : 'Generate'
                                    }, void 0, false, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 1031,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 329,
                                columnNumber: 11
                            }, this),
                            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    marginTop: '24px',
                                    padding: '16px',
                                    backgroundColor: 'rgb(254, 242, 242)',
                                    border: '1px solid rgb(254, 202, 202)',
                                    borderRadius: '8px',
                                    color: 'rgb(185, 28, 28)',
                                    fontSize: '0.875rem'
                                },
                                "data-testid": "error-message",
                                children: error
                            }, void 0, false, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 1059,
                                columnNumber: 13
                            }, this),
                            output && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    marginTop: '32px'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: '12px',
                                            gap: '12px',
                                            flexWrap: 'wrap'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                style: {
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600,
                                                    color: 'rgb(51, 65, 85)'
                                                },
                                                children: "Generated Content"
                                            }, void 0, false, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 1088,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: 'flex',
                                                    gap: '8px',
                                                    flexWrap: 'wrap'
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: handleRegenerate,
                                                        disabled: isLoading,
                                                        style: {
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '8px 16px',
                                                            fontSize: '0.8125rem',
                                                            fontWeight: 500,
                                                            color: isLoading ? 'rgb(148, 163, 184)' : 'rgb(71, 85, 105)',
                                                            backgroundColor: 'rgb(255, 255, 255)',
                                                            border: '1px solid rgb(226, 232, 240)',
                                                            borderRadius: '6px',
                                                            cursor: isLoading ? 'not-allowed' : 'pointer',
                                                            transition: 'all 0.2s ease'
                                                        },
                                                        "data-testid": "button-regenerate",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                                width: "14",
                                                                height: "14",
                                                                viewBox: "0 0 24 24",
                                                                fill: "none",
                                                                stroke: "currentColor",
                                                                strokeWidth: "2",
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                style: {
                                                                    animation: isLoading ? 'spin 1s linear infinite' : 'none'
                                                                },
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                                        d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 1131,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                                        d: "M21 3v5h-5"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 1132,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1118,
                                                                columnNumber: 21
                                                            }, this),
                                                            isLoading ? 'Regenerating...' : 'Regenerate'
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1098,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: handleCopyToClipboard,
                                                        style: {
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '8px 16px',
                                                            fontSize: '0.8125rem',
                                                            fontWeight: 500,
                                                            color: copyState === 'copied' ? 'rgb(22, 163, 74)' : copyState === 'error' ? 'rgb(220, 38, 38)' : 'rgb(71, 85, 105)',
                                                            backgroundColor: copyState === 'copied' ? 'rgb(240, 253, 244)' : copyState === 'error' ? 'rgb(254, 242, 242)' : 'rgb(255, 255, 255)',
                                                            border: `1px solid ${copyState === 'copied' ? 'rgb(187, 247, 208)' : copyState === 'error' ? 'rgb(254, 202, 202)' : 'rgb(226, 232, 240)'}`,
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease'
                                                        },
                                                        "data-testid": "button-copy",
                                                        children: copyState === 'copied' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                                    width: "14",
                                                                    height: "14",
                                                                    viewBox: "0 0 24 24",
                                                                    fill: "none",
                                                                    stroke: "currentColor",
                                                                    strokeWidth: "2",
                                                                    strokeLinecap: "round",
                                                                    strokeLinejoin: "round",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("polyline", {
                                                                        points: "20 6 9 17 4 12"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 1183,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/index.tsx",
                                                                    lineNumber: 1173,
                                                                    columnNumber: 25
                                                                }, this),
                                                                "Copied!"
                                                            ]
                                                        }, void 0, true) : copyState === 'error' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                                    width: "14",
                                                                    height: "14",
                                                                    viewBox: "0 0 24 24",
                                                                    fill: "none",
                                                                    stroke: "currentColor",
                                                                    strokeWidth: "2",
                                                                    strokeLinecap: "round",
                                                                    strokeLinejoin: "round",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("circle", {
                                                                            cx: "12",
                                                                            cy: "12",
                                                                            r: "10"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 1199,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
                                                                            x1: "15",
                                                                            y1: "9",
                                                                            x2: "9",
                                                                            y2: "15"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 1200,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
                                                                            x1: "9",
                                                                            y1: "9",
                                                                            x2: "15",
                                                                            y2: "15"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 1201,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/index.tsx",
                                                                    lineNumber: 1189,
                                                                    columnNumber: 25
                                                                }, this),
                                                                "Failed"
                                                            ]
                                                        }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                                    width: "14",
                                                                    height: "14",
                                                                    viewBox: "0 0 24 24",
                                                                    fill: "none",
                                                                    stroke: "currentColor",
                                                                    strokeWidth: "2",
                                                                    strokeLinecap: "round",
                                                                    strokeLinejoin: "round",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("rect", {
                                                                            x: "9",
                                                                            y: "9",
                                                                            width: "13",
                                                                            height: "13",
                                                                            rx: "2",
                                                                            ry: "2"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 1217,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                                            d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 1218,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/index.tsx",
                                                                    lineNumber: 1207,
                                                                    columnNumber: 25
                                                                }, this),
                                                                "Copy"
                                                            ]
                                                        }, void 0, true)
                                                    }, void 0, false, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1136,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 1097,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 1078,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("textarea", {
                                        readOnly: true,
                                        value: output,
                                        style: {
                                            width: '100%',
                                            minHeight: '400px',
                                            padding: '24px',
                                            fontSize: '0.875rem',
                                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                            backgroundColor: 'rgb(248, 250, 252)',
                                            border: '1px solid rgb(226, 232, 240)',
                                            borderRadius: '8px',
                                            color: 'rgb(15, 23, 42)',
                                            resize: 'vertical',
                                            lineHeight: 1.6
                                        },
                                        "data-testid": "output-content"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 1226,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 1077,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 275,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("footer", {
                        style: {
                            marginTop: '64px',
                            padding: '24px 16px',
                            borderTop: '1px solid rgb(226, 232, 240)',
                            textAlign: 'center'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                            style: {
                                fontSize: '0.875rem',
                                color: 'rgb(100, 116, 139)'
                            },
                            "data-testid": "text-footer",
                            children: "BizKit AI – Beta v1.0"
                        }, void 0, false, {
                            fileName: "[project]/pages/index.tsx",
                            lineNumber: 1257,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 1249,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 215,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1c9c29bd._.js.map