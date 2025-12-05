module.exports = [
"[externals]/jspdf [external] (jspdf, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("jspdf", () => require("jspdf"));

module.exports = mod;
}),
"[externals]/docx [external] (docx, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("docx");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/hooks/useAuth.ts [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
;
function useAuth() {
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])({
        user: null,
        isLoading: true,
        isAuthenticated: false
    });
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        async function fetchUser() {
            try {
                const response = await fetch('/api/auth/user', {
                    credentials: 'include'
                });
                if (response.ok) {
                    const user = await response.json();
                    setState({
                        user,
                        isLoading: false,
                        isAuthenticated: true
                    });
                } else {
                    setState({
                        user: null,
                        isLoading: false,
                        isAuthenticated: false
                    });
                }
            } catch (error) {
                setState({
                    user: null,
                    isLoading: false,
                    isAuthenticated: false
                });
            }
        }
        fetchUser();
    }, []);
    return state;
}
}),
"[project]/pages/index.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/head.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$jspdf__$5b$external$5d$__$28$jspdf$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/jspdf [external] (jspdf, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$docx__$5b$external$5d$__$28$docx$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/docx [external] (docx, esm_import)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useAuth$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/useAuth.ts [ssr] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$docx__$5b$external$5d$__$28$docx$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$docx__$5b$external$5d$__$28$docx$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
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
    const { user, isLoading: authLoading, isAuthenticated } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useAuth$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('cold_email');
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(initialFormData);
    const [output, setOutput] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [copyState, setCopyState] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('idle');
    const [exportState, setExportState] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('idle');
    const [showExportMenu, setShowExportMenu] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const exportMenuRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const [generations, setGenerations] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [showHistory, setShowHistory] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [historyLoading, setHistoryLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (isAuthenticated) {
            fetchGenerations();
        }
    }, [
        isAuthenticated
    ]);
    const fetchGenerations = async ()=>{
        try {
            setHistoryLoading(true);
            const response = await fetch('/api/generations', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setGenerations(data);
            }
        } catch (err) {
            console.error('Failed to fetch generations:', err);
        } finally{
            setHistoryLoading(false);
        }
    };
    const saveGeneration = async ()=>{
        if (!isAuthenticated || !output) return;
        try {
            const response = await fetch('/api/generations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    toolType: activeTab,
                    inputs: formData[activeTab],
                    output
                })
            });
            if (response.ok) {
                fetchGenerations();
            }
        } catch (err) {
            console.error('Failed to save generation:', err);
        }
    };
    const deleteGeneration = async (id)=>{
        try {
            const response = await fetch(`/api/generations/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (response.ok) {
                setGenerations(generations.filter((g)=>g.id !== id));
            }
        } catch (err) {
            console.error('Failed to delete generation:', err);
        }
    };
    const loadGeneration = (generation)=>{
        setActiveTab(generation.toolType);
        setFormData((prev)=>({
                ...prev,
                [generation.toolType]: generation.inputs
            }));
        setOutput(generation.output);
        setShowHistory(false);
    };
    const handleExportText = ()=>{
        if (!output) return;
        const blob = new Blob([
            output
        ], {
            type: 'text/plain;charset=utf-8'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bizkit-${activeTab}-${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setShowExportMenu(false);
    };
    const handleExportPDF = ()=>{
        if (!output) return;
        setExportState('exporting');
        try {
            const doc = new __TURBOPACK__imported__module__$5b$externals$5d2f$jspdf__$5b$external$5d$__$28$jspdf$2c$__cjs$29$__["jsPDF"]();
            const title = tabLabels[activeTab];
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 20;
            const maxWidth = pageWidth - margin * 2;
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(`BizKit AI - ${title}`, margin, margin);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, margin + 8);
            doc.setFontSize(11);
            doc.setTextColor(0);
            const lines = doc.splitTextToSize(output, maxWidth);
            doc.text(lines, margin, margin + 20);
            doc.save(`bizkit-${activeTab}-${Date.now()}.pdf`);
        } catch (err) {
            console.error('PDF export error:', err);
        } finally{
            setExportState('idle');
            setShowExportMenu(false);
        }
    };
    const handleExportWord = async ()=>{
        if (!output) return;
        setExportState('exporting');
        try {
            const title = tabLabels[activeTab];
            const paragraphs = output.split('\n').filter((line)=>line.trim()).map((line)=>new __TURBOPACK__imported__module__$5b$externals$5d2f$docx__$5b$external$5d$__$28$docx$2c$__esm_import$29$__["Paragraph"]({
                    children: [
                        new __TURBOPACK__imported__module__$5b$externals$5d2f$docx__$5b$external$5d$__$28$docx$2c$__esm_import$29$__["TextRun"](line)
                    ],
                    spacing: {
                        after: 200
                    }
                }));
            const doc = new __TURBOPACK__imported__module__$5b$externals$5d2f$docx__$5b$external$5d$__$28$docx$2c$__esm_import$29$__["Document"]({
                sections: [
                    {
                        properties: {},
                        children: [
                            new __TURBOPACK__imported__module__$5b$externals$5d2f$docx__$5b$external$5d$__$28$docx$2c$__esm_import$29$__["Paragraph"]({
                                children: [
                                    new __TURBOPACK__imported__module__$5b$externals$5d2f$docx__$5b$external$5d$__$28$docx$2c$__esm_import$29$__["TextRun"]({
                                        text: `BizKit AI - ${title}`,
                                        bold: true,
                                        size: 32
                                    })
                                ],
                                spacing: {
                                    after: 200
                                }
                            }),
                            new __TURBOPACK__imported__module__$5b$externals$5d2f$docx__$5b$external$5d$__$28$docx$2c$__esm_import$29$__["Paragraph"]({
                                children: [
                                    new __TURBOPACK__imported__module__$5b$externals$5d2f$docx__$5b$external$5d$__$28$docx$2c$__esm_import$29$__["TextRun"]({
                                        text: `Generated on ${new Date().toLocaleDateString()}`,
                                        color: '666666',
                                        size: 20
                                    })
                                ],
                                spacing: {
                                    after: 400
                                }
                            }),
                            ...paragraphs
                        ]
                    }
                ]
            });
            const blob = await __TURBOPACK__imported__module__$5b$externals$5d2f$docx__$5b$external$5d$__$28$docx$2c$__esm_import$29$__["Packer"].toBlob(doc);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `bizkit-${activeTab}-${Date.now()}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Word export error:', err);
        } finally{
            setExportState('idle');
            setShowExportMenu(false);
        }
    };
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
                        lineNumber: 400,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("meta", {
                        name: "viewport",
                        content: "width=device-width, initial-scale=1"
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 401,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("link", {
                        rel: "icon",
                        href: "/favicon.ico"
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 402,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 399,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    minHeight: '100vh',
                    backgroundColor: 'rgb(250, 250, 250)',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("nav", {
                        style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 24px',
                            backgroundColor: 'rgb(255, 255, 255)',
                            borderBottom: '1px solid rgb(226, 232, 240)'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    fontWeight: 600,
                                    fontSize: '1.125rem',
                                    color: 'rgb(15, 23, 42)'
                                },
                                children: "BizKit AI"
                            }, void 0, false, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 423,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                },
                                children: authLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    style: {
                                        fontSize: '0.875rem',
                                        color: 'rgb(148, 163, 184)'
                                    },
                                    children: "Loading..."
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.tsx",
                                    lineNumber: 428,
                                    columnNumber: 15
                                }, this) : isAuthenticated && user ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>setShowHistory(!showHistory),
                                            style: {
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '8px 14px',
                                                fontSize: '0.8125rem',
                                                fontWeight: 500,
                                                color: 'rgb(71, 85, 105)',
                                                backgroundColor: 'rgb(241, 245, 249)',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer'
                                            },
                                            "data-testid": "button-history",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                    width: "14",
                                                    height: "14",
                                                    viewBox: "0 0 24 24",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    strokeWidth: "2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("circle", {
                                                            cx: "12",
                                                            cy: "12",
                                                            r: "10"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/index.tsx",
                                                            lineNumber: 450,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("polyline", {
                                                            points: "12 6 12 12 16 14"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/index.tsx",
                                                            lineNumber: 451,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 449,
                                                    columnNumber: 19
                                                }, this),
                                                "History"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/index.tsx",
                                            lineNumber: 431,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            style: {
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            },
                                            children: [
                                                user.profileImageUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                                                    src: user.profileImageUrl,
                                                    alt: "Profile",
                                                    style: {
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '50%',
                                                        objectFit: 'cover'
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 457,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                    style: {
                                                        fontSize: '0.875rem',
                                                        color: 'rgb(51, 65, 85)'
                                                    },
                                                    "data-testid": "text-username",
                                                    children: user.firstName || user.email || 'User'
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 468,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/index.tsx",
                                            lineNumber: 455,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                            href: "/api/logout",
                                            style: {
                                                padding: '8px 14px',
                                                fontSize: '0.8125rem',
                                                fontWeight: 500,
                                                color: 'rgb(239, 68, 68)',
                                                backgroundColor: 'rgb(254, 242, 242)',
                                                border: 'none',
                                                borderRadius: '6px',
                                                textDecoration: 'none',
                                                cursor: 'pointer'
                                            },
                                            "data-testid": "button-logout",
                                            children: "Log out"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/index.tsx",
                                            lineNumber: 472,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                    href: "/api/login",
                                    style: {
                                        padding: '8px 16px',
                                        fontSize: '0.8125rem',
                                        fontWeight: 500,
                                        color: 'rgb(255, 255, 255)',
                                        backgroundColor: 'rgb(99, 102, 241)',
                                        border: 'none',
                                        borderRadius: '6px',
                                        textDecoration: 'none',
                                        cursor: 'pointer'
                                    },
                                    "data-testid": "button-login",
                                    children: "Log in"
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.tsx",
                                    lineNumber: 491,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 426,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 413,
                        columnNumber: 9
                    }, this),
                    showHistory && isAuthenticated && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            width: '400px',
                            maxWidth: '100vw',
                            height: '100vh',
                            backgroundColor: 'rgb(255, 255, 255)',
                            borderLeft: '1px solid rgb(226, 232, 240)',
                            boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.1)',
                            zIndex: 100,
                            display: 'flex',
                            flexDirection: 'column'
                        },
                        "data-testid": "panel-history",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px 20px',
                                    borderBottom: '1px solid rgb(226, 232, 240)'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                        style: {
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            color: 'rgb(15, 23, 42)',
                                            margin: 0
                                        },
                                        children: "Generation History"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 540,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>setShowHistory(false),
                                        style: {
                                            padding: '6px',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'rgb(148, 163, 184)'
                                        },
                                        "data-testid": "button-close-history",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                            width: "20",
                                            height: "20",
                                            viewBox: "0 0 24 24",
                                            fill: "none",
                                            stroke: "currentColor",
                                            strokeWidth: "2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
                                                    x1: "18",
                                                    y1: "6",
                                                    x2: "6",
                                                    y2: "18"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 556,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
                                                    x1: "6",
                                                    y1: "6",
                                                    x2: "18",
                                                    y2: "18"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 557,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/index.tsx",
                                            lineNumber: 555,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 543,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 531,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    flex: 1,
                                    overflowY: 'auto',
                                    padding: '16px'
                                },
                                children: historyLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    style: {
                                        textAlign: 'center',
                                        color: 'rgb(148, 163, 184)',
                                        padding: '40px 0'
                                    },
                                    children: "Loading..."
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.tsx",
                                    lineNumber: 569,
                                    columnNumber: 17
                                }, this) : generations.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    style: {
                                        textAlign: 'center',
                                        color: 'rgb(148, 163, 184)',
                                        padding: '40px 0'
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                            width: "40",
                                            height: "40",
                                            viewBox: "0 0 24 24",
                                            fill: "none",
                                            stroke: "currentColor",
                                            strokeWidth: "1.5",
                                            style: {
                                                margin: '0 auto 12px'
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("circle", {
                                                    cx: "12",
                                                    cy: "12",
                                                    r: "10"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 575,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("polyline", {
                                                    points: "12 6 12 12 16 14"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 576,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/index.tsx",
                                            lineNumber: 574,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                            style: {
                                                fontSize: '0.875rem'
                                            },
                                            children: "No saved generations yet"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/index.tsx",
                                            lineNumber: 578,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                            style: {
                                                fontSize: '0.75rem',
                                                marginTop: '4px'
                                            },
                                            children: "Generate content and save it to see your history"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/index.tsx",
                                            lineNumber: 579,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/index.tsx",
                                    lineNumber: 573,
                                    columnNumber: 17
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    },
                                    children: generations.map((gen)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            style: {
                                                padding: '14px',
                                                backgroundColor: 'rgb(248, 250, 252)',
                                                borderRadius: '6px',
                                                border: '1px solid rgb(226, 232, 240)'
                                            },
                                            "data-testid": `history-item-${gen.id}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'flex-start',
                                                        marginBottom: '8px'
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            style: {
                                                                display: 'inline-block',
                                                                padding: '4px 8px',
                                                                fontSize: '0.6875rem',
                                                                fontWeight: 500,
                                                                backgroundColor: 'rgb(238, 242, 255)',
                                                                color: 'rgb(99, 102, 241)',
                                                                borderRadius: '4px',
                                                                textTransform: 'uppercase'
                                                            },
                                                            children: tabLabels[gen.toolType] || gen.toolType
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/index.tsx",
                                                            lineNumber: 595,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            style: {
                                                                fontSize: '0.6875rem',
                                                                color: 'rgb(148, 163, 184)'
                                                            },
                                                            children: new Date(gen.createdAt).toLocaleDateString()
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/index.tsx",
                                                            lineNumber: 609,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 594,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                    style: {
                                                        fontSize: '0.8125rem',
                                                        color: 'rgb(51, 65, 85)',
                                                        lineHeight: 1.5,
                                                        marginBottom: '12px',
                                                        overflow: 'hidden',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 3,
                                                        WebkitBoxOrient: 'vertical'
                                                    },
                                                    children: [
                                                        gen.output.substring(0, 150),
                                                        "..."
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 613,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        display: 'flex',
                                                        gap: '8px'
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                            type: "button",
                                                            onClick: ()=>loadGeneration(gen),
                                                            style: {
                                                                flex: 1,
                                                                padding: '6px 10px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 500,
                                                                color: 'rgb(99, 102, 241)',
                                                                backgroundColor: 'rgb(255, 255, 255)',
                                                                border: '1px solid rgb(199, 210, 254)',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer'
                                                            },
                                                            "data-testid": `button-load-${gen.id}`,
                                                            children: "Load"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/index.tsx",
                                                            lineNumber: 628,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                            type: "button",
                                                            onClick: ()=>deleteGeneration(gen.id),
                                                            style: {
                                                                padding: '6px 10px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 500,
                                                                color: 'rgb(239, 68, 68)',
                                                                backgroundColor: 'rgb(255, 255, 255)',
                                                                border: '1px solid rgb(254, 202, 202)',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer'
                                                            },
                                                            "data-testid": `button-delete-${gen.id}`,
                                                            children: "Delete"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/index.tsx",
                                                            lineNumber: 646,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/index.tsx",
                                                    lineNumber: 627,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, gen.id, true, {
                                            fileName: "[project]/pages/index.tsx",
                                            lineNumber: 584,
                                            columnNumber: 21
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.tsx",
                                    lineNumber: 582,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 561,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 514,
                        columnNumber: 11
                    }, this),
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
                                    lineNumber: 682,
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
                                    lineNumber: 695,
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
                                    lineNumber: 706,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/index.tsx",
                            lineNumber: 681,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 673,
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
                                        lineNumber: 743,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 733,
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
                                                                lineNumber: 793,
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
                                                                lineNumber: 805,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 792,
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
                                                                lineNumber: 826,
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
                                                                lineNumber: 838,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 825,
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
                                                                lineNumber: 859,
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
                                                                lineNumber: 871,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 858,
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
                                                                lineNumber: 892,
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
                                                                lineNumber: 904,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 891,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 791,
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
                                                                lineNumber: 931,
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
                                                                lineNumber: 943,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 930,
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
                                                                lineNumber: 964,
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
                                                                lineNumber: 976,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 963,
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
                                                                lineNumber: 999,
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
                                                                lineNumber: 1011,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 998,
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
                                                                lineNumber: 1034,
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
                                                                lineNumber: 1046,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1033,
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
                                                                lineNumber: 1067,
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
                                                                lineNumber: 1079,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1066,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 929,
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
                                                                lineNumber: 1106,
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
                                                                lineNumber: 1118,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1105,
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
                                                                lineNumber: 1139,
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
                                                                lineNumber: 1151,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1138,
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
                                                                lineNumber: 1172,
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
                                                                lineNumber: 1184,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1171,
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
                                                                lineNumber: 1207,
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
                                                                lineNumber: 1219,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1206,
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
                                                                lineNumber: 1240,
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
                                                                lineNumber: 1252,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1239,
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
                                                                lineNumber: 1273,
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
                                                                lineNumber: 1285,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1272,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 1104,
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
                                                                lineNumber: 1312,
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
                                                                lineNumber: 1324,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1311,
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
                                                                lineNumber: 1345,
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
                                                                lineNumber: 1357,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1344,
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
                                                                lineNumber: 1378,
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
                                                                lineNumber: 1390,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1377,
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
                                                                lineNumber: 1411,
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
                                                                lineNumber: 1423,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1410,
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
                                                                lineNumber: 1444,
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
                                                                lineNumber: 1456,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1443,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 1310,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 780,
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
                                        lineNumber: 1481,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 779,
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
                                lineNumber: 1509,
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
                                                lineNumber: 1538,
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
                                                                        lineNumber: 1581,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                                        d: "M21 3v5h-5"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 1582,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1568,
                                                                columnNumber: 21
                                                            }, this),
                                                            isLoading ? 'Regenerating...' : 'Regenerate'
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1548,
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
                                                                        lineNumber: 1633,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/index.tsx",
                                                                    lineNumber: 1623,
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
                                                                            lineNumber: 1649,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
                                                                            x1: "15",
                                                                            y1: "9",
                                                                            x2: "9",
                                                                            y2: "15"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 1650,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
                                                                            x1: "9",
                                                                            y1: "9",
                                                                            x2: "15",
                                                                            y2: "15"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 1651,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/index.tsx",
                                                                    lineNumber: 1639,
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
                                                                            lineNumber: 1667,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                                            d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 1668,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/index.tsx",
                                                                    lineNumber: 1657,
                                                                    columnNumber: 25
                                                                }, this),
                                                                "Copy"
                                                            ]
                                                        }, void 0, true)
                                                    }, void 0, false, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1586,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            position: 'relative'
                                                        },
                                                        ref: exportMenuRef,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                                type: "button",
                                                                onClick: ()=>setShowExportMenu(!showExportMenu),
                                                                style: {
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    padding: '8px 16px',
                                                                    fontSize: '0.8125rem',
                                                                    fontWeight: 500,
                                                                    color: 'rgb(71, 85, 105)',
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease'
                                                                },
                                                                "data-testid": "button-export",
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
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                                                d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/pages/index.tsx",
                                                                                lineNumber: 1704,
                                                                                columnNumber: 25
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("polyline", {
                                                                                points: "7 10 12 15 17 10"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/pages/index.tsx",
                                                                                lineNumber: 1705,
                                                                                columnNumber: 25
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
                                                                                x1: "12",
                                                                                y1: "15",
                                                                                x2: "12",
                                                                                y2: "3"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/pages/index.tsx",
                                                                                lineNumber: 1706,
                                                                                columnNumber: 25
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 1694,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    "Export",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                                        width: "12",
                                                                        height: "12",
                                                                        viewBox: "0 0 24 24",
                                                                        fill: "none",
                                                                        stroke: "currentColor",
                                                                        strokeWidth: "2",
                                                                        strokeLinecap: "round",
                                                                        strokeLinejoin: "round",
                                                                        style: {
                                                                            transform: showExportMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                                                                            transition: 'transform 0.2s ease'
                                                                        },
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("polyline", {
                                                                            points: "6 9 12 15 18 9"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/index.tsx",
                                                                            lineNumber: 1723,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 1709,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1675,
                                                                columnNumber: 21
                                                            }, this),
                                                            showExportMenu && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    position: 'absolute',
                                                                    top: 'calc(100% + 4px)',
                                                                    right: 0,
                                                                    backgroundColor: 'rgb(255, 255, 255)',
                                                                    border: '1px solid rgb(226, 232, 240)',
                                                                    borderRadius: '6px',
                                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                                                    zIndex: 50,
                                                                    minWidth: '160px',
                                                                    overflow: 'hidden'
                                                                },
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                                        type: "button",
                                                                        onClick: handleExportText,
                                                                        style: {
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                            width: '100%',
                                                                            padding: '10px 14px',
                                                                            fontSize: '0.8125rem',
                                                                            fontWeight: 500,
                                                                            color: 'rgb(51, 65, 85)',
                                                                            backgroundColor: 'transparent',
                                                                            border: 'none',
                                                                            cursor: 'pointer',
                                                                            textAlign: 'left'
                                                                        },
                                                                        "data-testid": "button-export-txt",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                                                width: "16",
                                                                                height: "16",
                                                                                viewBox: "0 0 24 24",
                                                                                fill: "none",
                                                                                stroke: "currentColor",
                                                                                strokeWidth: "2",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                                                        d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/pages/index.tsx",
                                                                                        lineNumber: 1761,
                                                                                        columnNumber: 29
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("polyline", {
                                                                                        points: "14 2 14 8 20 8"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/pages/index.tsx",
                                                                                        lineNumber: 1762,
                                                                                        columnNumber: 29
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
                                                                                        x1: "16",
                                                                                        y1: "13",
                                                                                        x2: "8",
                                                                                        y2: "13"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/pages/index.tsx",
                                                                                        lineNumber: 1763,
                                                                                        columnNumber: 29
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
                                                                                        x1: "16",
                                                                                        y1: "17",
                                                                                        x2: "8",
                                                                                        y2: "17"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/pages/index.tsx",
                                                                                        lineNumber: 1764,
                                                                                        columnNumber: 29
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/pages/index.tsx",
                                                                                lineNumber: 1760,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            "Plain Text (.txt)"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 1741,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                                        type: "button",
                                                                        onClick: handleExportPDF,
                                                                        disabled: exportState === 'exporting',
                                                                        style: {
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                            width: '100%',
                                                                            padding: '10px 14px',
                                                                            fontSize: '0.8125rem',
                                                                            fontWeight: 500,
                                                                            color: exportState === 'exporting' ? 'rgb(148, 163, 184)' : 'rgb(51, 65, 85)',
                                                                            backgroundColor: 'transparent',
                                                                            border: 'none',
                                                                            cursor: exportState === 'exporting' ? 'not-allowed' : 'pointer',
                                                                            textAlign: 'left'
                                                                        },
                                                                        "data-testid": "button-export-pdf",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                                                width: "16",
                                                                                height: "16",
                                                                                viewBox: "0 0 24 24",
                                                                                fill: "none",
                                                                                stroke: "rgb(239, 68, 68)",
                                                                                strokeWidth: "2",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                                                        d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/pages/index.tsx",
                                                                                        lineNumber: 1789,
                                                                                        columnNumber: 29
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("polyline", {
                                                                                        points: "14 2 14 8 20 8"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/pages/index.tsx",
                                                                                        lineNumber: 1790,
                                                                                        columnNumber: 29
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/pages/index.tsx",
                                                                                lineNumber: 1788,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            "PDF Document (.pdf)"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 1768,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                                        type: "button",
                                                                        onClick: handleExportWord,
                                                                        disabled: exportState === 'exporting',
                                                                        style: {
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                            width: '100%',
                                                                            padding: '10px 14px',
                                                                            fontSize: '0.8125rem',
                                                                            fontWeight: 500,
                                                                            color: exportState === 'exporting' ? 'rgb(148, 163, 184)' : 'rgb(51, 65, 85)',
                                                                            backgroundColor: 'transparent',
                                                                            border: 'none',
                                                                            cursor: exportState === 'exporting' ? 'not-allowed' : 'pointer',
                                                                            textAlign: 'left'
                                                                        },
                                                                        "data-testid": "button-export-docx",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                                                width: "16",
                                                                                height: "16",
                                                                                viewBox: "0 0 24 24",
                                                                                fill: "none",
                                                                                stroke: "rgb(37, 99, 235)",
                                                                                strokeWidth: "2",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                                                        d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/pages/index.tsx",
                                                                                        lineNumber: 1815,
                                                                                        columnNumber: 29
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("polyline", {
                                                                                        points: "14 2 14 8 20 8"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/pages/index.tsx",
                                                                                        lineNumber: 1816,
                                                                                        columnNumber: 29
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/pages/index.tsx",
                                                                                lineNumber: 1814,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            "Word Document (.docx)"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 1794,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1727,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1674,
                                                        columnNumber: 19
                                                    }, this),
                                                    isAuthenticated && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: saveGeneration,
                                                        style: {
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            padding: '8px 16px',
                                                            fontSize: '0.8125rem',
                                                            fontWeight: 500,
                                                            color: 'rgb(255, 255, 255)',
                                                            backgroundColor: 'rgb(99, 102, 241)',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease'
                                                        },
                                                        "data-testid": "button-save",
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
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                                        d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 1853,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("polyline", {
                                                                        points: "17 21 17 13 7 13 7 21"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 1854,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("polyline", {
                                                                        points: "7 3 7 8 15 8"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/index.tsx",
                                                                        lineNumber: 1855,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/index.tsx",
                                                                lineNumber: 1843,
                                                                columnNumber: 23
                                                            }, this),
                                                            "Save"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/index.tsx",
                                                        lineNumber: 1824,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/index.tsx",
                                                lineNumber: 1547,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/index.tsx",
                                        lineNumber: 1528,
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
                                        lineNumber: 1862,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/index.tsx",
                                lineNumber: 1527,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 725,
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
                            lineNumber: 1893,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/index.tsx",
                        lineNumber: 1885,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/index.tsx",
                lineNumber: 405,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__64895f8c._.js.map