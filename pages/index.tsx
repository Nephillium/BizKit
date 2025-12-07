import { useState, FormEvent, useRef, useEffect } from 'react'
import Head from 'next/head'
import { jsPDF } from 'jspdf'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { useAuth } from '../hooks/useAuth'
import type { Generation } from '../shared/schema'
import { translations, getTranslation, type Language } from '../lib/translations'

type Tool = 'cold_email' | 'proposal' | 'contract' | 'social_pack'
type CopyState = 'idle' | 'copied' | 'error'
type ExportState = 'idle' | 'exporting'
type ModelOption = 'gpt-4o-mini' | 'gpt-4o'
type LengthOption = 'short' | 'standard' | 'detailed'

interface PremiumOptions {
  model: ModelOption
  length: LengthOption
  creativity: number
  customInstructions: string
}

interface FormData {
  cold_email: {
    target: string
    service: string
    tone: string
    language: string
  }
  proposal: {
    clientType: string
    projectScope: string
    deliverables: string
    budgetRange: string
    language: string
  }
  contract: {
    clientName: string
    providerName: string
    serviceDescription: string
    paymentTerms: string
    jurisdiction: string
    language: string
  }
  social_pack: {
    businessType: string
    niche: string
    tone: string
    platform: string
    language: string
  }
}

const initialFormData: FormData = {
  cold_email: {
    target: '',
    service: '',
    tone: '',
    language: 'English',
  },
  proposal: {
    clientType: '',
    projectScope: '',
    deliverables: '',
    budgetRange: '',
    language: 'English',
  },
  contract: {
    clientName: '',
    providerName: '',
    serviceDescription: '',
    paymentTerms: '',
    jurisdiction: '',
    language: 'English',
  },
  social_pack: {
    businessType: '',
    niche: '',
    tone: '',
    platform: '',
    language: 'English',
  },
}

function getTabLabels(t: ReturnType<typeof getTranslation>): Record<Tool, string> {
  return {
    cold_email: t.coldEmail,
    proposal: t.proposal,
    contract: t.contract,
    social_pack: t.socialPack,
  }
}

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Italian',
  'Dutch',
  'Swedish',
  'Danish',
  'Norwegian',
  'Finnish',
  'Polish',
  'Turkish',
  'Arabic',
  'Hebrew',
  'Russian',
  'Ukrainian',
  'Hindi',
  'Bengali',
  'Indonesian',
  'Malay',
  'Vietnamese',
  'Thai',
  'Chinese (Simplified)',
  'Chinese (Traditional)',
  'Japanese',
  'Korean',
]

interface LanguagePickerProps {
  value: string
  onChange: (value: string) => void
  testId: string
}

