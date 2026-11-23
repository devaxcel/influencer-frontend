import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowUpRightFromSquare,
  faCircleCheck,
  faCircleExclamation,
  faCrown,
  faFlask,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons'
import { getMyBilling, myBillingQuery, openBillingPortal, startCheckout } from '../../api/billing'
import { getApiError } from '../../utils/apiError'
import { formatDate } from '../../utils/adminFormat'
import { money } from '../../utils/price'

const box = 'rounded-2xl bg-white p-5 shadow-sm md:p-6'

// /dashboard/billing: mera plan, is mahine ka istemal, Upgrade / Manage subscription.
// Polar checkout ke baad yahin wapas aate hain (?checkout_id=...)
function BillingPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const fromCheckout = params.has('checkout_id')
  const [activating, setActivating] = useState(fromCheckout)
  const [busy, setBusy] = useState(false)
  const { data, isLoading, isError } = useQuery(myBillingQuery)
  const started = useRef(false)

  // Checkout se wapas: webhook aane tak (ya Polar se sync) Pro ka intezar
  useEffect(() => {
    if (!fromCheckout || started.current) return
    started.current = true
    let cancelled = false
    ;(async () => {
      for (let i = 0; i < 8 && !cancelled; i++) {
        try {
          const fresh = await getMyBilling(true)
          queryClient.setQueryData(myBillingQuery.queryKey, fresh)
          if (fresh.plan === 'pro') {
            toast.success(t('billing.activated'))
            break
          }
        } catch {
          // agli dafa
        }
        if (i === 7) toast(t('billing.activateSlow'), { duration: 8000 })
        await new Promise((resolve) => setTimeout(resolve, 2500))
      }
      if (!cancelled) {
        setActivating(false)
        setParams({}, { replace: true })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [fromCheckout, queryClient, setParams, t])

  async function go(action: () => Promise<string>) {
    setBusy(true)
    try {
      window.location.assign(await action())
    } catch (error) {
      toast.error(getApiError(error).message)
      setBusy(false)
    }
  }

  if (isLoading) return <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
  if (isError || !data) return <p className="text-gray-500">{t('site.somethingWrong')}</p>

  const sub = data.subscription
  const isPro = data.plan === 'pro'
  const button = 'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('billing.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('billing.subtitle')}</p>
      </div>

      {activating && (
        <p className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <FontAwesomeIcon icon={faSpinner} spin /> {t('billing.activating')}
        </p>
      )}
      {data.enabled && data.sandbox && (
        <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <FontAwesomeIcon icon={faFlask} /> {t('billing.sandbox')}
        </p>
      )}
      {sub?.status === 'past_due' && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <FontAwesomeIcon icon={faCircleExclamation} /> {t('billing.pastDue')}
        </p>
      )}

      <section className={box}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              {isPro && <FontAwesomeIcon icon={faCrown} className="text-brand" />}
              {isPro ? t('billing.planPro') : t('billing.planFree')}
            </h2>
            {isPro && sub?.amount != null && sub.currency && (
              <p className="mt-1 text-sm text-gray-600">
                {money(sub.amount, sub.currency)} {sub.interval === 'year' ? t('billing.perYear') : t('billing.perMonth')}
              </p>
            )}
            {isPro && sub?.currentPeriodEnd && (
              <p className="mt-1 text-sm text-gray-500">
                {sub.cancelAtPeriodEnd
                  ? t('billing.endsOn', { date: formatDate(sub.currentPeriodEnd) })
                  : t('billing.renews', { date: formatDate(sub.currentPeriodEnd) })}
              </p>
            )}
            {!data.enabled && <p className="mt-1 text-sm text-gray-500">{t('billing.paymentsOff')}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {data.enabled && !isPro && (
              <button type="button" disabled={busy} onClick={() => go(startCheckout)} className={`${button} bg-brand text-on-brand hover:bg-brand-hover`}>
                <FontAwesomeIcon icon={faCrown} /> {busy ? t('billing.redirecting') : t('billing.upgrade')}
              </button>
            )}
            {sub && (
              <button type="button" disabled={busy} onClick={() => go(openBillingPortal)} className={`${button} bg-gray-100 text-gray-800 hover:bg-gray-200`}>
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} /> {t('billing.manage')}
              </button>
            )}
            <Link to="/pricing" className={`${button} text-gray-600 hover:bg-gray-100`}>
              {t('billing.seePlans')}
            </Link>
          </div>
        </div>
      </section>

      {data.usage.length > 0 && (
        <section className={box}>
          <h2 className="text-base font-semibold">{t('billing.usageTitle')}</h2>
          <ul className="mt-4 space-y-4">
            {data.usage.map(({ feature, used, limit }) => {
              const full = limit !== null && used >= limit
              const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 100
              return (
                <li key={feature}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-700">{t(`billing.usageLabel.${feature}`)}</span>
                    <span className={full ? 'font-semibold text-red-600' : 'text-gray-500'}>
                      {limit === null ? (
                        <>
                          <FontAwesomeIcon icon={faCircleCheck} className="text-green-600" />{' '}
                          {t('billing.usedUnlimited', { used })}
                        </>
                      ) : (
                        t('billing.usedOf', { used, limit })
                      )}
                    </span>
                  </div>
                  {limit !== null && (
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className={`h-full rounded-full ${full ? 'bg-red-500' : 'bg-brand'}`} style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}

export default BillingPage
