import toast from 'react-hot-toast'
import i18n from '../i18n'

// Free plan ki hadd poori (402 PLAN_LIMIT): har jagah ek hi "Upgrade" wala toast.
// Toaster router ke bahar hai, is liye <a> (Link nahi)
export function showPlanLimitToast() {
  toast(
    (item) => (
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>{i18n.t('billing.limitToast')}</span>
        <a
          href="/pricing"
          onClick={() => toast.dismiss(item.id)}
          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-on-brand hover:bg-brand-hover"
        >
          {i18n.t('billing.seePlans')}
        </a>
      </span>
    ),
    { id: 'plan-limit', duration: 8000 },
  )
}
