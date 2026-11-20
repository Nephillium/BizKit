import { useEffect, useState, type FormEvent } from 'react'
import Head from 'next/head'
import { ContinueWithGoogle } from '../../components/ContinueWithGoogle'
import { useAuth } from '../../hooks/useAuth'
import { ACCOUNT_DELETION_EMAIL } from '../../lib/accountDeletionCopy'
import { googleSignInErrorMessage } from '../../lib/googleAuthCopy'
import { type Language } from '../../lib/translations'

const copy = {
  en: {
    title: 'Delete your PitchCrafter account',
    intro:
      'You can delete your PitchCrafter account from this page after you sign in, or from Settings in the Android app. Deletion removes the account, saved generations, credit balance, credit history, and any Google sign-in link stored by PitchCrafter, and signs you out.',
    retained:
      'PitchCrafter does not store your card number. Payment records that Stripe already keeps for a completed purchase stay in Stripe when tax or accounting rules require that record.',
    fallback: 'If you cannot sign in, email',
    signInTitle: 'Sign in to delete this account',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign in',
    signingIn: 'Signing in...',
    createAccount: 'Create an account on the home page',
    signedInAs: 'Signed in as',
    start: 'Delete account',
    confirmTitle: 'Delete this account permanently?',
    confirmBody: 'This cannot be undone. Your generations and credits will be removed and you will be signed out.',
    acknowledge: 'I understand this permanently deletes my account and its data.',
    confirm: 'Delete account',
    deleting: 'Deleting...',
    cancel: 'Cancel',
    doneTitle: 'Account deleted',
    doneBody: 'Your account and the data stored for it have been deleted.',
    home: 'Back to home',
    failed: 'Could not delete the account. Try again, or email',
  },
  tr: {
    title: 'PitchCrafter hesabınızı silin',
    intro:
      'Giriş yaptıktan sonra hesabınızı bu sayfadan veya Android uygulamasındaki Ayarlar ekranından silebilirsiniz. Silme işlemi PitchCrafter hesabını, kayıtlı üretimleri, kredi bakiyesini, kredi geçmişini ve varsa Google giriş bağlantısını kaldırır ve oturumu kapatır.',
    retained:
      'PitchCrafter kart numaranızı saklamaz. Tamamlanmış bir ödeme için Stripe’ın tuttuğu ödeme kayıtları, vergi veya muhasebe kuralları gerektirdiğinde Stripe’da kalır.',
    fallback: 'Giriş yapamıyorsanız e-posta gönderin:',
    signInTitle: 'Hesabı silmek için giriş yapın',
    email: 'E-posta',
    password: 'Şifre',
    signIn: 'Giriş yap',
    signingIn: 'Giriş yapılıyor...',
    createAccount: 'Ana sayfada hesap oluşturun',
    signedInAs: 'Giriş yapılan hesap',
    start: 'Hesabı sil',
    confirmTitle: 'Bu hesap kalıcı olarak silinsin mi?',
    confirmBody: 'Bu işlem geri alınamaz. Üretimleriniz ve kredileriniz kaldırılır ve oturumunuz kapatılır.',
    acknowledge: 'Hesabımın ve verilerimin kalıcı olarak silineceğini anlıyorum.',
    confirm: 'Hesabı sil',
    deleting: 'Siliniyor...',
    cancel: 'İptal',
    doneTitle: 'Hesap silindi',
    doneBody: 'Hesabınız ve bu hesap için saklanan veriler silindi.',
    home: 'Ana sayfaya dön',
    failed: 'Hesap silinemedi. Yeniden deneyin veya e-posta gönderin:',
  },
} as const

