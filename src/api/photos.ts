import api from './axios'
import type { ApiSuccess } from '../types/api'

export interface PhotoGaps {
  missing: number
  broken: number
  pending: number
  searchedNoResult: number
}

export interface FillResult {
  name: string
  slug: string
  status: 'filled' | 'none'
  source?: 'youtube' | 'wikimedia'
  pageUrl?: string
}

export interface FillBatch {
  results: FillResult[]
  filled: number
  remaining: number
}

export async function getPhotoGaps() {
  const res = await api.get<ApiSuccess<PhotoGaps>>('/admin/people/photo-gaps')
  return res.data.data
}

// Ek chhota batch (server ek request mein kuch hi logon ko dhoondta hai); remaining > 0 ho to dobara bulao
export async function fillPhotoBatch(options: { limit?: number; force?: boolean } = {}) {
  const res = await api.post<ApiSuccess<FillBatch>>('/admin/people/fill-photos', options, { timeout: 180_000 })
  return res.data.data
}
