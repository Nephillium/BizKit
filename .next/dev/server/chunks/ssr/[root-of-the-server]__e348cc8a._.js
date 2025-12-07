module.exports = [
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
    const fetchUser = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useCallback"])(async ()=>{
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.ok && data.user) {
                    setState({
                        user: data.user,
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
            } else {
                setState({
                    user: null,
                    isLoading: false,
                    isAuthenticated: false
                });
            }
        } catch  {
            setState({
                user: null,
                isLoading: false,
                isAuthenticated: false
            });
        }
    }, []);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        fetchUser();
    }, [
        fetchUser
    ]);
    const login = async (email, password)=>{
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    email,
                    password
                })
            });
            const data = await response.json();
            if (data.ok) {
                await fetchUser();
                return {
                    ok: true
                };
            }
            return {
                ok: false,
                error: data.error || 'Login failed'
            };
        } catch  {
            return {
                ok: false,
                error: 'Network error'
            };
        }
    };
    const register = async (email, password)=>{
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    email,
                    password
                })
            });
            const data = await response.json();
            if (data.ok) {
                await fetchUser();
                return {
                    ok: true
                };
            }
            return {
                ok: false,
                error: data.error || 'Registration failed'
            };
        } catch  {
            return {
                ok: false,
                error: 'Network error'
            };
        }
    };
    const logout = async ()=>{
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch  {}
        setState({
            user: null,
            isLoading: false,
            isAuthenticated: false
        });
    };
    return {
        ...state,
        login,
        register,
        logout,
        refresh: fetchUser
    };
}
}),
"[project]/lib/translations.ts [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getTranslation",
    ()=>getTranslation,
    "translations",
    ()=>translations
]);
const translations = {
    en: {
        appName: 'BizKit AI',
        login: 'Log in',
        logout: 'Log out',
        admin: 'Admin',
        history: 'History',
        loading: 'Loading...',
        generate: 'Generate',
        generating: 'Generating...',
        regenerate: 'Regenerate',
        copy: 'Copy',
        copied: 'Copied!',
        export: 'Export',
        exportTxt: 'Export as TXT',
        exportPdf: 'Export as PDF',
        exportDocx: 'Export as DOCX',
        advancedOptions: 'Advanced Options',
        hideAdvanced: 'Hide Advanced',
        // Auth Modal
        welcomeBack: 'Welcome Back',
        createAccount: 'Create Account',
        loginAccess: 'Log in to access unlimited generations',
        registerAccess: 'Register for free unlimited access',
        email: 'Email',
        password: 'Password',
        emailPlaceholder: 'your@email.com',
        passwordPlaceholder: 'Enter password',
        pleaseWait: 'Please wait...',
        noAccount: "Don't have an account? Register",
        hasAccount: 'Already have an account? Log in',
        cancel: 'Cancel',
        freeTrialUsed: 'Your free trial is used. Register or log in for unlimited access.',
        // Subscription Modal
        freeTrialTitle: 'Free Trial Used',
        freeTrialMessage: "You've used your free generation. Subscribe to unlock unlimited access to all content generation tools.",
        signInFirst: 'Please sign in first to subscribe:',
        signInReplit: 'Sign In with Replit',
        contactSubscribe: 'Contact to Subscribe',
        maybeLater: 'Maybe Later',
        // Tabs
        coldEmail: 'Cold Email',
        proposal: 'Proposal',
        contract: 'Contract',
        socialPack: 'Social Pack',
        // Cold Email Form
        targetAudience: 'Target Audience',
        targetPlaceholder: 'e.g., Tech startups, Real estate agents',
        serviceOffered: 'Service Offered',
        servicePlaceholder: 'e.g., Web development, Marketing consulting',
        tone: 'Tone',
        tonePlaceholder: 'e.g., Professional, Friendly, Casual',
        language: 'Language',
        // Proposal Form
        clientType: 'Client Type',
        clientTypePlaceholder: 'e.g., Small business, Enterprise, Startup',
        projectScope: 'Project Scope',
        projectScopePlaceholder: 'Describe the project scope...',
        deliverables: 'Deliverables',
        deliverablesPlaceholder: 'List main deliverables...',
        budgetRange: 'Budget Range',
        budgetPlaceholder: 'e.g., $5,000-$10,000',
        // Contract Form
        clientName: 'Client Name',
        clientNamePlaceholder: 'Full legal name of client',
        providerName: 'Provider Name (You)',
        providerPlaceholder: 'Your business name',
        serviceDescription: 'Service Description',
        serviceDescPlaceholder: 'Describe services to be provided...',
        paymentTerms: 'Payment Terms',
        paymentPlaceholder: 'e.g., 50% upfront, 50% on completion',
        jurisdiction: 'Jurisdiction',
        jurisdictionPlaceholder: 'e.g., California, USA',
        // Social Pack Form
        businessType: 'Business Type',
        businessPlaceholder: 'e.g., Restaurant, SaaS, E-commerce',
        niche: 'Niche',
        nichePlaceholder: 'e.g., Vegan food, Project management',
        platform: 'Platform',
        platformPlaceholder: 'e.g., Instagram, LinkedIn, Twitter',
        // Premium Options
        aiModel: 'AI Model',
        outputLength: 'Output Length',
        short: 'Short',
        standard: 'Standard',
        detailed: 'Detailed',
        creativity: 'Creativity',
        customInstructions: 'Custom Instructions',
        customPlaceholder: 'Add any specific requirements...',
        // History
        generationHistory: 'Generation History',
        noHistory: 'No generations yet. Create your first content!',
        load: 'Load',
        delete: 'Delete',
        // Credits
        credits: 'Credits',
        creditsLeft: 'credits left',
        buyCredits: 'Buy Credits',
        unlimitedCredits: 'Unlimited',
        // Beta badge
        betaBadge: 'Free beta – Pro plans coming soon',
        // Footer
        footer: 'BizKit AI – Beta v1.0',
        // Errors
        networkError: 'Network error. Please check your connection and try again.',
        apiKeyError: 'OpenAI API key is not configured. Please add your API key.',
        generationError: 'An error occurred while generating content. Please try again.'
    },
    tr: {
        appName: 'BizKit AI',
        login: 'Giriş Yap',
        logout: 'Çıkış Yap',
        admin: 'Yönetici',
        history: 'Geçmiş',
        loading: 'Yükleniyor...',
        generate: 'Oluştur',
        generating: 'Oluşturuluyor...',
        regenerate: 'Yeniden Oluştur',
        copy: 'Kopyala',
        copied: 'Kopyalandı!',
        export: 'Dışa Aktar',
        exportTxt: 'TXT olarak kaydet',
        exportPdf: 'PDF olarak kaydet',
        exportDocx: 'DOCX olarak kaydet',
        advancedOptions: 'Gelişmiş Seçenekler',
        hideAdvanced: 'Gizle',
        // Auth Modal
        welcomeBack: 'Tekrar Hoş Geldiniz',
        createAccount: 'Hesap Oluştur',
        loginAccess: 'Sınırsız içerik oluşturmak için giriş yapın',
        registerAccess: 'Ücretsiz sınırsız erişim için kayıt olun',
        email: 'E-posta',
        password: 'Şifre',
        emailPlaceholder: 'ornek@email.com',
        passwordPlaceholder: 'Şifrenizi girin',
        pleaseWait: 'Lütfen bekleyin...',
        noAccount: 'Hesabınız yok mu? Kayıt olun',
        hasAccount: 'Zaten hesabınız var mı? Giriş yapın',
        cancel: 'İptal',
        freeTrialUsed: 'Ücretsiz denemeniz kullanıldı. Sınırsız erişim için kayıt olun veya giriş yapın.',
        // Subscription Modal
        freeTrialTitle: 'Ücretsiz Deneme Kullanıldı',
        freeTrialMessage: 'Ücretsiz içerik oluşturma hakkınızı kullandınız. Tüm araçlara sınırsız erişim için abone olun.',
        signInFirst: 'Abone olmak için önce giriş yapın:',
        signInReplit: 'Replit ile Giriş Yap',
        contactSubscribe: 'Abonelik için İletişim',
        maybeLater: 'Daha Sonra',
        // Tabs
        coldEmail: 'Soğuk E-posta',
        proposal: 'Teklif',
        contract: 'Sözleşme',
        socialPack: 'Sosyal Medya',
        // Cold Email Form
        targetAudience: 'Hedef Kitle',
        targetPlaceholder: 'örn. Teknoloji girişimleri, Emlak danışmanları',
        serviceOffered: 'Sunulan Hizmet',
        servicePlaceholder: 'örn. Web geliştirme, Pazarlama danışmanlığı',
        tone: 'Üslup',
        tonePlaceholder: 'örn. Profesyonel, Samimi, Resmi',
        language: 'Dil',
        // Proposal Form
        clientType: 'Müşteri Tipi',
        clientTypePlaceholder: 'örn. Küçük işletme, Kurumsal, Startup',
        projectScope: 'Proje Kapsamı',
        projectScopePlaceholder: 'Proje kapsamını açıklayın...',
        deliverables: 'Teslim Edilecekler',
        deliverablesPlaceholder: 'Ana teslim edilecekleri listeleyin...',
        budgetRange: 'Bütçe Aralığı',
        budgetPlaceholder: 'örn. 50.000₺-100.000₺',
        // Contract Form
        clientName: 'Müşteri Adı',
        clientNamePlaceholder: 'Müşterinin tam yasal adı',
        providerName: 'Sağlayıcı Adı (Siz)',
        providerPlaceholder: 'İşletme adınız',
        serviceDescription: 'Hizmet Açıklaması',
        serviceDescPlaceholder: 'Sağlanacak hizmetleri açıklayın...',
        paymentTerms: 'Ödeme Koşulları',
        paymentPlaceholder: 'örn. %50 peşin, %50 teslimde',
        jurisdiction: 'Yetki Alanı',
        jurisdictionPlaceholder: 'örn. İstanbul, Türkiye',
        // Social Pack Form
        businessType: 'İşletme Türü',
        businessPlaceholder: 'örn. Restoran, SaaS, E-ticaret',
        niche: 'Niş',
        nichePlaceholder: 'örn. Vegan yemek, Proje yönetimi',
        platform: 'Platform',
        platformPlaceholder: 'örn. Instagram, LinkedIn, Twitter',
        // Premium Options
        aiModel: 'Yapay Zeka Modeli',
        outputLength: 'Çıktı Uzunluğu',
        short: 'Kısa',
        standard: 'Standart',
        detailed: 'Detaylı',
        creativity: 'Yaratıcılık',
        customInstructions: 'Özel Talimatlar',
        customPlaceholder: 'Özel gereksinimlerinizi ekleyin...',
        // History
        generationHistory: 'Oluşturma Geçmişi',
        noHistory: 'Henüz içerik yok. İlk içeriğinizi oluşturun!',
        load: 'Yükle',
        delete: 'Sil',
        // Credits
        credits: 'Kredi',
        creditsLeft: 'kredi kaldı',
        buyCredits: 'Kredi Satın Al',
        unlimitedCredits: 'Sınırsız',
        // Beta badge
        betaBadge: 'Ücretsiz beta – Pro planlar yakında',
        // Footer
        footer: 'BizKit AI – Beta v1.0',
        // Errors
        networkError: 'Ağ hatası. Lütfen bağlantınızı kontrol edip tekrar deneyin.',
        apiKeyError: 'OpenAI API anahtarı yapılandırılmamış. Lütfen API anahtarınızı ekleyin.',
        generationError: 'İçerik oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.'
    }
};
function getTranslation(lang) {
    return translations[lang];
}
}),
"[project]/pages/buy-credits.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BuyCredits
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/head.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useAuth$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/useAuth.ts [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$translations$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/translations.ts [ssr] (ecmascript)");
;
;
;
;
;
const CREDIT_PACKAGES = [
    {
        id: 'credits_10',
        credits: 10,
        price: 500,
        name: '10 Credits'
    },
    {
        id: 'credits_50',
        credits: 50,
        price: 2000,
        name: '50 Credits',
        popular: true
    },
    {
        id: 'credits_100',
        credits: 100,
        price: 3500,
        name: '100 Credits'
    }
];
function BuyCredits() {
    const { user, isLoading, isAuthenticated, refresh } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useAuth$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const [lang, setLang] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('en');
    const [purchasing, setPurchasing] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const savedLang = localStorage.getItem('bizkit_lang');
        if (savedLang && (savedLang === 'en' || savedLang === 'tr')) {
            setLang(savedLang);
        }
    }, []);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'true') {
            setMessage({
                type: 'success',
                text: lang === 'tr' ? 'Krediler hesabiniza eklendi!' : 'Credits have been added to your account!'
            });
            refresh();
            window.history.replaceState({}, '', '/buy-credits');
        } else if (params.get('canceled') === 'true') {
            setMessage({
                type: 'error',
                text: lang === 'tr' ? 'Odeme iptal edildi.' : 'Payment was canceled.'
            });
            window.history.replaceState({}, '', '/buy-credits');
        }
    }, [
        lang,
        refresh
    ]);
    const t = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$translations$2e$ts__$5b$ssr$5d$__$28$ecmascript$29$__["translations"][lang];
    const handlePurchase = async (packageId)=>{
        setPurchasing(packageId);
        setMessage(null);
        try {
            const response = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                credentials: 'include',
                cache: 'no-store',
                body: JSON.stringify({
                    packageId
                })
            });
            if (!response.ok) {
                const text = await response.text().catch(()=>'');
                console.error('Checkout error:', response.status, text);
                setMessage({
                    type: 'error',
                    text: 'Failed to create checkout session'
                });
                return;
            }
            const data = await response.json();
            if (!data || !data.url) {
                console.error('No checkout URL returned:', data);
                setMessage({
                    type: 'error',
                    text: data.error || 'Failed to create checkout session'
                });
                return;
            }
            window.location.href = data.url;
        } catch (error) {
            console.error('Checkout request failed:', error);
            setMessage({
                type: 'error',
                text: 'Network error. Please try again.'
            });
        } finally{
            setPurchasing(null);
        }
    };
    if (isLoading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            style: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh'
            },
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    fontSize: '1rem',
                    color: 'rgb(100, 116, 139)'
                },
                children: t.loading
            }, void 0, false, {
                fileName: "[project]/pages/buy-credits.tsx",
                lineNumber: 91,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/pages/buy-credits.tsx",
            lineNumber: 90,
            columnNumber: 7
        }, this);
    }
    if (!isAuthenticated) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            style: {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                padding: '20px'
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("title", {
                        children: "Buy Credits - BizKit AI"
                    }, void 0, false, {
                        fileName: "[project]/pages/buy-credits.tsx",
                        lineNumber: 100,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/pages/buy-credits.tsx",
                    lineNumber: 99,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                    style: {
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        marginBottom: '16px',
                        color: 'rgb(15, 23, 42)'
                    },
                    children: lang === 'tr' ? 'Giris Yapmaniz Gerekiyor' : 'Please Log In'
                }, void 0, false, {
                    fileName: "[project]/pages/buy-credits.tsx",
                    lineNumber: 102,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                    style: {
                        fontSize: '1rem',
                        color: 'rgb(100, 116, 139)',
                        marginBottom: '24px'
                    },
                    children: lang === 'tr' ? 'Kredi satin almak icin giris yapmaniz gerekiyor.' : 'You need to log in to purchase credits.'
                }, void 0, false, {
                    fileName: "[project]/pages/buy-credits.tsx",
                    lineNumber: 105,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                    onClick: ()=>window.location.href = '/',
                    style: {
                        padding: '12px 24px',
                        fontSize: '1rem',
                        fontWeight: 500,
                        color: 'white',
                        backgroundColor: 'rgb(99, 102, 241)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    },
                    "data-testid": "button-go-home",
                    children: lang === 'tr' ? 'Ana Sayfaya Don' : 'Go to Home'
                }, void 0, false, {
                    fileName: "[project]/pages/buy-credits.tsx",
                    lineNumber: 108,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/pages/buy-credits.tsx",
            lineNumber: 98,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        style: {
            minHeight: '100vh',
            backgroundColor: 'rgb(248, 250, 252)'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("title", {
                        children: "Buy Credits - BizKit AI"
                    }, void 0, false, {
                        fileName: "[project]/pages/buy-credits.tsx",
                        lineNumber: 131,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("meta", {
                        name: "description",
                        content: "Purchase credits for BizKit AI content generation"
                    }, void 0, false, {
                        fileName: "[project]/pages/buy-credits.tsx",
                        lineNumber: 132,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/buy-credits.tsx",
                lineNumber: 130,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("nav", {
                style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 24px',
                    backgroundColor: 'white',
                    borderBottom: '1px solid rgb(226, 232, 240)'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                        href: "/",
                        style: {
                            fontWeight: 600,
                            fontSize: '1.125rem',
                            color: 'rgb(15, 23, 42)',
                            textDecoration: 'none'
                        },
                        children: "BizKit AI"
                    }, void 0, false, {
                        fileName: "[project]/pages/buy-credits.tsx",
                        lineNumber: 145,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                style: {
                                    fontSize: '0.875rem',
                                    color: 'rgb(51, 65, 85)'
                                },
                                children: user?.email
                            }, void 0, false, {
                                fileName: "[project]/pages/buy-credits.tsx",
                                lineNumber: 149,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                style: {
                                    fontSize: '0.875rem',
                                    color: 'rgb(100, 116, 139)',
                                    backgroundColor: 'rgb(241, 245, 249)',
                                    padding: '4px 12px',
                                    borderRadius: '20px'
                                },
                                children: [
                                    user?.credits ?? 0,
                                    " ",
                                    t.creditsLeft
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/buy-credits.tsx",
                                lineNumber: 152,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/buy-credits.tsx",
                        lineNumber: 148,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/buy-credits.tsx",
                lineNumber: 135,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("main", {
                style: {
                    maxWidth: '900px',
                    margin: '0 auto',
                    padding: '48px 24px'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            textAlign: 'center',
                            marginBottom: '48px'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                                style: {
                                    fontSize: '2rem',
                                    fontWeight: 700,
                                    color: 'rgb(15, 23, 42)',
                                    marginBottom: '12px'
                                },
                                children: t.buyCredits
                            }, void 0, false, {
                                fileName: "[project]/pages/buy-credits.tsx",
                                lineNumber: 160,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                style: {
                                    fontSize: '1.125rem',
                                    color: 'rgb(100, 116, 139)'
                                },
                                children: lang === 'tr' ? 'Icerlik olusturmak icin kredi satin alin' : 'Purchase credits to generate content'
                            }, void 0, false, {
                                fileName: "[project]/pages/buy-credits.tsx",
                                lineNumber: 163,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/buy-credits.tsx",
                        lineNumber: 159,
                        columnNumber: 9
                    }, this),
                    message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            padding: '16px',
                            marginBottom: '24px',
                            borderRadius: '8px',
                            backgroundColor: message.type === 'success' ? 'rgb(220, 252, 231)' : 'rgb(254, 226, 226)',
                            color: message.type === 'success' ? 'rgb(22, 101, 52)' : 'rgb(153, 27, 27)',
                            textAlign: 'center'
                        },
                        "data-testid": "message-status",
                        children: message.text
                    }, void 0, false, {
                        fileName: "[project]/pages/buy-credits.tsx",
                        lineNumber: 169,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                            gap: '24px'
                        },
                        children: CREDIT_PACKAGES.map((pkg)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    position: 'relative',
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    padding: '32px 24px',
                                    boxShadow: pkg.popular ? '0 4px 20px rgba(99, 102, 241, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                                    border: pkg.popular ? '2px solid rgb(99, 102, 241)' : '1px solid rgb(226, 232, 240)',
                                    textAlign: 'center'
                                },
                                "data-testid": `card-package-${pkg.id}`,
                                children: [
                                    pkg.popular && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        style: {
                                            position: 'absolute',
                                            top: '-12px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            backgroundColor: 'rgb(99, 102, 241)',
                                            color: 'white',
                                            padding: '4px 16px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600
                                        },
                                        children: lang === 'tr' ? 'En Populer' : 'Most Popular'
                                    }, void 0, false, {
                                        fileName: "[project]/pages/buy-credits.tsx",
                                        lineNumber: 200,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                        style: {
                                            fontSize: '1.25rem',
                                            fontWeight: 600,
                                            color: 'rgb(15, 23, 42)',
                                            marginBottom: '8px'
                                        },
                                        children: pkg.name
                                    }, void 0, false, {
                                        fileName: "[project]/pages/buy-credits.tsx",
                                        lineNumber: 218,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: '2.5rem',
                                            fontWeight: 700,
                                            color: 'rgb(99, 102, 241)',
                                            marginBottom: '8px'
                                        },
                                        children: [
                                            "$",
                                            (pkg.price / 100).toFixed(2)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/buy-credits.tsx",
                                        lineNumber: 222,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                        style: {
                                            fontSize: '0.875rem',
                                            color: 'rgb(100, 116, 139)',
                                            marginBottom: '24px'
                                        },
                                        children: [
                                            "$",
                                            (pkg.price / 100 / pkg.credits).toFixed(2),
                                            " ",
                                            lang === 'tr' ? 'kredi basina' : 'per credit'
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/buy-credits.tsx",
                                        lineNumber: 226,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        onClick: ()=>handlePurchase(pkg.id),
                                        disabled: purchasing !== null,
                                        style: {
                                            width: '100%',
                                            padding: '12px 24px',
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            color: 'white',
                                            backgroundColor: purchasing === pkg.id ? 'rgb(148, 163, 184)' : 'rgb(99, 102, 241)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: purchasing !== null ? 'not-allowed' : 'pointer',
                                            transition: 'background-color 0.2s'
                                        },
                                        "data-testid": `button-buy-${pkg.id}`,
                                        children: purchasing === pkg.id ? lang === 'tr' ? 'Yukleniyor...' : 'Loading...' : lang === 'tr' ? 'Satin Al' : 'Buy Now'
                                    }, void 0, false, {
                                        fileName: "[project]/pages/buy-credits.tsx",
                                        lineNumber: 230,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, pkg.id, true, {
                                fileName: "[project]/pages/buy-credits.tsx",
                                lineNumber: 186,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/pages/buy-credits.tsx",
                        lineNumber: 184,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            textAlign: 'center',
                            marginTop: '48px'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                            href: "/",
                            style: {
                                fontSize: '0.875rem',
                                color: 'rgb(99, 102, 241)',
                                textDecoration: 'none'
                            },
                            "data-testid": "link-back-home",
                            children: lang === 'tr' ? 'Ana Sayfaya Don' : 'Back to Home'
                        }, void 0, false, {
                            fileName: "[project]/pages/buy-credits.tsx",
                            lineNumber: 254,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/buy-credits.tsx",
                        lineNumber: 253,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/buy-credits.tsx",
                lineNumber: 158,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/buy-credits.tsx",
        lineNumber: 129,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e348cc8a._.js.map