import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useAuth } from '../hooks/useAuth'
import { translations, type Language } from '../lib/translations'

interface CreditPackage {
  id: string
  credits: number
  price: number
  name: string
  popular?: boolean
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'credits_10', credits: 10, price: 500, name: '10 Credits' },
  { id: 'credits_50', credits: 50, price: 2000, name: '50 Credits', popular: true },
  { id: 'credits_100', credits: 100, price: 3500, name: '100 Credits' },
]

export default function BuyCredits() {
  const { user, isLoading, isAuthenticated, refresh } = useAuth()
  const [lang, setLang] = useState<Language>('en')
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const savedLang = localStorage.getItem('bizkit_lang') as Language
    if (savedLang && (savedLang === 'en' || savedLang === 'tr')) {
      setLang(savedLang)
    }
  }, [])

  const t = translations[lang]

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      setMessage({ type: 'success', text: t.creditsAdded })
      refresh()
      window.history.replaceState({}, '', '/buy-credits')
    } else if (params.get('canceled') === 'true') {
      setMessage({ type: 'error', text: t.paymentCanceled })
      window.history.replaceState({}, '', '/buy-credits')
    }
  }, [lang, refresh, t.creditsAdded, t.paymentCanceled])

  const handlePurchase = async (packageId: string) => {
    setPurchasing(packageId)
    setMessage(null)

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ packageId }),
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        console.error('Checkout error:', response.status, text)
        setMessage({ type: 'error', text: 'Failed to create checkout session' })
        return
      }

      const data = await response.json()

      if (!data || !data.url) {
        console.error('No checkout URL returned:', data)
        setMessage({ type: 'error', text: data.error || 'Failed to create checkout session' })
        return
      }

      window.location.href = data.url
    } catch (error) {
      console.error('Checkout request failed:', error)
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setPurchasing(null)
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '1rem', color: 'rgb(100, 116, 139)' }}>{t.loading}</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
        <Head>
          <title>{t.buyCredits} - BizKit AI</title>
        </Head>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '16px', color: 'rgb(15, 23, 42)' }}>
          {t.pleaseLogIn}
        </h1>
        <p style={{ fontSize: '1rem', color: 'rgb(100, 116, 139)', marginBottom: '24px' }}>
          {t.needToLogIn}
        </p>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: 500,
            color: 'white',
            backgroundColor: 'rgb(99, 102, 241)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
          data-testid="button-go-home"
        >
          {t.goHome}
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'rgb(248, 250, 252)' }}>
      <Head>
        <title>Buy Credits - BizKit AI</title>
        <meta name="description" content="Purchase credits for BizKit AI content generation" />
      </Head>

      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          backgroundColor: 'white',
          borderBottom: '1px solid rgb(226, 232, 240)',
        }}
      >
        <a href="/" style={{ fontWeight: 600, fontSize: '1.125rem', color: 'rgb(15, 23, 42)', textDecoration: 'none' }}>
          BizKit AI
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.875rem', color: 'rgb(51, 65, 85)' }}>
            {user?.email}
          </span>
          <span style={{ fontSize: '0.875rem', color: 'rgb(100, 116, 139)', backgroundColor: 'rgb(241, 245, 249)', padding: '4px 12px', borderRadius: '20px' }}>
            {user?.credits ?? 0} {t.creditsLeft}
          </span>
        </div>
      </nav>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'rgb(15, 23, 42)', marginBottom: '12px' }}>
            {t.buyCredits}
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'rgb(100, 116, 139)' }}>
            {t.purchaseCredits}
          </p>
        </div>

        {message && (
          <div
            style={{
              padding: '16px',
              marginBottom: '24px',
              borderRadius: '8px',
              backgroundColor: message.type === 'success' ? 'rgb(220, 252, 231)' : 'rgb(254, 226, 226)',
              color: message.type === 'success' ? 'rgb(22, 101, 52)' : 'rgb(153, 27, 27)',
              textAlign: 'center',
            }}
            data-testid="message-status"
          >
            {message.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          {CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              style={{
                position: 'relative',
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '32px 24px',
                boxShadow: pkg.popular ? '0 4px 20px rgba(99, 102, 241, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: pkg.popular ? '2px solid rgb(99, 102, 241)' : '1px solid rgb(226, 232, 240)',
                textAlign: 'center',
              }}
              data-testid={`card-package-${pkg.id}`}
            >
              {pkg.popular && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgb(99, 102, 241)',
                    color: 'white',
                    padding: '4px 16px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {t.mostPopular}
                </div>
              )}

              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'rgb(15, 23, 42)', marginBottom: '8px' }}>
                {pkg.name}
              </h3>

              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'rgb(99, 102, 241)', marginBottom: '8px' }}>
                ${(pkg.price / 100).toFixed(2)}
              </div>

              <p style={{ fontSize: '0.875rem', color: 'rgb(100, 116, 139)', marginBottom: '24px' }}>
                ${((pkg.price / 100) / pkg.credits).toFixed(2)} {t.perCredit}
              </p>

              <button
                onClick={() => handlePurchase(pkg.id)}
                disabled={purchasing !== null}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'white',
                  backgroundColor: purchasing === pkg.id ? 'rgb(148, 163, 184)' : 'rgb(99, 102, 241)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: purchasing !== null ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                }}
                data-testid={`button-buy-${pkg.id}`}
              >
                {purchasing === pkg.id ? t.loading : t.buyNow}
              </button>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <a
            href="/"
            style={{
              fontSize: '0.875rem',
              color: 'rgb(99, 102, 241)',
              textDecoration: 'none',
            }}
            data-testid="link-back-home"
          >
            {t.backToHome}
          </a>
        </div>
      </main>
    </div>
  )
}