function LanguagePicker({ value, onChange, testId }: LanguagePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredLanguages = LANGUAGES.filter(lang =>
    lang.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isCustomLanguage = value && !LANGUAGES.includes(value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
        setIsCustomMode(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectLanguage = (lang: string) => {
    onChange(lang)
    setIsOpen(false)
    setSearchQuery('')
    setIsCustomMode(false)
  }

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onChange(customValue.trim())
      setIsOpen(false)
      setSearchQuery('')
      setIsCustomMode(false)
      setCustomValue('')
    }
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: '1rem',
          backgroundColor: 'rgb(255, 255, 255)',
          border: '1px solid rgb(226, 232, 240)',
          borderRadius: '6px',
          color: value ? 'rgb(15, 23, 42)' : 'rgb(148, 163, 184)',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'border-color 0.2s ease',
        }}
        data-testid={testId}
      >
        <span>{value || 'Select language'}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: 'rgb(100, 116, 139)',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'rgb(255, 255, 255)',
            border: '1px solid rgb(226, 232, 240)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 50,
            maxHeight: '300px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
          data-testid={`${testId}-dropdown`}
        >
          {!isCustomMode ? (
            <>
              <div style={{ padding: '8px', borderBottom: '1px solid rgb(241, 245, 249)' }}>
                <input
                  type="text"
                  placeholder="Search languages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.875rem',
                    backgroundColor: 'rgb(248, 250, 252)',
                    border: '1px solid rgb(226, 232, 240)',
                    borderRadius: '6px',
                    color: 'rgb(15, 23, 42)',
                  }}
                  data-testid={`${testId}-search`}
                />
              </div>

              <div style={{ overflowY: 'auto', maxHeight: '200px' }}>
                {filteredLanguages.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleSelectLanguage(lang)}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      fontSize: '0.875rem',
                      textAlign: 'left',
                      backgroundColor: value === lang ? 'rgb(238, 242, 255)' : 'transparent',
                      color: value === lang ? 'rgb(99, 102, 241)' : 'rgb(51, 65, 85)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (value !== lang) {
                        e.currentTarget.style.backgroundColor = 'rgb(248, 250, 252)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (value !== lang) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                    data-testid={`${testId}-option-${lang.toLowerCase().replace(/[^a-z]/g, '-')}`}
                  >
                    <span>{lang}</span>
                    {value === lang && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
                {filteredLanguages.length === 0 && (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'rgb(100, 116, 139)', fontSize: '0.875rem' }}>
                    No languages found
                  </div>
                )}
              </div>

              <div style={{ padding: '8px', borderTop: '1px solid rgb(241, 245, 249)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomMode(true)
                    setCustomValue(isCustomLanguage ? value : '')
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    fontSize: '0.875rem',
                    textAlign: 'left',
                    backgroundColor: 'transparent',
                    color: 'rgb(99, 102, 241)',
                    border: '1px dashed rgb(199, 210, 254)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  data-testid={`${testId}-custom-option`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Custom language...
                </button>
              </div>
            </>
          ) : (
            <div style={{ padding: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'rgb(100, 116, 139)', marginBottom: '8px' }}>
                Enter custom language
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="e.g. Swahili, Tagalog..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCustomSubmit()
                    }
                    if (e.key === 'Escape') {
                      setIsCustomMode(false)
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '0.875rem',
                    backgroundColor: 'rgb(248, 250, 252)',
                    border: '1px solid rgb(226, 232, 240)',
                    borderRadius: '6px',
                    color: 'rgb(15, 23, 42)',
                  }}
                  data-testid={`${testId}-custom-input`}
                />
                <button
                  type="button"
                  onClick={handleCustomSubmit}
                  disabled={!customValue.trim()}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    backgroundColor: customValue.trim() ? 'rgb(99, 102, 241)' : 'rgb(226, 232, 240)',
                    color: customValue.trim() ? 'rgb(255, 255, 255)' : 'rgb(148, 163, 184)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: customValue.trim() ? 'pointer' : 'not-allowed',
                  }}
                  data-testid={`${testId}-custom-submit`}
                >
                  Add
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  color: 'rgb(100, 116, 139)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                data-testid={`${testId}-custom-back`}
              >
                Back to list
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const { user, isLoading: authLoading, isAuthenticated, login, register, logout } = useAuth()
  const [lang, setLang] = useState<Language>('en')
  const t = translations[lang]
  const [activeTab, setActiveTab] = useState<Tool>('cold_email')
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [output, setOutput] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const [exportState, setExportState] = useState<ExportState>('idle')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const [generations, setGenerations] = useState<Generation[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false)
  const [usageInfo, setUsageInfo] = useState<{ count: number; limit: number } | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading2, setAuthLoading2] = useState(false)
  const [premiumOptions, setPremiumOptions] = useState<PremiumOptions>({
    model: 'gpt-4o-mini',
    length: 'standard',
    creativity: 50,
    customInstructions: '',
  })

  useEffect(() => {
    const savedLang = localStorage.getItem('bizkit_lang') as Language
    if (savedLang && (savedLang === 'en' || savedLang === 'tr')) {
      setLang(savedLang)
    }
  }, [])

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'tr' : 'en'
    setLang(newLang)
    localStorage.setItem('bizkit_lang', newLang)
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchGenerations()
    }
  }, [isAuthenticated])

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading2(true)
    
    try {
      const result = authMode === 'login' 
        ? await login(authEmail, authPassword)
        : await register(authEmail, authPassword)
      
      if (result.ok) {
        setShowAuthModal(false)
        setAuthEmail('')
        setAuthPassword('')
        setShowSubscriptionPrompt(false)
      } else {
        setAuthError(result.error || 'Authentication failed')
      }
    } catch {
      setAuthError('Network error. Please try again.')
    } finally {
      setAuthLoading2(false)
    }
  }

  const fetchGenerations = async () => {
    try {
      setHistoryLoading(true)
      const response = await fetch('/api/generations', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setGenerations(data)
      }
    } catch (err) {
      console.error('Failed to fetch generations:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  const saveGeneration = async () => {
    if (!isAuthenticated || !output) return
    try {
      const response = await fetch('/api/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          toolType: activeTab,
          inputs: formData[activeTab],
          output,
        }),
      })
      if (response.ok) {
        fetchGenerations()
      }
    } catch (err) {
      console.error('Failed to save generation:', err)
    }
  }

  const deleteGeneration = async (id: number) => {
    try {
      const response = await fetch(`/api/generations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (response.ok) {
        setGenerations(generations.filter(g => g.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete generation:', err)
    }
  }

  const loadGeneration = (generation: Generation) => {
    setActiveTab(generation.toolType as Tool)
    setFormData(prev => ({
      ...prev,
      [generation.toolType]: generation.inputs,
    }))
    setOutput(generation.output)
    setShowHistory(false)
  }

  const handleExportText = () => {
    if (!output) return
    
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bizkit-${activeTab}-${Date.now()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const handleExportPDF = () => {
    if (!output) return
    setExportState('exporting')
    
    try {
      const doc = new jsPDF()
      const tabLabels = getTabLabels(t)
      const title = tabLabels[activeTab]
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      const maxWidth = pageWidth - (margin * 2)
      
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text(`BizKit AI - ${title}`, margin, margin)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100)
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, margin, margin + 8)
      
      doc.setFontSize(11)
      doc.setTextColor(0)
      const lines = doc.splitTextToSize(output, maxWidth)
      doc.text(lines, margin, margin + 20)
      
      doc.save(`bizkit-${activeTab}-${Date.now()}.pdf`)
    } catch (err) {
      console.error('PDF export error:', err)
    } finally {
      setExportState('idle')
      setShowExportMenu(false)
    }
  }

  const handleExportWord = async () => {
    if (!output) return
    setExportState('exporting')
    
    try {
      const tabLabels = getTabLabels(t)
      const title = tabLabels[activeTab]
      const paragraphs = output.split('\n').filter(line => line.trim()).map(line => 
        new Paragraph({
          children: [new TextRun(line)],
          spacing: { after: 200 },
        })
      )
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `BizKit AI - ${title}`,
                  bold: true,
                  size: 32,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated on ${new Date().toLocaleDateString()}`,
                  color: '666666',
                  size: 20,
                }),
              ],
              spacing: { after: 400 },
            }),
            ...paragraphs,
          ],
        }],
      })
      
      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bizkit-${activeTab}-${Date.now()}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Word export error:', err)
    } finally {
      setExportState('idle')
      setShowExportMenu(false)
    }
  }

  const handleCopyToClipboard = async () => {
    if (!output) return
    
    try {
      await navigator.clipboard.writeText(output)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2000)
    } catch (err) {
      setCopyState('error')
      setTimeout(() => setCopyState('idle'), 2000)
    }
  }

  const handleRegenerate = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    setError('')
    const previousOutput = output
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tool: activeTab,
          inputs: formData[activeTab],
          premiumOptions: showAdvancedOptions ? premiumOptions : undefined,
        }),
      })

      const data = await response.json()

      if (data.ok) {
        setOutput(data.output)
        if (data.usageCount !== undefined && data.usageLimit !== undefined) {
          setUsageInfo({ count: data.usageCount, limit: data.usageLimit })
        }
      } else {
        setOutput(previousOutput)
        if (data.error === 'usage_limit_exceeded') {
          setUsageInfo({ count: data.usageCount, limit: data.usageLimit })
          setShowSubscriptionPrompt(true)
          setError('')
        } else {
          setError(
            data.error === 'missing_openai_key'
              ? 'OpenAI API key is not configured. Please add your API key.'
              : data.error === 'openai_error'
              ? 'An error occurred while generating content. Please try again.'
              : data.error || 'An unexpected error occurred.'
          )
        }
      }
    } catch (err) {
      setOutput(previousOutput)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormField = (
    tool: Tool,
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [tool]: {
        ...prev[tool],
        [field]: value,
      },
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setOutput('')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tool: activeTab,
          inputs: formData[activeTab],
          premiumOptions: showAdvancedOptions ? premiumOptions : undefined,
        }),
      })

      const data = await response.json()

      if (data.ok) {
        setOutput(data.output)
      } else {
        if (data.requiresLogin || data.freeUsed) {
          setShowAuthModal(true)
          setAuthMode('register')
          setError('Your free trial is used. Register or log in for unlimited access.')
        } else {
          setError(
            data.error === 'missing_openai_key'
              ? 'OpenAI API key is not configured. Please add your API key.'
              : data.error === 'openai_error'
              ? 'An error occurred while generating content. Please try again.'
              : data.error || 'An unexpected error occurred.'
          )
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

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
    `,
  }

  const labelStyles = `
    block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2
  `

  return (
    <>
      <Head>
        <title>BizKit AI - Client-Winning Content in Seconds</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'rgb(250, 250, 250)',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* Navigation Bar */}
        <nav
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 24px',
            backgroundColor: 'rgb(255, 255, 255)',
            borderBottom: '1px solid rgb(226, 232, 240)',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '1.125rem', color: 'rgb(15, 23, 42)' }}>
            BizKit AI
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Language Selector */}
            <button
              type="button"
              onClick={toggleLanguage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'rgb(71, 85, 105)',
                backgroundColor: 'rgb(241, 245, 249)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              data-testid="button-language"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              {lang === 'en' ? 'TR' : 'EN'}
            </button>
            {authLoading ? (
              <div style={{ fontSize: '0.875rem', color: 'rgb(148, 163, 184)' }}>{t.loading}</div>
            ) : isAuthenticated && user ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  style={{
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
                    cursor: 'pointer',
                  }}
                  data-testid="button-history"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {t.history}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: user.role === 'admin' ? 'rgb(99, 102, 241)' : 'rgb(148, 163, 184)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.875rem', color: 'rgb(51, 65, 85)' }} data-testid="text-username">
                      {user.email || 'User'}
                      {user.role === 'admin' && (
                        <span style={{ marginLeft: '4px', fontSize: '0.75rem', color: 'rgb(99, 102, 241)' }}>({t.admin})</span>
                      )}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'rgb(100, 116, 139)' }} data-testid="text-credits">
                      {user.role === 'admin' ? t.unlimitedCredits : `${user.credits ?? 0} ${t.creditsLeft}`}
                    </span>
                  </div>
                </div>
                {user.role !== 'admin' && (
                  <button
                    type="button"
                    onClick={() => window.location.href = '/buy-credits'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color: 'rgb(255, 255, 255)',
                      backgroundColor: 'rgb(16, 185, 129)',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                    data-testid="button-buy-credits"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                      <path d="M12 18V6" />
                    </svg>
                    {t.buyCredits}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => logout()}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgb(254, 242, 242)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                  data-testid="button-logout"
                >
                  {t.logout}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login')
                  setShowAuthModal(true)
                  setAuthError('')
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'rgb(255, 255, 255)',
                  backgroundColor: 'rgb(99, 102, 241)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                data-testid="button-login"
              >
                {t.login}
              </button>
            )}
          </div>
        </nav>

        {/* History Sidebar */}
        {showHistory && isAuthenticated && (
          <div
            style={{
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
              flexDirection: 'column',
            }}
            data-testid="panel-history"
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid rgb(226, 232, 240)',
              }}
            >
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'rgb(15, 23, 42)', margin: 0 }}>
                Generation History
              </h2>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                style={{
                  padding: '6px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgb(148, 163, 184)',
                }}
                data-testid="button-close-history"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
              }}
            >
              {historyLoading ? (
                <div style={{ textAlign: 'center', color: 'rgb(148, 163, 184)', padding: '40px 0' }}>
                  Loading...
                </div>
              ) : generations.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgb(148, 163, 184)', padding: '40px 0' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <p style={{ fontSize: '0.875rem' }}>No saved generations yet</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Generate content and save it to see your history</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {generations.map((gen) => (
                    <div
                      key={gen.id}
                      style={{
                        padding: '14px',
                        backgroundColor: 'rgb(248, 250, 252)',
                        borderRadius: '6px',
                        border: '1px solid rgb(226, 232, 240)',
                      }}
                      data-testid={`history-item-${gen.id}`}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            fontSize: '0.6875rem',
                            fontWeight: 500,
                            backgroundColor: 'rgb(238, 242, 255)',
                            color: 'rgb(99, 102, 241)',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {getTabLabels(t)[gen.toolType as Tool] || gen.toolType}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'rgb(148, 163, 184)' }}>
                          {new Date(gen.createdAt!).toLocaleDateString()}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: '0.8125rem',
                          color: 'rgb(51, 65, 85)',
                          lineHeight: 1.5,
                          marginBottom: '12px',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {gen.output.substring(0, 150)}...
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => loadGeneration(gen)}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'rgb(99, 102, 241)',
                            backgroundColor: 'rgb(255, 255, 255)',
                            border: '1px solid rgb(199, 210, 254)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                          data-testid={`button-load-${gen.id}`}
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteGeneration(gen.id)}
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: 'rgb(239, 68, 68)',
                            backgroundColor: 'rgb(255, 255, 255)',
                            border: '1px solid rgb(254, 202, 202)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                          data-testid={`button-delete-${gen.id}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hero Section */}
        <header
          style={{
            padding: '64px 16px',
            textAlign: 'center',
            borderBottom: '1px solid rgb(226, 232, 240)',
            background: 'linear-gradient(180deg, rgb(255,255,255) 0%, rgb(248,250,252) 100%)',
          }}
        >
          <div style={{ maxWidth: '768px', margin: '0 auto' }}>
            <h1
              style={{
                fontSize: 'clamp(2rem, 5vw, 2.5rem)',
                fontWeight: 700,
                color: 'rgb(15, 23, 42)',
                letterSpacing: '-0.02em',
                marginBottom: '16px',
                lineHeight: 1.2,
              }}
              data-testid="text-hero-title"
            >
              BizKit AI – Client-Winning Content in Seconds
            </h1>
            <p
              style={{
                fontSize: '1.125rem',
                color: 'rgb(71, 85, 105)',
                lineHeight: 1.6,
                marginBottom: '16px',
              }}
              data-testid="text-hero-subtitle"
            >
              Cold emails, proposals, contracts and social media posts for freelancers & agencies.
            </p>
            <span
              style={{
                display: 'inline-block',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'rgb(99, 102, 241)',
                backgroundColor: 'rgb(238, 242, 255)',
                borderRadius: '9999px',
                border: '1px solid rgb(199, 210, 254)',
              }}
              data-testid="badge-beta"
            >
              {t.betaBadge}
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main
          style={{
            maxWidth: '896px',
            margin: '0 auto',
            padding: '32px 16px',
          }}
        >
          {/* Tab Navigation */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '32px',
            }}
            data-testid="tabs-container"
          >
            {(['cold_email', 'proposal', 'contract', 'social_pack'] as Tool[]).map((tool) => (
              <button
                key={tool}
                onClick={() => {
                  setActiveTab(tool)
                  setOutput('')
                  setError('')
                }}
                style={{
                  padding: '10px 20px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor:
                    activeTab === tool
                      ? 'rgb(99, 102, 241)'
                      : 'rgb(241, 245, 249)',
                  color:
                    activeTab === tool
                      ? 'rgb(255, 255, 255)'
                      : 'rgb(71, 85, 105)',
                  boxShadow:
                    activeTab === tool
                      ? '0 1px 3px rgba(99, 102, 241, 0.3)'
                      : 'none',
                }}
                data-testid={`tab-${tool}`}
              >
                {getTabLabels(t)[tool]}
              </button>
            ))}
          </div>

          {/* Form Container */}
          <form onSubmit={handleSubmit}>
            <div
              style={{
                backgroundColor: 'rgb(255, 255, 255)',
                borderRadius: '8px',
                border: '1px solid rgb(226, 232, 240)',
                padding: '24px',
                marginBottom: '24px',
              }}
            >
              {/* Cold Email Form */}
              {activeTab === 'cold_email' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label
                      htmlFor="target"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      {t.targetAudience}
                    </label>
                    <input
                      id="target"
                      type="text"
                      placeholder={t.targetPlaceholder}
                      value={formData.cold_email.target}
                      onChange={(e) =>
                        updateFormField('cold_email', 'target', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '1rem',
                        backgroundColor: 'rgb(255, 255, 255)',
                        border: '1px solid rgb(226, 232, 240)',
                        borderRadius: '6px',
                        color: 'rgb(15, 23, 42)',
                      }}
                      data-testid="input-target"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="service"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      {t.serviceOffered}
                    </label>
                    <input
                      id="service"
                      type="text"
                      placeholder={t.servicePlaceholder}
                      value={formData.cold_email.service}
                      onChange={(e) =>
                        updateFormField('cold_email', 'service', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '1rem',
                        backgroundColor: 'rgb(255, 255, 255)',
                        border: '1px solid rgb(226, 232, 240)',
                        borderRadius: '6px',
                        color: 'rgb(15, 23, 42)',
                      }}
                      data-testid="input-service"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="tone"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      {t.tone}
                    </label>
                    <input
                      id="tone"
                      type="text"
                      placeholder={t.tonePlaceholder}
                      value={formData.cold_email.tone}
                      onChange={(e) =>
                        updateFormField('cold_email', 'tone', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '1rem',
                        backgroundColor: 'rgb(255, 255, 255)',
                        border: '1px solid rgb(226, 232, 240)',
                        borderRadius: '6px',
                        color: 'rgb(15, 23, 42)',
                      }}
                      data-testid="input-tone"
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      {t.language}
                    </label>
                    <LanguagePicker
                      value={formData.cold_email.language}
                      onChange={(value) => updateFormField('cold_email', 'language', value)}
                      testId="select-language"
                    />
                  </div>
                </div>
              )}

              {/* Proposal Form */}
              {activeTab === 'proposal' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label
                      htmlFor="clientType"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      {t.clientType}
                    </label>
                    <input
                      id="clientType"
                      type="text"
                      placeholder={t.clientTypePlaceholder}
                      value={formData.proposal.clientType}
                      onChange={(e) =>
                        updateFormField('proposal', 'clientType', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '1rem',
                        backgroundColor: 'rgb(255, 255, 255)',
                        border: '1px solid rgb(226, 232, 240)',
                        borderRadius: '6px',
                        color: 'rgb(15, 23, 42)',
                      }}
                      data-testid="input-clientType"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="projectScope"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      {t.projectScope}
                    </label>
                    <textarea
                      id="projectScope"
                      placeholder={t.projectScopePlaceholder}
                      value={formData.proposal.projectScope}
                      onChange={(e) =>
                        updateFormField('proposal', 'projectScope', e.target.value)
                      }
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '1rem',
                        backgroundColor: 'rgb(255, 255, 255)',
                        border: '1px solid rgb(226, 232, 240)',
                        borderRadius: '6px',
                        color: 'rgb(15, 23, 42)',
                        resize: 'vertical',
                        minHeight: '120px',
                      }}
                      data-testid="input-projectScope"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="deliverables"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      {t.deliverables}
                    </label>
                    <textarea
                      id="deliverables"
                      placeholder={t.deliverablesPlaceholder}
                      value={formData.proposal.deliverables}
                      onChange={(e) =>
                        updateFormField('proposal', 'deliverables', e.target.value)
                      }
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '1rem',
                        backgroundColor: 'rgb(255, 255, 255)',
                        border: '1px solid rgb(226, 232, 240)',
                        borderRadius: '6px',
                        color: 'rgb(15, 23, 42)',
                        resize: 'vertical',
                        minHeight: '120px',
                      }}
                      data-testid="input-deliverables"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="budgetRange"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      {t.budgetRange}
                    </label>
                    <input
                      id="budgetRange"
                      type="text"
                      placeholder={t.budgetPlaceholder}
                      value={formData.proposal.budgetRange}
                      onChange={(e) =>
                        updateFormField('proposal', 'budgetRange', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '1rem',
                        backgroundColor: 'rgb(255, 255, 255)',
                        border: '1px solid rgb(226, 232, 240)',
                        borderRadius: '6px',
                        color: 'rgb(15, 23, 42)',
                      }}
                      data-testid="input-budgetRange"
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      {t.language}
                    </label>
                    <LanguagePicker
                      value={formData.proposal.language}
                      onChange={(value) => updateFormField('proposal', 'language', value)}
                      testId="select-proposalLanguage"
                    />
                  </div>
                </div>
              )}

              {/* Contract Form */}
              {activeTab === 'contract' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label
                      htmlFor="clientName"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      {t.clientName}
                    </label>
                    <input
                      id="clientName"
                      type="text"
                      placeholder={t.clientNamePlaceholder}
                      value={formData.contract.clientName}
                      onChange={(e) =>
                        updateFormField('contract', 'clientName', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '1rem',
                        backgroundColor: 'rgb(255, 255, 255)',
                        border: '1px solid rgb(226, 232, 240)',
                        borderRadius: '6px',
                        color: 'rgb(15, 23, 42)',
                      }}
                      data-testid="input-clientName"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="providerName"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      {t.providerName}
                    </label>
                    <input
                      id="providerName"
                      type="text"
                      placeholder={t.providerPlaceholder}
                      value={formData.contract.providerName}
                      onChange={(e) =>
                        updateFormField('contract', 'providerName', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '1rem',
                        backgroundColor: 'rgb(255, 255, 255)',
                        border: '1px solid rgb(226, 232, 240)',
                        borderRadius: '6px',
                        color: 'rgb(15, 23, 42)',
                      }}
                      data-testid="input-providerName"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="serviceDescription"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      {t.serviceDescription}
                    </label>
                    <textarea
                      id="serviceDescription"
                      placeholder={t.serviceDescPlaceholder}
                      value={formData.contract.serviceDescription}
                      onChange={(e) =>
                        updateFormField('contract', 'serviceDescription', e.target.value)
                      }
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '1rem',
                        backgroundColor: 'rgb(255, 255, 255)',
                        border: '1px solid rgb(226, 232, 240)',
                        borderRadius: '6px',
                        color: 'rgb(15, 23, 42)',
                        resize: 'vertical',
                        minHeight: '120px',
                      }}
                      data-testid="input-serviceDescription"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="paymentTerms"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      {t.paymentTerms}
                    </label>
                    <input
                      id="paymentTerms"
                      type="text"
                      placeholder={t.paymentPlaceholder}
                      value={formData.contract.paymentTerms}
                      onChange={(e) =>
                        updateFormField('contract', 'paymentTerms', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '1rem',
                        backgroundColor: 'rgb(255, 255, 255)',
                        border: '1px solid rgb(226, 232, 240)',
                        borderRadius: '6px',
                        color: 'rgb(15, 23, 42)',
                      }}
                      data-testid="input-paymentTerms"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="jurisdiction"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      {t.jurisdiction}
                    </label>
                    <input
                      id="jurisdiction"
                      type="text"
                      placeholder={t.jurisdictionPlaceholder}
                      value={formData.contract.jurisdiction}
                      onChange={(e) =>
                        updateFormField('contract', 'jurisdiction', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '1rem',
                        backgroundColor: 'rgb(255, 255, 255)',
                        border: '1px solid rgb(226, 232, 240)',
                        borderRadius: '6px',
                        color: 'rgb(15, 23, 42)',
                      }}
                      data-testid="input-jurisdiction"
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      {t.language}
                    </label>
                    <LanguagePicker
                      value={formData.contract.language}
                      onChange={(value) => updateFormField('contract', 'language', value)}
                      testId="select-contractLanguage"
                    />
                  </div>
                </div>
              )}

              {/* Social Pack Form */}
              {activeTab === 'social_pack' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label
                      htmlFor="businessType"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      {t.businessType}
                    </label>
                    <input
                      id="businessType"
                      type="text"
                      placeholder={t.businessPlaceholder}
                      value={formData.social_pack.businessType}
                      onChange={(e) =>
                        updateFormField('social_pack', 'businessType', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '1rem',
                        backgroundColor: 'rgb(255, 255, 255)',
                        border: '1px solid rgb(226, 232, 240)',
                        borderRadius: '6px',
                        color: 'rgb(15, 23, 42)',
                      }}
                      data-testid="input-businessType"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="niche"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      {t.niche}
                    </label>
                    <input
                      id="niche"
                      type="text"
                      placeholder={t.nichePlaceholder}
                      value={formData.social_pack.niche}
                      onChange={(e) =>
                        updateFormField('social_pack', 'niche', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '1rem',
                        backgroundColor: 'rgb(255, 255, 255)',
                        border: '1px solid rgb(226, 232, 240)',
                        borderRadius: '6px',
                        color: 'rgb(15, 23, 42)',
                      }}
                      data-testid="input-niche"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="socialTone"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      {t.tone}
                    </label>
                    <input
                      id="socialTone"
                      type="text"
                      placeholder={t.tonePlaceholder}
                      value={formData.social_pack.tone}
                      onChange={(e) =>
                        updateFormField('social_pack', 'tone', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '1rem',
                        backgroundColor: 'rgb(255, 255, 255)',
                        border: '1px solid rgb(226, 232, 240)',
                        borderRadius: '6px',
                        color: 'rgb(15, 23, 42)',
                      }}
                      data-testid="input-socialTone"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="platform"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      {t.platform}
                    </label>
                    <input
                      id="platform"
                      type="text"
                      placeholder={t.platformPlaceholder}
                      value={formData.social_pack.platform}
                      onChange={(e) =>
                        updateFormField('social_pack', 'platform', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '1rem',
                        backgroundColor: 'rgb(255, 255, 255)',
                        border: '1px solid rgb(226, 232, 240)',
                        borderRadius: '6px',
                        color: 'rgb(15, 23, 42)',
                      }}
                      data-testid="input-platform"
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      {t.language}
                    </label>
                    <LanguagePicker
                      value={formData.social_pack.language}
                      onChange={(value) => updateFormField('social_pack', 'language', value)}
                      testId="select-socialLanguage"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Options Toggle */}
            <div style={{ marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  width: '100%',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'rgb(71, 85, 105)',
                  backgroundColor: 'rgb(248, 250, 252)',
                  border: '1px solid rgb(226, 232, 240)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                data-testid="button-toggle-advanced"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: showAdvancedOptions ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Advanced Options
                {showAdvancedOptions && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '0.75rem',
                      color: 'rgb(99, 102, 241)',
                      fontWeight: 400,
                    }}
                  >
                    Customize AI behavior
                  </span>
                )}
              </button>

              {/* Advanced Options Panel */}
              {showAdvancedOptions && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '20px',
                    backgroundColor: 'rgb(248, 250, 252)',
                    border: '1px solid rgb(226, 232, 240)',
                    borderRadius: '8px',
                  }}
                  data-testid="panel-advanced-options"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* AI Model Selection */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: 'rgb(51, 65, 85)',
                          marginBottom: '8px',
                        }}
                      >
                        AI Model
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setPremiumOptions(prev => ({ ...prev, model: 'gpt-4o-mini' }))}
                          style={{
                            flex: 1,
                            padding: '10px 16px',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            color: premiumOptions.model === 'gpt-4o-mini' ? 'rgb(99, 102, 241)' : 'rgb(71, 85, 105)',
                            backgroundColor: premiumOptions.model === 'gpt-4o-mini' ? 'rgb(238, 242, 255)' : 'rgb(255, 255, 255)',
                            border: premiumOptions.model === 'gpt-4o-mini' ? '2px solid rgb(99, 102, 241)' : '1px solid rgb(226, 232, 240)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          data-testid="button-model-mini"
                        >
                          <div style={{ fontWeight: 600 }}>GPT-4o Mini</div>
                          <div style={{ fontSize: '0.6875rem', color: 'rgb(100, 116, 139)', marginTop: '4px' }}>
                            Fast & efficient
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPremiumOptions(prev => ({ ...prev, model: 'gpt-4o' }))}
                          style={{
                            flex: 1,
                            padding: '10px 16px',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            color: premiumOptions.model === 'gpt-4o' ? 'rgb(99, 102, 241)' : 'rgb(71, 85, 105)',
                            backgroundColor: premiumOptions.model === 'gpt-4o' ? 'rgb(238, 242, 255)' : 'rgb(255, 255, 255)',
                            border: premiumOptions.model === 'gpt-4o' ? '2px solid rgb(99, 102, 241)' : '1px solid rgb(226, 232, 240)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          data-testid="button-model-full"
                        >
                          <div style={{ fontWeight: 600 }}>GPT-4o</div>
                          <div style={{ fontSize: '0.6875rem', color: 'rgb(100, 116, 139)', marginTop: '4px' }}>
                            Higher quality
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Output Length */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: 'rgb(51, 65, 85)',
                          marginBottom: '8px',
                        }}
                      >
                        Output Length
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {(['short', 'standard', 'detailed'] as LengthOption[]).map((length) => (
                          <button
                            key={length}
                            type="button"
                            onClick={() => setPremiumOptions(prev => ({ ...prev, length }))}
                            style={{
                              flex: 1,
                              padding: '10px 16px',
                              fontSize: '0.8125rem',
                              fontWeight: 500,
                              color: premiumOptions.length === length ? 'rgb(99, 102, 241)' : 'rgb(71, 85, 105)',
                              backgroundColor: premiumOptions.length === length ? 'rgb(238, 242, 255)' : 'rgb(255, 255, 255)',
                              border: premiumOptions.length === length ? '2px solid rgb(99, 102, 241)' : '1px solid rgb(226, 232, 240)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              textTransform: 'capitalize',
                            }}
                            data-testid={`button-length-${length}`}
                          >
                            {length}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Creativity Slider */}
                    <div>
                      <label
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: 'rgb(51, 65, 85)',
                          marginBottom: '8px',
                        }}
                      >
                        <span>Creativity Level</span>
                        <span style={{ fontSize: '0.75rem', color: 'rgb(100, 116, 139)' }}>
                          {premiumOptions.creativity}%
                        </span>
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'rgb(100, 116, 139)' }}>Precise</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={premiumOptions.creativity}
                          onChange={(e) => setPremiumOptions(prev => ({ ...prev, creativity: parseInt(e.target.value) }))}
                          style={{
                            flex: 1,
                            height: '6px',
                            borderRadius: '3px',
                            appearance: 'none',
                            backgroundColor: 'rgb(226, 232, 240)',
                            cursor: 'pointer',
                          }}
                          data-testid="slider-creativity"
                        />
                        <span style={{ fontSize: '0.75rem', color: 'rgb(100, 116, 139)' }}>Creative</span>
                      </div>
                    </div>

                    {/* Custom Instructions */}
                    <div>
                      <label
                        htmlFor="customInstructions"
                        style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: 'rgb(51, 65, 85)',
                          marginBottom: '8px',
                        }}
                      >
                        Custom Instructions
                      </label>
                      <textarea
                        id="customInstructions"
                        placeholder="Add any specific instructions for the AI (e.g., 'Use formal British English', 'Include a call-to-action', 'Keep paragraphs short')..."
                        value={premiumOptions.customInstructions}
                        onChange={(e) => setPremiumOptions(prev => ({ ...prev, customInstructions: e.target.value }))}
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          fontSize: '0.875rem',
                          backgroundColor: 'rgb(255, 255, 255)',
                          border: '1px solid rgb(226, 232, 240)',
                          borderRadius: '6px',
                          color: 'rgb(15, 23, 42)',
                          resize: 'vertical',
                          minHeight: '80px',
                        }}
                        data-testid="input-custom-instructions"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '14px 32px',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'rgb(255, 255, 255)',
                backgroundColor: isLoading
                  ? 'rgb(148, 163, 184)'
                  : 'rgb(99, 102, 241)',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isLoading
                  ? 'none'
                  : '0 1px 3px rgba(99, 102, 241, 0.3)',
              }}
              data-testid="button-generate"
            >
              {isLoading ? 'Generating...' : 'Generate'}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div
              style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: 'rgb(254, 242, 242)',
                border: '1px solid rgb(254, 202, 202)',
                borderRadius: '8px',
                color: 'rgb(185, 28, 28)',
                fontSize: '0.875rem',
              }}
              data-testid="error-message"
            >
              {error}
            </div>
          )}

          {/* Output Display */}
          {output && (
            <div style={{ marginTop: '32px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <label
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'rgb(51, 65, 85)',
                  }}
                >
                  Generated Content
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={isLoading}
                    style={{
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
                      transition: 'all 0.2s ease',
                    }}
                    data-testid="button-regenerate"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        animation: isLoading ? 'spin 1s linear infinite' : 'none',
                      }}
                    >
                      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                    </svg>
                    {isLoading ? 'Regenerating...' : 'Regenerate'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyToClipboard}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      color:
                        copyState === 'copied'
                          ? 'rgb(22, 163, 74)'
                          : copyState === 'error'
                          ? 'rgb(220, 38, 38)'
                          : 'rgb(71, 85, 105)',
                      backgroundColor:
                        copyState === 'copied'
                          ? 'rgb(240, 253, 244)'
                          : copyState === 'error'
                          ? 'rgb(254, 242, 242)'
                          : 'rgb(255, 255, 255)',
                      border: `1px solid ${
                        copyState === 'copied'
                          ? 'rgb(187, 247, 208)'
                          : copyState === 'error'
                          ? 'rgb(254, 202, 202)'
                          : 'rgb(226, 232, 240)'
                      }`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    data-testid="button-copy"
                  >
                    {copyState === 'copied' ? (
                      <>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Copied!
                      </>
                    ) : copyState === 'error' ? (
                      <>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        Failed
                      </>
                    ) : (
                      <>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                  <div style={{ position: 'relative' }} ref={exportMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      style={{
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
                        transition: 'all 0.2s ease',
                      }}
                      data-testid="button-export"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Export
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: showExportMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {showExportMenu && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          right: 0,
                          backgroundColor: 'rgb(255, 255, 255)',
                          border: '1px solid rgb(226, 232, 240)',
                          borderRadius: '6px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          zIndex: 50,
                          minWidth: '160px',
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          type="button"
                          onClick={handleExportText}
                          style={{
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
                            textAlign: 'left',
                          }}
                          data-testid="button-export-txt"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                          Plain Text (.txt)
                        </button>
                        <button
                          type="button"
                          onClick={handleExportPDF}
                          disabled={exportState === 'exporting'}
                          style={{
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
                            textAlign: 'left',
                          }}
                          data-testid="button-export-pdf"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(239, 68, 68)" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          PDF Document (.pdf)
                        </button>
                        <button
                          type="button"
                          onClick={handleExportWord}
                          disabled={exportState === 'exporting'}
                          style={{
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
                            textAlign: 'left',
                          }}
                          data-testid="button-export-docx"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(37, 99, 235)" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          Word Document (.docx)
                        </button>
                      </div>
                    )}
                  </div>
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={saveGeneration}
                      style={{
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
                        transition: 'all 0.2s ease',
                      }}
                      data-testid="button-save"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                      Save
                    </button>
                  )}
                </div>
              </div>
              <textarea
                readOnly
                value={output}
                style={{
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
                  lineHeight: 1.6,
                }}
                data-testid="output-content"
              />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer
          style={{
            marginTop: '64px',
            padding: '24px 16px',
            borderTop: '1px solid rgb(226, 232, 240)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '0.875rem',
              color: 'rgb(100, 116, 139)',
            }}
            data-testid="text-footer"
          >
            BizKit AI – Beta v1.0
          </p>
        </footer>

        {/* Subscription Prompt Modal */}
        {showSubscriptionPrompt && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowSubscriptionPrompt(false)}
            data-testid="modal-subscription-backdrop"
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px',
                maxWidth: '480px',
                width: '90%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
              data-testid="modal-subscription-content"
            >
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgb(238, 242, 255)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgb(99, 102, 241)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <h2
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    color: 'rgb(15, 23, 42)',
                    marginBottom: '8px',
                  }}
                  data-testid="text-subscription-title"
                >
                  Free Trial Used
                </h2>
                <p
                  style={{
                    fontSize: '1rem',
                    color: 'rgb(100, 116, 139)',
                    marginBottom: '24px',
                    lineHeight: 1.6,
                  }}
                  data-testid="text-subscription-message"
                >
                  You've used your free generation. Subscribe to unlock unlimited access to all content generation tools.
                </p>

                {!isAuthenticated && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '0.875rem', color: 'rgb(100, 116, 139)', marginBottom: '12px' }}>
                      Please sign in first to subscribe:
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSubscriptionPrompt(false)
                        window.location.href = '/api/login'
                      }}
                      style={{
                        width: '100%',
                        padding: '14px 24px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'white',
                        backgroundColor: 'rgb(99, 102, 241)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        marginBottom: '8px',
                      }}
                      data-testid="button-login-from-modal"
                    >
                      Sign In with Replit
                    </button>
                  </div>
                )}

                {isAuthenticated && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '0.875rem', color: 'rgb(100, 116, 139)', marginBottom: '12px' }}>
                      Contact us to subscribe and get unlimited access:
                    </p>
                    <a
                      href="mailto:support@bizkit.ai?subject=BizKit AI Subscription"
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '14px 24px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'white',
                        backgroundColor: 'rgb(99, 102, 241)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        textAlign: 'center',
                        boxSizing: 'border-box',
                      }}
                      data-testid="button-contact-subscribe"
                    >
                      Contact to Subscribe
                    </a>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowSubscriptionPrompt(false)}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'rgb(100, 116, 139)',
                    backgroundColor: 'transparent',
                    border: '1px solid rgb(226, 232, 240)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                  data-testid="button-close-subscription-modal"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auth Modal */}
        {showAuthModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowAuthModal(false)}
            data-testid="modal-auth-backdrop"
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
              data-testid="modal-auth-content"
            >
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: 'rgb(15, 23, 42)',
                  marginBottom: '8px',
                  textAlign: 'center',
                }}
              >
                {authMode === 'login' ? t.welcomeBack : t.createAccount}
              </h2>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'rgb(100, 116, 139)',
                  marginBottom: '24px',
                  textAlign: 'center',
                }}
              >
                {authMode === 'login' ? t.loginAccess : t.registerAccess}
              </p>

              {authError && (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'rgb(254, 242, 242)',
                    color: 'rgb(185, 28, 28)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    marginBottom: '16px',
                    textAlign: 'center',
                  }}
                  data-testid="text-auth-error"
                >
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'rgb(51, 65, 85)',
                      marginBottom: '6px',
                    }}
                  >
                    {t.email}
                  </label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '0.875rem',
                      border: '1px solid rgb(226, 232, 240)',
                      borderRadius: '8px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    data-testid="input-auth-email"
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'rgb(51, 65, 85)',
                      marginBottom: '6px',
                    }}
                  >
                    {t.password}
                  </label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    required
                    minLength={4}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '0.875rem',
                      border: '1px solid rgb(226, 232, 240)',
                      borderRadius: '8px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    data-testid="input-auth-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading2}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'white',
                    backgroundColor: authLoading2 ? 'rgb(148, 163, 184)' : 'rgb(99, 102, 241)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: authLoading2 ? 'not-allowed' : 'pointer',
                    marginBottom: '12px',
                  }}
                  data-testid="button-auth-submit"
                >
                  {authLoading2 ? t.pleaseWait : authMode === 'login' ? t.login : t.createAccount}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login')
                    setAuthError('')
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'rgb(99, 102, 241)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  data-testid="button-auth-switch"
                >
                  {authMode === 'login' ? t.noAccount : t.hasAccount}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'rgb(100, 116, 139)',
                  backgroundColor: 'transparent',
                  border: '1px solid rgb(226, 232, 240)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginTop: '8px',
                }}
                data-testid="button-auth-close"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
