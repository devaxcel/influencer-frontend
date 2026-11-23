import api from './axios'
import type { ApiSuccess } from '../types/api'
import type { InfluencerSuggestion } from '../types/suggestion'

export async function listSuggestions() {
  const res = await api.get<ApiSuccess<{ suggestions: InfluencerSuggestion[]; enabled: boolean; intervalSeconds: number }>>(
    '/admin/suggestions',
  )
  return res.data.data
}

export async function refreshSuggestions() {
  const res = await api.post<ApiSuccess<{ suggestions: InfluencerSuggestion[]; enabled: boolean; intervalSeconds: number }>>(
    '/admin/suggestions/generate',
  )
  return res.data.data
}

export async function approveSuggestion(id: string) {
  const res = await api.post<ApiSuccess<{ suggestion: InfluencerSuggestion }>>(
    `/admin/suggestions/${id}/approve`,
  )
  return res.data.data.suggestion
}

export async function dismissSuggestion(id: string) {
  const res = await api.post<ApiSuccess<InfluencerSuggestion>>(`/admin/suggestions/${id}/dismiss`)
  return res.data.data
}

export async function updateSuggestionSetting(enabled: boolean) {
  const res = await api.patch<ApiSuccess<{ enabled: boolean }>>('/admin/suggestions/settings', {
    enabled,
  })
  return res.data.data.enabled
}
