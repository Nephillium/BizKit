export type Language = 'en' | 'tr'

export const translations = {
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
    generationError: 'An error occurred while generating content. Please try again.',
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
    generationError: 'İçerik oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.',
  },
}

export function getTranslation(lang: Language) {
  return translations[lang]
}
