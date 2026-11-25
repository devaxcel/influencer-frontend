import api from './axios'
import type { ApiSuccess } from '../types/api'

export type HubKind = 'profession' | 'industry' | 'topic'

export interface HubCountry {
  code: string
  name: string
  slug: string
}

export interface HubLink {
  kind: HubKind
  name: string
  slug: string
  country?: HubCountry
  count: number
  path: string
}

export interface Hub {
  kind: HubKind
  name: string
  slug: string
  country?: HubCountry
  path: string
  total: number
  verified: number
  openToWork: number
  followers: number
  intro: string
  faqs: { q: string; a: string }[]
  indexable: boolean
}

export async function listHubs() {
  const res = await api.get<ApiSuccess<{ hubs: HubLink[] }>>('/hubs/talent')
  return res.data.data.hubs
}

export async function getHub(segment: string, country?: string) {
  const res = await api.get<ApiSuccess<{ hub: Hub }>>(
    `/hubs/talent/${encodeURIComponent(segment)}${country ? `/${encodeURIComponent(country)}` : ''}`,
  )
  return res.data.data.hub
}
