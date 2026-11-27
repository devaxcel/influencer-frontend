import api from './axios'
import { freshParams } from './freshness'
import type { ApiSuccess } from '../types/api'
import type { Person, PersonSummary, TaxonomyItem, TaxonomyType } from '../types/person'

// URL ke search params seedha backend ko bhej dete hain
export async function listPeople(params: URLSearchParams) {
  const query = new URLSearchParams(params)
  Object.entries(freshParams()).forEach(([key, value]) => query.set(key, value))
  const res = await api.get<ApiSuccess<{ people: PersonSummary[] }>>('/people', { params: query })
  return { people: res.data.data.people, meta: res.data.meta! }
}

export async function getPerson(slug: string) {
  const res = await api.get<ApiSuccess<{ person: Person }>>(`/people/${slug}`, {
    params: freshParams(),
  })
  return res.data.data.person
}

export async function listTaxonomy(type: TaxonomyType) {
  const res = await api.get<ApiSuccess<{ items: TaxonomyItem[] }>>(`/taxonomy/${type}`)
  return res.data.data.items
}

export interface FeaturedPerson extends PersonSummary {
  weekly: { score: number; source: 'popular' | 'rotation' }
}

// "Featured this week": pichhle 7 din ke sab se maqbool; kam hon to hafte ki chunni hui mix se bhare hue
export async function getFeaturedWeek(limit = 8) {
  const res = await api.get<ApiSuccess<{ people: FeaturedPerson[] }>>('/people/featured-week', { params: { limit } })
  return res.data.data.people
}

// Profile khulne par ek dafa (server alag visitor / din ginta hai, bots nahi)
export async function trackProfileView(slug: string) {
  await api.post(`/people/${encodeURIComponent(slug)}/view`)
}
