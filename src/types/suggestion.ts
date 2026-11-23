import type { SocialPlatform } from './person'

export interface InfluencerSuggestion {
  _id: string
  date: string
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
  profession: string
  industry: string
  topics: string[]
  socials: { platform: SocialPlatform; handle?: string; url: string }[]
  status: 'pending' | 'approved' | 'dismissed'
  personId?: string
}
