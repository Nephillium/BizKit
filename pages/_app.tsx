import type { AppProps } from 'next/app'
import '@/styles/globals.css'
import { useState, useEffect } from 'react'

function MyApp({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <Component {...pageProps} />
}

export default MyApp
