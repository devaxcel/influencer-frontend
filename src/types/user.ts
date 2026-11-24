import type { CompanySize, OrganizationType } from './business'

export type Role = 'talent' | 'representative' | 'business' | 'admin'
export type SignupRole = Exclude<Role, 'admin'>

export interface User {
  _id: string
  name: string
  email: string
  role: Role
  isEmailVerified: boolean
  status: 'active' | 'suspended'
  country?: string // ✅ Added for suggestions feature
  avatarUrl?: string
  company?: {
    organizationType?: OrganizationType
    companyName: string
    industry?: string
    companySize?: CompanySize
    description?: string
    country?: string
    websiteUrl?: string
  }
  manager?: {
    agencyName?: string
    country?: string
    websiteUrl?: string
  }
  createdAt: string
  updatedAt: string
}