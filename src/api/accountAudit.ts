import api from './axios'
import type { ApiSuccess } from '../types/api'

export interface AuditAccount {
  personId: string
  name: string
  slug: string
  platform: string
  handle: string
  url: string
  followers: number | null
  reason: 'reserved' | 'unrelated'
}

export interface RemoveResult {
  name: string
  removed: true
  replacement: { handle: string; followers: number } | null
}

const BASE = '/admin/people/account-audit'

export async function getAccountAudit() {
  const res = await api.get<ApiSuccess<{ accounts: AuditAccount[] }>>(BASE)
  return res.data.data.accounts
}

// Galat account hatao; findCorrect = us platform pe sahi account dhoondo (search ke credit lagte hain, thora waqt)
export async function removeAuditAccount(account: Pick<AuditAccount, 'personId' | 'platform' | 'handle'>, findCorrect: boolean) {
  const res = await api.post<ApiSuccess<RemoveResult>>(`${BASE}/remove`, { ...account, findCorrect }, { timeout: 120_000 })
  return res.data.data
}

export async function keepAuditAccount(account: Pick<AuditAccount, 'personId' | 'platform' | 'handle'>) {
  await api.post(`${BASE}/keep`, account)
}

export interface LinkChange {
  personId: string
  name: string
  slug: string
  platform: string
  from: string
  to: string
}

export interface LinkProblem {
  personId: string
  name: string
  slug: string
  platform: string
  handle: string
  url: string
}

export interface LinkCheck {
  checked: number
  fixed: LinkChange[]
  missing: LinkProblem[]
  unverified: LinkProblem[]
  youtubeSkipped: boolean
}

// Social links ki jaanch: YouTube ke galat handle khud theek (fix = true), baqi ki fehrist
export async function checkSocialLinks(fix = true) {
  const res = await api.post<ApiSuccess<LinkCheck>>('/admin/people/check-links', { fix }, { timeout: 180_000 })
  return res.data.data
}
