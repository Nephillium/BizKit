export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  email: string
  role: UserRole
  usageCount: number
  createdAt: Date
}

export interface Generation {
  id: number
  userId: string
  toolType: string
  inputs: Record<string, any>
  output: string
  createdAt: Date
}