export default function DeleteAccountPage() {
  const { user, isLoading, isAuthenticated, login, deleteAccount } = useAuth()
  const [lang, setLang] = useState<Language>('en')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [done, setDone] = useState(false)
  const [googleAuth, setGoogleAuth] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('bizkit_lang')
    if (saved === 'en' || saved === 'tr') setLang(saved)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const message = googleSignInErrorMessage(params.get('google_error'))
    if (message) setAuthError(message)
    fetch('/api/config')
      .then((response) => response.json())
      .then((data: { googleAuth?: boolean }) => setGoogleAuth(data?.googleAuth === true))
      .catch(() => setGoogleAuth(false))
  }, [])

  const t = copy[lang]

  async function handleSignIn(event: FormEvent) {
    event.preventDefault()
    setSigningIn(true)
    setAuthError('')
    const result = await login(email, password)
    setSigningIn(false)
    if (!result.ok) setAuthError(result.error || 'Sign in failed')
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError('')
    const result = await deleteAccount()
    setDeleting(false)
    if (result.ok) {
      setDone(true)
      return
    }
    setDeleteError(result.error || 'delete_failed')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'rgb(248, 250, 252)' }}>
      <Head>
        <title>{t.title}</title>
        <meta name="description" content={t.intro} />
      </Head>
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 20px' }}>
        <p style={{ marginBottom: '16px' }}>
          <a href="/" style={{ color: 'rgb(99, 102, 241)', textDecoration: 'none' }} data-testid="link-home">
            {t.home}
          </a>
        </p>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'rgb(15, 23, 42)', marginBottom: '16px' }}>
          {t.title}
        </h1>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'rgb(51, 65, 85)', marginBottom: '12px' }}>
          {t.intro}
        </p>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'rgb(51, 65, 85)', marginBottom: '12px' }}>
          {t.retained}
        </p>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: 'rgb(51, 65, 85)', marginBottom: '32px' }}>
          {t.fallback}{' '}
          <a href={`mailto:${ACCOUNT_DELETION_EMAIL}`} data-testid="link-deletion-email">
            {ACCOUNT_DELETION_EMAIL}
          </a>
          .
        </p>

        {done ? (
          <section>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{t.doneTitle}</h2>
            <p style={{ color: 'rgb(51, 65, 85)' }}>{t.doneBody}</p>
          </section>
        ) : isLoading ? (
          <p style={{ color: 'rgb(100, 116, 139)' }}>...</p>
        ) : !isAuthenticated ? (
          <section id="sign-in">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>{t.signInTitle}</h2>
            {googleAuth && (
              <div style={{ maxWidth: '420px' }}>
                <ContinueWithGoogle href="/api/auth/google/start?return_to=account-delete" />
              </div>
            )}
            <form onSubmit={handleSignIn} style={{ display: 'grid', gap: '12px', maxWidth: '420px' }}>
              <label style={{ display: 'grid', gap: '6px', color: 'rgb(51, 65, 85)' }}>
                {t.email}
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  required
                  data-testid="input-delete-email"
                  style={inputStyle}
                />
              </label>
              <label style={{ display: 'grid', gap: '6px', color: 'rgb(51, 65, 85)' }}>
                {t.password}
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  data-testid="input-delete-password"
                  style={inputStyle}
                />
              </label>
              {authError && (
                <p style={{ color: 'rgb(153, 27, 27)', margin: 0 }} data-testid="text-auth-error">
                  {authError}
                </p>
              )}
              <button type="submit" disabled={signingIn} style={primaryButton} data-testid="button-sign-in-delete">
                {signingIn ? t.signingIn : t.signIn}
              </button>
            </form>
            <p style={{ marginTop: '16px' }}>
              <a href="/" style={{ color: 'rgb(99, 102, 241)' }} data-testid="link-sign-in-home">
                {t.createAccount}
              </a>
            </p>
            <p style={{ marginTop: '8px' }}>
              <a href="/privacy" style={{ color: 'rgb(100, 116, 139)' }} data-testid="link-sign-in-privacy">
                Privacy
              </a>
            </p>
          </section>
        ) : (
          <section>
            <p style={{ marginBottom: '16px', color: 'rgb(51, 65, 85)' }}>
              {t.signedInAs} <strong>{user?.email}</strong>
            </p>
            {!confirming ? (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                style={dangerButton}
                data-testid="button-start-delete"
              >
                {t.start}
              </button>
            ) : (
              <div
                style={{
                  backgroundColor: 'white',
                  border: '1px solid rgb(254, 202, 202)',
                  borderRadius: '12px',
                  padding: '20px',
                }}
              >
                <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{t.confirmTitle}</h2>
                <p style={{ color: 'rgb(51, 65, 85)', marginBottom: '16px' }}>{t.confirmBody}</p>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(event) => setAcknowledged(event.target.checked)}
                    data-testid="checkbox-confirm-delete"
                  />
                  <span>{t.acknowledge}</span>
                </label>
                {deleteError && (
                  <p style={{ color: 'rgb(153, 27, 27)' }} data-testid="text-delete-error">
                    {t.failed} {ACCOUNT_DELETION_EMAIL}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    disabled={!acknowledged || deleting}
                    onClick={handleDelete}
                    style={{ ...dangerButton, opacity: !acknowledged || deleting ? 0.6 : 1 }}
                    data-testid="button-confirm-delete"
                  >
                    {deleting ? t.deleting : t.confirm}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirming(false)
                      setAcknowledged(false)
                    }}
                    style={secondaryButton}
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

const inputStyle = {
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid rgb(203, 213, 225)',
  fontSize: '1rem',
}

const primaryButton = {
  padding: '12px 16px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: 'rgb(99, 102, 241)',
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer',
}

const dangerButton = {
  padding: '12px 16px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: 'rgb(220, 38, 38)',
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer',
}

const secondaryButton = {
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid rgb(203, 213, 225)',
  backgroundColor: 'white',
  color: 'rgb(51, 65, 85)',
  fontWeight: 600,
  cursor: 'pointer',
}
