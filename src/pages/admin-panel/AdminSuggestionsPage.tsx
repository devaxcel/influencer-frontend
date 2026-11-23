import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowUpRightFromSquare,
  faArrowsRotate,
  faCircleCheck,
  faCircleExclamation,
  faClock,
  faGlobe,
  faPlus,
  faSpinner,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import {
  approveSuggestions,
  dismissSuggestion,
  listSuggestions,
  refreshSuggestions,
  tickSuggestions,
  updateSuggestionSetting,
} from '../../api/suggestions'
import Avatar from '../../components/Avatar'
import DataState from '../../components/admin-panel/DataState'
import PageHeader from '../../components/admin-panel/PageHeader'
import Switch from '../../components/Switch'
import { PLATFORM_ICONS, PLATFORM_LABELS } from '../../constants/people'
import type { InfluencerSuggestion, SuggestionGroup, SuggestionsData } from '../../types/suggestion'
import { formatDateTime } from '../../utils/adminFormat'
import { countryName, formatCount } from '../../utils/format'
import { getApiError } from '../../utils/apiError'

const QUERY_KEY = ['admin', 'suggestions']

// 3 -> "3 seconds", 86400 -> "1 day" (chuni hui zaban mein)
function useIntervalLabel(seconds: number) {
  const { t } = useTranslation()
  if (seconds % 86400 === 0) return t('suggestions.every.day', { count: seconds / 86400 })
  if (seconds % 3600 === 0) return t('suggestions.every.hour', { count: seconds / 3600 })
  if (seconds % 60 === 0) return t('suggestions.every.minute', { count: seconds / 60 })
  return t('suggestions.every.second', { count: seconds })
}

// "in 5 minutes" / "now"
function useRelative(target: string | null, now: number) {
  const { i18n, t } = useTranslation()
  if (!target) return null
  const diff = new Date(target).getTime() - now
  if (diff <= 1000) return t('suggestions.now')
  const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' })
  const s = Math.round(diff / 1000)
  if (s < 60) return rtf.format(s, 'second')
  if (s < 3600) return rtf.format(Math.round(s / 60), 'minute')
  if (s < 86400) return rtf.format(Math.round(s / 3600), 'hour')
  return rtf.format(Math.round(s / 86400), 'day')
}

function SuggestionCard({
  suggestion,
  selected,
  onToggle,
  isBusy,
  onAdd,
  onDismiss,
}: {
  suggestion: InfluencerSuggestion
  selected: boolean
  onToggle: () => void
  isBusy: boolean
  onAdd: () => void
  onDismiss: () => void
}) {
  const { t } = useTranslation()
  const added = suggestion.status === 'approved'
  const verified = suggestion.socials.filter((social) => typeof social.followers === 'number')
  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
        selected ? 'border-brand ring-2 ring-brand/30' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-4 p-5">
        {!added && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            aria-label={t('suggestions.select', { name: suggestion.name })}
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[var(--color-brand)]"
          />
        )}
        <Avatar name={suggestion.name} photoUrl={suggestion.photoUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{suggestion.name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                suggestion.scope === 'national' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
              }`}
            >
              {suggestion.scope === 'national' ? t('suggestions.national') : t('suggestions.international')}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">{suggestion.headline}</p>
          <p className="mt-2 text-xs text-gray-500">
            <FontAwesomeIcon icon={faGlobe} className="me-1" />
            {countryName(suggestion.country)}
            {suggestion.username && <span className="ms-3">@{suggestion.username.replace(/^@/, '')}</span>}
          </p>
        </div>
        {!added && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={t('suggestions.dismiss')}
            title={t('suggestions.dismiss')}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 bg-gray-50 px-5 py-3 text-xs sm:grid-cols-3">
        <div>
          <p className="text-gray-500">{t('suggestions.followers')}</p>
          <p className="mt-0.5 text-sm font-semibold">
            {suggestion.followerCount === undefined ? t('suggestions.unknown') : formatCount(suggestion.followerCount)}
          </p>
        </div>
        <div>
          <p className="text-gray-500">{t('suggestions.category')}</p>
          <p className="mt-0.5 truncate text-sm font-semibold">{suggestion.profession || '—'}</p>
        </div>
        <div>
          <p className="text-gray-500">{t('suggestions.platform')}</p>
          <p className="mt-0.5 truncate text-sm font-semibold">
            {suggestion.socials.length
              ? suggestion.socials.map((social) => PLATFORM_LABELS[social.platform] ?? social.platform).join(', ')
              : t('suggestions.unknown')}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {suggestion.bio && <p className="line-clamp-3 text-sm text-gray-600">{suggestion.bio}</p>}
        <p className="line-clamp-2 text-xs text-gray-500">{suggestion.reason}</p>
        <ul className="mt-4 space-y-1.5">
          {suggestion.socials.map((social) => (
            <li key={`${social.platform}-${social.url}`} className="flex items-center justify-between gap-3 text-sm">
              <a
                href={social.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-w-0 items-center gap-2 font-medium text-brand hover:underline"
              >
                {PLATFORM_ICONS[social.platform] && <FontAwesomeIcon icon={PLATFORM_ICONS[social.platform]} />}
                <span className="truncate">@{social.handle ?? social.url}</span>
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[9px]" />
              </a>
              {typeof social.followers === 'number' ? (
                <a
                  href={social.followersSourceUrl ?? social.url}
                  target="_blank"
                  rel="noreferrer"
                  title={t('suggestions.verifiedFrom')}
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-gray-700"
                >
                  <FontAwesomeIcon icon={faCircleCheck} className="text-green-600" />
                  {formatCount(social.followers)}
                </a>
              ) : (
                <span className="text-xs text-gray-400">{t('suggestions.unknown')}</span>
              )}
            </li>
          ))}
        </ul>
        {verified.length === 0 && <p className="mt-2 text-xs text-amber-700">{t('suggestions.legacyNote')}</p>}
        <button
          type="button"
          disabled={isBusy || added}
          onClick={onAdd}
          className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
            added ? 'cursor-default bg-green-50 text-green-700' : 'bg-brand text-on-brand hover:bg-brand-hover disabled:opacity-50'
          }`}
        >
          <FontAwesomeIcon icon={added ? faCircleCheck : isBusy ? faSpinner : faPlus} spin={isBusy && !added} />
          {added ? t('suggestions.added') : t('suggestions.add')}
        </button>
      </div>
    </article>
  )
}

