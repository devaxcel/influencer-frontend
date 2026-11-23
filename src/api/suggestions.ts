import api from './axios'
import type { ApiSuccess } from '../types/api'
import type { InfluencerSuggestion } from '../types/suggestion'
import type { InfluencerSuggestionGroup } from '../types/suggestion'

export async function listSuggestions() {
  const res = await api.get<ApiSuccess<{
    suggestions: InfluencerSuggestion[]
    groups: InfluencerSuggestionGroup[]
    enabled: boolean
    intervalSeconds: number
  }>>(
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

export async function approveSuggestionGroup(groupId: string, ids?: string[]) {
  const res = await api.post<ApiSuccess<{
    approved: { suggestion: InfluencerSuggestion }[]
    failed: { id: string; code: string; message: string }[]
  }>>(`/admin/suggestions/groups/${encodeURIComponent(groupId)}/approve`, ids ? { ids } : {})
  return res.data.data
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
