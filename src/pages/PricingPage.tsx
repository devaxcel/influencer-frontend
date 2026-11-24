import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBuilding,
  faCheck,
  faCrown,
  faLock,
  faStar,
  faUserTie,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons'
import { myBillingQuery, plansQuery, startCheckout, type PaidRole, type Plan, type PlanFeature } from '../api/billing'
import { useAuth } from '../hooks/useAuth'
import { getApiError } from '../utils/apiError'
import { money } from '../utils/price'
import { useJsonLd, SITE_URL } from '../utils/jsonLd'

const ROLE_ICONS: Record<PaidRole, IconDefinition> = {
  business: faBuilding,
  representative: faUserTie,
  talent: faStar,
}

function planPrice(plan: Plan, t: (key: string) => string) {
  if (!plan.price || plan.price.amount === null) return null
  const per = plan.price.interval === 'year' ? t('billing.perYear') : t('billing.perMonth')
  return { amount: money(plan.price.amount, plan.price.currency), per }
}

function FeatureRow({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <li className={`flex items-start gap-2.5 text-sm ${muted ? 'text-gray-500' : 'text-gray-700'}`}>
      <FontAwesomeIcon icon={faCheck} className={`mt-1 shrink-0 text-xs ${muted ? 'text-gray-400' : 'text-brand'}`} />
      <span>{children}</span>
    </li>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const sameRole = user?.role === plan.role
  const { data: mine } = useQuery({ ...myBillingQuery, enabled: Boolean(sameRole) })
  const features = Object.keys(plan.freeLimits) as PlanFeature[]
  const price = planPrice(plan, t)
  const isPro = sameRole && mine?.plan === 'pro'

  async function upgrade() {
    setBusy(true)
    try {
      // ✅ FIX: startCheckout mein plan.role pass kiya gaya
      const url = await startCheckout(plan.role)
      window.location.assign(url)
    } catch (error) {
      toast.error(getApiError(error).message)
      setBusy(false)
    }
  }

  const button = 'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition'
  let action: React.ReactNode
  if (!plan.enabled) {
    action = <p className="rounded-xl bg-gray-50 px-4 py-3 text-center text-sm text-gray-500">{t('billing.comingSoonNote')}</p>
  } else if (!user) {
    action = (
      <Link to="/register" className={`${button} bg-brand text-on-brand hover:bg-brand-hover`}>
        {t('billing.signUpToUpgrade')}
      </Link>
    )
  } else if (!sameRole) {
    action = (
      <p className="rounded-xl bg-gray-50 px-4 py-3 text-center text-sm text-gray-500">
        {t('billing.forRole', { role: t(`billing.roleName.${plan.role}`) })}
      </p>
    )
  } else if (isPro) {
    action = (
      <Link to="/dashboard/billing" className={`${button} bg-gray-100 text-gray-800 hover:bg-gray-200`}>
        <FontAwesomeIcon icon={faCrown} /> {t('billing.currentPlan')}
      </Link>
    )
  } else {
    action = (
      <button type="button" onClick={upgrade} disabled={busy} className={`${button} bg-brand text-on-brand hover:bg-brand-hover disabled:opacity-60`}>
        <FontAwesomeIcon icon={faCrown} /> {busy ? t('billing.redirecting') : t('billing.upgrade')}
      </button>
    )
  }

  return (
    <article className="flex flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-200/70 md:p-7">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-on-brand">
          <FontAwesomeIcon icon={ROLE_ICONS[plan.role]} />
        </span>
        <h2 className="text-lg font-bold">{t(`billing.roles.${plan.role}`)}</h2>
      </div>

      <div className="mt-6 rounded-2xl bg-gray-50 p-4">
        <h3 className="text-sm font-semibold text-gray-900">{t('billing.free')}</h3>
        <ul className="mt-3 space-y-2">
          {features.map((feature) => (
            <FeatureRow key={feature} muted>
              {plan.enabled
                ? t(`billing.limit.${feature}`, { count: plan.freeLimits[feature] })
                : t(`billing.unlimited.${feature}`)}
            </FeatureRow>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex-1 rounded-2xl p-4 ring-2 ring-brand/40">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <FontAwesomeIcon icon={faCrown} className="text-brand" /> {plan.name || t('billing.pro')}
          </h3>
          {price ? (
            <p className="text-right">
              <span className="text-2xl font-extrabold tracking-tight">{price.amount}</span>{' '}
              <span className="text-sm text-gray-500">{price.per}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-500">{t('billing.comingSoon')}</p>
          )}
        </div>
        <ul className="mt-3 space-y-2">
          {features.map((feature) => (
            <FeatureRow key={feature}>{t(`billing.unlimited.${feature}`)}</FeatureRow>
          ))}
          <FeatureRow>{t('billing.proExtra')}</FeatureRow>
        </ul>
      </div>

      <div className="mt-6">{action}</div>
    </article>
  )
}

// /pricing: har account type ka Free aur Pro plan (daam Polar se)
function PricingPage() {
  const { t, i18n } = useTranslation()
  const { data: plans, isLoading, isError } = useQuery(plansQuery)

  useJsonLd(
    'ld-page',
    plans
      ? {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          url: `${SITE_URL}/pricing`,
          name: 'Influnexa plans and pricing',
          inLanguage: i18n.language,
          mainEntity: {
            '@type': 'OfferCatalog',
            name: 'Influnexa Pro plans',
            itemListElement: plans
              .filter((plan) => plan.enabled && plan.price?.amount != null)
              .map((plan) => ({
                '@type': 'Offer',
                name: plan.name ?? `Pro (${plan.role})`,
                price: plan.price!.amount,
                priceCurrency: plan.price!.currency,
                priceSpecification: {
                  '@type': 'UnitPriceSpecification',
                  price: plan.price!.amount,
                  priceCurrency: plan.price!.currency,
                  unitText: plan.price!.interval === 'year' ? 'per year' : 'per month',
                },
                url: `${SITE_URL}/pricing`,
              })),
          },
        }
      : null,
  )

  return (
    <div className="space-y-10">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t('billing.pricingTitle')}</h1>
        <p className="mt-3 text-gray-600">{t('billing.pricingSubtitle')}</p>
      </header>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-96 animate-pulse rounded-3xl bg-gray-100" />
          ))}
        </div>
      ) : isError || !plans ? (
        <p className="text-center text-gray-500">{t('site.somethingWrong')}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.role} plan={plan} />
          ))}
        </div>
      )}

      <div className="mx-auto max-w-2xl space-y-2 text-center text-sm text-gray-500">
        <p>{t('billing.alwaysFree')}</p>
        <p className="flex items-center justify-center gap-2">
          <FontAwesomeIcon icon={faLock} /> {t('billing.securePayments')}
        </p>
      </div>
    </div>
  )
}

export default PricingPage