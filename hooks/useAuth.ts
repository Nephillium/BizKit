import { useState, useEffect } from 'react'
import type { User } from '../shared/schema'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/user', {
          credentials: 'include',
        })
        if (response.ok) {
          const user = await response.json()
          setState({
            user,
            isLoading: false,
            isAuthenticated: true,
          })
        } else {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          })
        }
      } catch (error) {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    }

    fetchUser()
  }, [])

  return state
}
