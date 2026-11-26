export interface InfluencerSuggestion {
  _id: string
  name: string
  headline?: string
  photoUrl?: string
  followerCount?: number
  socials: {
    platform: string
    handle?: string
    url: string
    followers?: number
  }[]
  reason?: string
  scope: 'national' | 'international'
  category?: 'leader' | 'tech' | 'influencer' | 'professional' | 'trending'
  status: 'pending' | 'approved' | 'dismissed'
  batchId?: string
  generatedAt?: string
}

export interface SuggestionGroup {
  batchId: string
  generatedAt: string
  suggestions: InfluencerSuggestion[]
}

export interface SuggestionsData {
  enabled: boolean
  generating: boolean
  lastGeneratedAt: string | null
  nextGenerationAt: string | null
  lastError: string | null
  intervalSeconds: number
  missingKeys: string[]
  groups: SuggestionGroup[]
  suggestions: InfluencerSuggestion[]

 result?: { status: string; batchId?: string; count?: number; error?: string }
}

export interface ApproveResult {
  id: string
  ok: boolean
  personId?: string
  slug?: string
  error?: string
  code?: string
}
