import { useState, FormEvent } from 'react'
import Head from 'next/head'

type Tool = 'cold_email' | 'proposal' | 'contract' | 'social_pack'
type CopyState = 'idle' | 'copied' | 'error'

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

const tabLabels: Record<Tool, string> = {
  cold_email: 'Cold Email',
  proposal: 'Proposal',
  contract: 'Contract',
  social_pack: 'Social Pack',
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tool>('cold_email')
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [output, setOutput] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [copyState, setCopyState] = useState<CopyState>('idle')

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
        body: JSON.stringify({
          tool: activeTab,
          inputs: formData[activeTab],
        }),
      })

      const data = await response.json()

      if (data.ok) {
        setOutput(data.output)
      } else {
        setOutput(previousOutput)
        setError(
          data.error === 'missing_openai_key'
            ? 'OpenAI API key is not configured. Please add your API key.'
            : data.error === 'openai_error'
            ? 'An error occurred while generating content. Please try again.'
            : data.error || 'An unexpected error occurred.'
        )
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
        body: JSON.stringify({
          tool: activeTab,
          inputs: formData[activeTab],
        }),
      })

      const data = await response.json()

      if (data.ok) {
        setOutput(data.output)
      } else {
        setError(
          data.error === 'missing_openai_key'
            ? 'OpenAI API key is not configured. Please add your API key.'
            : data.error === 'openai_error'
            ? 'An error occurred while generating content. Please try again.'
            : data.error || 'An unexpected error occurred.'
        )
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
              Free beta – Pro plans coming soon
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
            {(Object.keys(tabLabels) as Tool[]).map((tool) => (
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
                {tabLabels[tool]}
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
                      Target Audience
                    </label>
                    <input
                      id="target"
                      type="text"
                      placeholder="e.g. clinic owners in Istanbul"
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
                      Service
                    </label>
                    <input
                      id="service"
                      type="text"
                      placeholder="e.g. Google Ads management"
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
                      Tone
                    </label>
                    <input
                      id="tone"
                      type="text"
                      placeholder="friendly, professional, casual"
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
                      htmlFor="language"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      Language
                    </label>
                    <input
                      id="language"
                      type="text"
                      placeholder="English"
                      value={formData.cold_email.language}
                      onChange={(e) =>
                        updateFormField('cold_email', 'language', e.target.value)
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
                      data-testid="input-language"
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
                      Client Type
                    </label>
                    <input
                      id="clientType"
                      type="text"
                      placeholder="e-commerce brand, SaaS founder, etc."
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
                      Project Scope
                    </label>
                    <textarea
                      id="projectScope"
                      placeholder="Describe the project scope..."
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
                      Deliverables
                    </label>
                    <textarea
                      id="deliverables"
                      placeholder="List the deliverables..."
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
                      Budget Range
                    </label>
                    <input
                      id="budgetRange"
                      type="text"
                      placeholder="$2,000 - $5,000"
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
                      htmlFor="proposalLanguage"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      Language
                    </label>
                    <input
                      id="proposalLanguage"
                      type="text"
                      placeholder="English"
                      value={formData.proposal.language}
                      onChange={(e) =>
                        updateFormField('proposal', 'language', e.target.value)
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
                      data-testid="input-proposalLanguage"
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
                      Client Name
                    </label>
                    <input
                      id="clientName"
                      type="text"
                      placeholder="Client's full name or company name"
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
                      Provider Name
                    </label>
                    <input
                      id="providerName"
                      type="text"
                      placeholder="Your name or company name"
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
                      Service Description
                    </label>
                    <textarea
                      id="serviceDescription"
                      placeholder="Describe the services to be provided..."
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
                      Payment Terms
                    </label>
                    <input
                      id="paymentTerms"
                      type="text"
                      placeholder="e.g. 50% upfront, 50% on delivery"
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
                      Jurisdiction
                    </label>
                    <input
                      id="jurisdiction"
                      type="text"
                      placeholder="e.g. Turkey"
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
                      htmlFor="contractLanguage"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      Language
                    </label>
                    <input
                      id="contractLanguage"
                      type="text"
                      placeholder="English"
                      value={formData.contract.language}
                      onChange={(e) =>
                        updateFormField('contract', 'language', e.target.value)
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
                      data-testid="input-contractLanguage"
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
                      Business Type
                    </label>
                    <input
                      id="businessType"
                      type="text"
                      placeholder="e.g. coffee shop, agency"
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
                      Niche
                    </label>
                    <input
                      id="niche"
                      type="text"
                      placeholder="Your specific niche or industry"
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
                      Tone
                    </label>
                    <input
                      id="socialTone"
                      type="text"
                      placeholder="friendly, playful, educational"
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
                      Platform
                    </label>
                    <input
                      id="platform"
                      type="text"
                      placeholder="Instagram, LinkedIn, X"
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
                      htmlFor="socialLanguage"
                      style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'rgb(51, 65, 85)',
                        marginBottom: '8px',
                      }}
                    >
                      Language
                    </label>
                    <input
                      id="socialLanguage"
                      type="text"
                      placeholder="English"
                      value={formData.social_pack.language}
                      onChange={(e) =>
                        updateFormField('social_pack', 'language', e.target.value)
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
                      data-testid="input-socialLanguage"
                    />
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
      </div>
    </>
  )
}
