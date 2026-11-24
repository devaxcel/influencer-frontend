import { useMemo, useState } from 'react'
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
import {
  myBillingQuery,
  plansQuery,
  startCheckout,
  type PaidRole,
  type Plan,
  type PlanFeature,
} from '../api/billing'
import { useAuth } from '../hooks/useAuth'
import { getApiError } from '../utils/apiError'
import { money } from '../utils/price'
import { useJsonLd, SITE_URL } from '../utils/jsonLd'

const ROLE_ICONS: Record<PaidRole, IconDefinition> = {
  business: faBuilding,
  representative: faUserTie,
  talent: faStar,
}

type BillingInterval = 'month' | 'year'

// Helper to calculate the price based on the selected interval
function planPrice(plan: Plan, interval: BillingInterval, t: (key: string) => string) {
  if (!plan.price || plan.price.amount === null) return null
  
  let amount = plan.price.amount
  let per = t('billing.perMonth')
  
  // If the user selected "Annually", we calculate the yearly price.
  // We assume a 20% discount for paying yearly (amount * 12 * 0.8)
  if (interval === 'year') {
    amount = Math.round(amount * 12 * 0.8)
    per = t('billing.perYear')
  }

  return { amount: money(amount, plan.price.currency), per }
}

function FeatureRow({
  children,
  muted = false,
  checked = true,
}: {
  children: React.ReactNode
  muted?: boolean
  checked?: boolean
}) {
  return (
    <li
      className={`flex items-start gap-2.5 text-sm ${
        muted ? 'text-gray-500' : 'text-gray-700'
      }`}
    >
      {checked && (
        <FontAwesomeIcon
          icon={faCheck}
          className={`mt-1 shrink-0 text-xs ${
            muted ? 'text-gray-400' : 'text-brand'
          }`}
        />
      )}
      <span>{children}</span>
    </li>
  )
}

function PlanCard({
  plan,
  recommended,
  interval,
}: {
  plan: Plan
  recommended?: boolean
  interval: BillingInterval
}) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const sameRole = user?.role === plan.role
  
  // Real query: Fetches the user's active plan from the backend
  const { data: mine } = useQuery({ ...myBillingQuery, enabled: Boolean(sameRole) })

  const features = Object.keys(plan.freeLimits) as PlanFeature[]
  
  // Notice we now pass `interval` to the price calculator
  const price = planPrice(plan, interval, t)
  const isPro = sameRole && mine?.plan === 'pro'

  async function upgrade() {
    setBusy(true)
    try {
      // Pass the plan role so the backend knows which Polar product to checkout
      const url = await startCheckout(plan.role)
      window.location.assign(url)
    } catch (error) {
      toast.error(getApiError(error).message)
      setBusy(false)
    }
  }

  const button =
    'inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold transition'

  let action: React.ReactNode
  if (!plan.enabled) {
    action = (
      <p className="rounded-md bg-gray-50 px-4 py-3 text-center text-sm text-gray-500">
        {t('billing.comingSoonNote')}
      </p>
    )
  } else if (!user) {
    action = (
      <Link to="/register" className={`${button} bg-brand text-on-brand hover:bg-brand-hover`}>
        {t('billing.signUpToUpgrade')}
      </Link>
    )
  } else if (!sameRole) {
    action = (
      <p className="rounded-md bg-gray-50 px-4 py-3 text-center text-sm text-gray-500">
        {t('billing.forRole', { role: t(`billing.roleName.${plan.role}`) })}
      </p>
    )
  } else if (isPro) {
    action = (
      <Link
        to="/dashboard/billing"
        className={`${button} bg-gray-100 text-gray-800 hover:bg-gray-200`}
      >
        <FontAwesomeIcon icon={faCrown} /> {t('billing.currentPlan')}
      </Link>
    )
  } else {
    action = (
      <button
        type="button"
        onClick={upgrade}
        disabled={busy}
        className={`${button} bg-brand text-on-brand hover:bg-brand-hover disabled:opacity-60`}
      >
        <FontAwesomeIcon icon={faCrown} />{' '}
        {busy ? t('billing.redirecting') : t('billing.upgrade')}
      </button>
    )
  }

  return (
    <article
      className={`relative flex flex-col rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200/70 md:p-7 ${
        recommended ? 'ring-2 ring-brand' : ''
      }`}
    >
      {recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-brand">
          {t('billing.recommended')}
        </span>
      )}

      {/* Header: role icon + name */}
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
          <FontAwesomeIcon icon={ROLE_ICONS[plan.role]} />
        </span>
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-900">
          {t(`billing.roles.${plan.role}`)}
        </h2>
      </div>

      {/* Price block (Pro) - It will now dynamically update! */}
      <div className="mt-5 text-center">
        {price ? (
          <p className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-extrabold tracking-tight text-gray-900">
              {price.amount}
            </span>
            <span className="text-xs font-medium text-gray-500">{price.per}</span>
          </p>
        ) : (
          <p className="text-sm text-gray-500">{t('billing.comingSoon')}</p>
        )}
      </div>

      {/* Features List */}
      <div className="mt-8 flex-1">
        <ul className="space-y-3">
          {features.map((feature) => (
            <FeatureRow key={feature} muted={false}>
              {plan.enabled
                ? t(`billing.unlimited.${feature}`)
                : t(`billing.limit.${feature}`, { count: plan.freeLimits[feature] })}
            </FeatureRow>
          ))}
          <FeatureRow>{t('billing.proExtra')}</FeatureRow>
        </ul>
      </div>

      <div className="mt-8">{action}</div>
    </article>
  )
}

function PricingPage() {
  const { t, i18n } = useTranslation()
  
  // Real query: Fetches plans from your backend
  const { data: plans, isLoading, isError } = useQuery(plansQuery)

  // This state controls the toggle!
  const [interval, setInterval] = useState<BillingInterval>('month')

  const recommendedIndex = useMemo(
    () => (plans && plans.length === 3 ? 1 : -1),
    [plans],
  )

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
    <div className="space-y-10 pb-20">
      <header className="mx-auto max-w-2xl pt-10 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          {t('billing.pricingTitle')}
        </h1>
        <p className="mt-3 text-sm text-gray-500">{t('billing.pricingSubtitle')}</p>

        {/* Monthly / Annually toggle */}
        <div className="mt-6 inline-flex rounded-md bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setInterval('month')}
            className={`rounded px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              interval === 'month'
                ? 'bg-brand text-on-brand shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('billing.monthly')}
          </button>
          <button
            type="button"
            onClick={() => setInterval('year')}
            className={`rounded px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              interval === 'year'
                ? 'bg-brand text-on-brand shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('billing.annually')}
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-96 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : isError || !plans ? (
        <p className="text-center text-gray-500">{t('site.somethingWrong')}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3 pt-6">
          {plans.map((plan, i) => (
            <PlanCard
              key={plan.role}
              plan={plan}
              interval={interval}
              recommended={i === recommendedIndex}
            />
          ))}
        </div>
      )}

      <div className="mx-auto max-w-2xl space-y-2 text-center text-sm text-gray-500 pt-8">
        <p>{t('billing.alwaysFree')}</p>
        <p className="flex items-center justify-center gap-2">
          <FontAwesomeIcon icon={faLock} /> {t('billing.securePayments')}
        </p>
      </div>
    </div>
  )
}

export default PricingPage