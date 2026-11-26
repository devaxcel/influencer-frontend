import api from './axios'
import type { ApiSuccess } from '../types/api'
import type { ApproveResult, InfluencerSuggestion, SuggestionsData } from '../types/suggestion'

export async function listSuggestions() {
  const res = await api.get<ApiSuccess<SuggestionsData>>('/admin/suggestions')
  return res.data.data
}

// ✅ Naya API function
export async function getSuggestionDetail(id: string) {
  const res = await api.get<ApiSuccess<InfluencerSuggestion>>(`/admin/suggestions/${id}`)
  return res.data.data
}

export async function tickSuggestions(country: string = 'PK') {
  const res = await api.post<ApiSuccess<SuggestionsData>>('/admin/suggestions/tick', { country }, {
    timeout: 300_000,
  })
  return res.data.data
}

export async function refreshSuggestions(country: string = 'PK') {
  const res = await api.post<ApiSuccess<SuggestionsData>>('/admin/suggestions/generate', { country }, {
    timeout: 300_000,
  })
  return res.data.data
}

export async function approveSuggestion(id: string) {
  const res = await api.post<ApiSuccess<{ suggestion: InfluencerSuggestion }>>(`/admin/suggestions/${id}/approve`)
  return res.data.data.suggestion
}

export async function approveSuggestions(ids: string[]) {
  const res = await api.post<ApiSuccess<{ results: ApproveResult[]; added: number }>>('/admin/suggestions/approve', { ids })
  return res.data.data
}

export async function dismissSuggestion(id: string) {
  const res = await api.post<ApiSuccess<InfluencerSuggestion>>(`/admin/suggestions/${id}/dismiss`)
  return res.data.data
}

export async function updateSuggestionSetting(enabled: boolean) {
  const res = await api.patch<ApiSuccess<{ enabled: boolean }>>('/admin/suggestions/settings', { enabled })
  return res.data.data.enabled
}
export interface SuggestionStatDay {
  date: string
  generated: number
  approved: number
  dismissed: number
  tracked: boolean
}

export interface SuggestionStats {
  days: SuggestionStatDay[]
  totals: { generated: number; approved: number; dismissed: number; pending: number }
  categories: { category: string; generated: number; approved: number; dismissed: number }[]
  trackedSince: string | null
  dailyTarget: number
  nextGenerationAt: string | null
}

// Roz kitni suggestions bani / approve / dismiss hui
export async function getSuggestionStats(days = 14) {
  const res = await api.get<ApiSuccess<SuggestionStats>>('/admin/suggestions/stats', { params: { days } })
  return res.data.data
}
