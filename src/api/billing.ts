import { queryOptions } from '@tanstack/react-query'
import api from './axios'
import type { ApiSuccess } from '../types/api'

// Payments (Polar.sh): Pro plans, checkout aur subscription

export type PaidRole = 'business' | 'representative' | 'talent'
export type PlanFeature = 'hiresPerMonth' | 'openCampaigns' | 'talents' | 'applicationsPerMonth'

export interface Plan {
  role: PaidRole
  enabled: boolean
  freeLimits: Partial<Record<PlanFeature, number>>
  name: string | null
  description: string | null
  price: { type: string; amount: number | null; currency: string; interval: string | null } | null
}

export interface MyBilling {
  enabled: boolean
  sandbox: boolean
  plan: 'free' | 'pro'
  subscription: {
    status: string
    amount: number | null
    currency: string | null
    interval: string | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
  } | null
  usage: { feature: PlanFeature; used: number; limit: number | null }[]
}

export async function getPlans() {
  const res = await api.get<ApiSuccess<{ plans: Plan[] }>>('/billing/plans')
  return res.data.data.plans
}

export async function getMyBilling(sync = false) {
  const res = await api.get<ApiSuccess<MyBilling>>('/billing/me', { params: sync ? { sync: 1 } : {} })
  return res.data.data
}

// Polar ke checkout page ka link
export async function startCheckout(role: string) {
  const res = await api.post<ApiSuccess<{ url: string }>>('/billing/checkout', { role })
  return res.data.data.url
}

// Polar ka customer portal: card badlo, cancel, invoices
export async function openBillingPortal() {
  const res = await api.post<ApiSuccess<{ url: string }>>('/billing/portal')
  return res.data.data.url
}

export const plansQuery = queryOptions({
  queryKey: ['billing', 'plans'],
  queryFn: getPlans,
  staleTime: 5 * 60 * 1000,
})

export const myBillingQuery = queryOptions({
  queryKey: ['billing', 'me'],
  queryFn: () => getMyBilling(),
  staleTime: 30 * 1000,
})