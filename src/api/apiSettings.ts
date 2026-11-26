import api from './axios'
import type { ApiSuccess } from '../types/api'

export type KeyId = 'tavily' | 'brave' | 'serper' | 'anthropic' | 'groq' | 'youtube'
export type SearchId = 'tavily' | 'brave' | 'serper'

export interface KeyUsage {
  provider: string
  today: number
  month: number
  monthCalls: number
  errors30: number
  quotaHits30: number
  lastError: string | null
  lastErrorAt: string | null
}

export interface ApiKeyInfo {
  id: KeyId
  label: string
  group: 'search' | 'llm' | 'data'
  tier: 'free' | 'paid' | 'free-tier'
  purpose: string
  note: string
  docsUrl: string
  configured: boolean
  source: 'dashboard' | 'env' | null
  masked: string | null
  updatedAt: string | null
  usage: KeyUsage
}

export interface ApiConfig {
  searchOrder: SearchId[]
  llmProvider: 'auto' | 'anthropic' | 'groq'
  anthropicModel: string
  groqModel: string
  tavilyDepth: 'basic' | 'advanced'
}

export interface ApiSettingsData {
  keys: ApiKeyInfo[]
  config: ApiConfig
}

const BASE = '/admin/settings/api'

export async function getApiSettings() {
  const res = await api.get<ApiSuccess<ApiSettingsData>>(BASE)
  return res.data.data
}

export async function saveApiKey(id: KeyId, value: string) {
  const res = await api.put<ApiSuccess<ApiSettingsData>>(`${BASE}/keys/${id}`, { value })
  return res.data.data
}

export async function removeApiKey(id: KeyId) {
  const res = await api.delete<ApiSuccess<ApiSettingsData>>(`${BASE}/keys/${id}`)
  return res.data.data
}

export async function testApiKey(id: KeyId) {
  const res = await api.post<ApiSuccess<{ ok: boolean; message: string }>>(`${BASE}/keys/${id}/test`, undefined, { timeout: 30_000 })
  return res.data.data
}

export async function saveApiConfig(patch: Partial<ApiConfig>) {
  const res = await api.patch<ApiSuccess<ApiSettingsData>>(`${BASE}/config`, patch)
  return res.data.data
}