function GroupSection({
  group,
  index,
  busyIds,
  onAdd,
  onDismiss,
}: {
  group: SuggestionGroup
  index: number
  busyIds: string[]
  onAdd: (ids: string[]) => void
  onDismiss: (id: string) => void
}) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string[]>([])
  const pending = group.suggestions.filter((s) => s.status === 'pending')
  const chosen = selected.filter((id) => pending.some((s) => s._id === id))
  const allChosen = pending.length > 0 && chosen.length === pending.length
  const busy = chosen.some((id) => busyIds.includes(id))
  const toggle = (id: string) =>
    setSelected((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]))

  return (
    <section className="space-y-4 rounded-3xl border border-gray-200 bg-gray-50/60 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">
            {index === 0 ? t('suggestions.latestGroup') : t('suggestions.group')}
            <span className="ms-2 text-sm font-normal text-gray-500">{formatDateTime(group.generatedAt)}</span>
          </h2>
          <p className="text-xs text-gray-500">
            {t('suggestions.groupMeta', {
              total: group.suggestions.length,
              national: group.suggestions.filter((s) => s.scope === 'national').length,
              international: group.suggestions.filter((s) => s.scope === 'international').length,
              added: group.suggestions.filter((s) => s.status === 'approved').length,
            })}
          </p>
        </div>
        {pending.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(allChosen ? [] : pending.map((s) => s._id))}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              {allChosen ? t('suggestions.clearSelection') : t('suggestions.selectAll')}
            </button>
            <button
              type="button"
              disabled={chosen.length === 0 || busy}
              onClick={() => {
                onAdd(chosen)
                setSelected([])
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
            >
              <FontAwesomeIcon icon={busy ? faSpinner : faPlus} spin={busy} />
              {t('suggestions.addSelected', { count: chosen.length })}
            </button>
          </div>
        )}
      </div>
      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {group.suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion._id}
            suggestion={suggestion}
            selected={chosen.includes(suggestion._id)}
            onToggle={() => toggle(suggestion._id)}
            isBusy={busyIds.includes(suggestion._id)}
            onAdd={() => onAdd([suggestion._id])}
            onDismiss={() => onDismiss(suggestion._id)}
          />
        ))}
      </div>
    </section>
  )
}

function AdminSuggestionsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [now, setNow] = useState(() => Date.now())
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: listSuggestions,
    // Naye groups (scheduler / cron / doosre admin) dekhne ke liye
    refetchInterval: (q) => {
      const data = q.state.data
      if (!data) return false
      return Math.min(30_000, Math.max(3_000, data.intervalSeconds * 1000))
    },
  })
  const data = query.data

  const tick = useMutation({
    mutationFn: tickSuggestions,
    onSuccess: (fresh) => {
      queryClient.setQueryData(QUERY_KEY, fresh)
      if (fresh.result?.status === 'generated') toast.success(t('suggestions.newGroup'))
    },
  })

  // Ghari: "agla group kab" chalta rahe, aur waqt aane pe backend se naya group mango.
  // (Vercel pe koi background timer nahi, is liye panel khula ho to yahi interval chalata hai)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const dueAt = data?.nextGenerationAt ? new Date(data.nextGenerationAt).getTime() : null
  const due = Boolean(data?.enabled && !data.generating && dueAt !== null && dueAt <= now && data.missingKeys.length === 0)
  useEffect(() => {
    if (due && !tick.isPending) tick.mutate()
    // tick.mutate stable hai; sirf "due" badalne pe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [due])

  const setting = useMutation({
    mutationFn: updateSuggestionSetting,
    onSuccess: (enabled) => {
      queryClient.setQueryData(QUERY_KEY, (old: SuggestionsData | undefined) => (old ? { ...old, enabled } : old))
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success(enabled ? t('suggestions.enabledToast') : t('suggestions.disabledToast'))
    },
    onError: (error) => toast.error(getApiError(error).message),
  })

  const refresh = useMutation({
    mutationFn: refreshSuggestions,
    onSuccess: (fresh) => {
      queryClient.setQueryData(QUERY_KEY, fresh)
      toast.success(t('suggestions.refreshed'))
    },
    onError: (error) => {
      toast.error(getApiError(error).message)
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  const add = useMutation({
    mutationFn: approveSuggestions,
    onSuccess: ({ results, added }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['admin', 'people'] })
      queryClient.invalidateQueries({ queryKey: ['people'] })
      if (added > 0) toast.success(t('suggestions.addedToast', { count: added }))
      for (const failed of results.filter((r) => !r.ok)) {
        toast.error(failed.code === 'DUPLICATE' ? t('suggestions.duplicate') : (failed.error ?? t('suggestions.addFailed')))
      }
    },
    onError: (error) => toast.error(getApiError(error).message),
  })

  const dismiss = useMutation({
    mutationFn: dismissSuggestion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: (error) => toast.error(getApiError(error).message),
  })

  const groups = data?.groups ?? []
  const intervalLabel = useIntervalLabel(data?.intervalSeconds ?? 86400)
  const nextLabel = useRelative(data?.nextGenerationAt ?? null, now)
  const generating = Boolean(data?.generating || tick.isPending || refresh.isPending)
  const busyIds = add.isPending ? (add.variables ?? []) : []

  return (
    <>
      <PageHeader title={t('suggestions.title')} subtitle={t('suggestions.subtitle')}>
        <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
          <span className="text-sm font-medium">{t('suggestions.autoGenerate')}</span>
          <Switch
            checked={data?.enabled ?? false}
            disabled={setting.isPending || query.isLoading}
            onChange={(enabled) => setting.mutate(enabled)}
            label={t('suggestions.toggle')}
            size="sm"
          />
        </div>
      </PageHeader>

      {data && (
        <div className="mb-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-600">
              <span>
                <FontAwesomeIcon icon={faClock} className="me-1.5 text-gray-400" />
                {t('suggestions.schedule', { interval: intervalLabel })}
              </span>
              {generating ? (
                <span className="font-medium text-brand">
                  <FontAwesomeIcon icon={faSpinner} spin className="me-1.5" />
                  {t('suggestions.generating')}
                </span>
              ) : data.enabled && nextLabel ? (
                <span>{t('suggestions.nextGroup', { when: nextLabel })}</span>
              ) : (
                !data.enabled && <span>{t('suggestions.paused')}</span>
              )}
            </p>
            <button
              type="button"
              onClick={() => refresh.mutate()}
              disabled={generating || data.missingKeys.length > 0}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faArrowsRotate} spin={refresh.isPending} />
              {t('suggestions.refresh')}
            </button>
          </div>
          {data.missingKeys.length > 0 && (
            <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5" />
              {t('suggestions.missingKeys', { keys: data.missingKeys.join(', ') })}
            </p>
          )}
          {data.lastError && data.missingKeys.length === 0 && !generating && (
            <p className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5" />
              <span>
                {t('suggestions.lastError')} {data.lastError}
              </span>
            </p>
          )}
        </div>
      )}

      <DataState
        isLoading={query.isLoading}
        isError={query.isError && !data}
        error={query.error}
        isEmpty={!query.isLoading && groups.length === 0}
        emptyTitle={generating ? t('suggestions.generating') : t('suggestions.emptyTitle')}
        emptyText={t('suggestions.emptyText')}
        onRetry={() => query.refetch()}
      >
        <div className="space-y-6">
          {groups.map((group, index) => (
            <GroupSection
              key={group.batchId}
              group={group}
              index={index}
              busyIds={busyIds}
              onAdd={(ids) => add.mutate(ids)}
              onDismiss={(id) => dismiss.mutate(id)}
            />
          ))}
        </div>
      </DataState>
    </>
  )
}

export default AdminSuggestionsPage
