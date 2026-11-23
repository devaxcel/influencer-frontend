import type { SocialPlatform } from './person'

export interface SuggestionSocial {
  platform: SocialPlatform
  handle?: string
  url: string
  // Asal profile se verify hue followers (generation ke waqt) aur kis page se
  followers?: number
  followersSourceUrl?: string
  followersUpdatedAt?: string
}

export interface InfluencerSuggestion {
  _id: string
  date: string
  batchId?: string
  generatedAt?: string
  name: string
  scope: 'national' | 'international'
  country: string
  headline: string
  bio?: string
  photoUrl?: string
  websiteUrl?: string
  username?: string
  followerCount?: number
  reason: string
  profession?: string
  industry?: string
  topics: string[]
  socials: SuggestionSocial[]
  status: 'pending' | 'approved' | 'dismissed'
  personId?: string
}

export interface SuggestionGroup {
  batchId: string
  generatedAt: string
  suggestions: InfluencerSuggestion[]
}

export interface SuggestionsData {
  groups: SuggestionGroup[]
  suggestions: InfluencerSuggestion[]
  enabled: boolean
  generating: boolean
  intervalSeconds: number
  lastGeneratedAt: string | null
  nextGenerationAt: string | null
  lastError: string | null
  missingKeys: string[]
  result?: { status: string; error?: string; count?: number }
}

export interface ApproveResult {
  id: string
  ok: boolean
  personId?: string
  slug?: string
  error?: string
  code?: string
}
