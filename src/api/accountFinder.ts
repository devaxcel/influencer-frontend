import api from './axios'
import type { ApiSuccess } from '../types/api'

export interface Proposal {
  platform: string
  handle: string
  url: string
  followers: number
  sourceUrl?: string
}

export interface FoundForPerson {
  personId: string
  name: string
  slug: string
  proposals: Proposal[]
}

export interface MissingCounts {
  noAccounts: number
  pending: number
  searchedNoResult: number
}

export async function getMissingAccounts() {
  const res = await api.get<ApiSuccess<MissingCounts>>('/admin/people/missing-accounts')
  return res.data.data
}

// Agle chhote batch ki tajweezein (kuch save nahi hota); remaining > 0 ho to dobara bulao
export async function findAccountsBatch(options: { limit?: number; force?: boolean } = {}) {
  const res = await api.post<ApiSuccess<{ results: FoundForPerson[]; remaining: number }>>('/admin/people/find-accounts', options, { timeout: 180_000 })
  return res.data.data
}

// Profile form: naam se tajweezein (kuch save nahi hota)
export async function lookupAccounts(name: string, existing: { platform: string; handle?: string }[]) {
  const res = await api.post<ApiSuccess<{ proposals: Proposal[] }>>('/admin/people/lookup-accounts', { name, existing }, { timeout: 120_000 })
  return res.data.data.proposals
}

// Account lagao (server dobara live verify karta hai)
export async function addFoundAccount(personId: string, platform: string, handle: string) {
  const res = await api.post<ApiSuccess<{ name: string; handle: string; url: string; followers: number; totalFollowers: number }>>(
    '/admin/people/add-account',
    { personId, platform, handle },
    { timeout: 60_000 },
  )
  return res.data.data
}
