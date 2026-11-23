import api from './axios'
import type { ApiSuccess } from '../types/api'
import type { ApproveResult, InfluencerSuggestion, SuggestionsData } from '../types/suggestion'

// Groups (har generation ke 5 log) aur generation ka haal. Yahan kuch generate nahi hota
export async function listSuggestions() {
  const res = await api.get<ApiSuccess<SuggestionsData>>('/admin/suggestions')
  return res.data.data
}

// Agle group ka waqt ho gaya ho to backend bana deta hai (page khula ho to har interval pe)
export async function tickSuggestions() {
  const res = await api.post<ApiSuccess<SuggestionsData>>('/admin/suggestions/tick', undefined, {
    timeout: 300_000,
  })
  return res.data.data
}

// Abhi naya group (interval ka intezar nahi)
export async function refreshSuggestions() {
  const res = await api.post<ApiSuccess<SuggestionsData>>('/admin/suggestions/generate', undefined, {
    timeout: 300_000,
  })
  return res.data.data
}

export async function approveSuggestion(id: string) {
  const res = await api.post<ApiSuccess<{ suggestion: InfluencerSuggestion }>>(
    `/admin/suggestions/${id}/approve`,
  )
  return res.data.data.suggestion
}

// Chune hue sab ek click mein directory mein
export async function approveSuggestions(ids: string[]) {
  const res = await api.post<ApiSuccess<{ results: ApproveResult[]; added: number }>>(
    '/admin/suggestions/approve',
    { ids },
  )
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
