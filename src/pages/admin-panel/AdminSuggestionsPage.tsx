import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowsRotate,
  faCircleExclamation,
  faClock,
  faPlus,
  faSpinner,
  faTimes,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import {
  approveSuggestions,
  dismissSuggestion,
  listSuggestions,
  refreshSuggestions,
  tickSuggestions,
  updateSuggestionSetting,
  getSuggestionDetail,
} from '../../api/suggestions'
import DataState from '../../components/admin-panel/DataState'
import PageHeader from '../../components/admin-panel/PageHeader'
import Switch from '../../components/Switch'
import type { SuggestionsData, InfluencerSuggestion } from '../../types/suggestion'
import { getApiError } from '../../utils/apiError'
import { useAuth } from '../../hooks/useAuth'
import { Photo } from '../../components/home/HomeSections'
import SuggestionStats from '../../components/admin-panel/SuggestionStats'
import { CATEGORY_LABEL } from './suggestionCategories'
import { Link } from 'react-router-dom'

const QUERY_KEY = ['admin', 'suggestions']


function CategoryBadge({ category }: { category?: string }) {
  if (!category || !CATEGORY_LABEL[category]) return null
  return (
    <span className="inline-block rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
      {CATEGORY_LABEL[category]}
    </span>
  )
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return 'N/A'
  }
}

function useIntervalLabel(seconds: number = 86400) {
  const { t } = useTranslation()
  if (seconds % 86400 === 0) return t('suggestions.every.day', { count: seconds / 86400 })
  if (seconds % 3600 === 0) return t('suggestions.every.hour', { count: seconds / 3600 })
  if (seconds % 60 === 0) return t('suggestions.every.minute', { count: seconds / 60 })
  return t('suggestions.every.second', { count: seconds })
}

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

// ✅ Profile Detail Modal (Suggestion par click karne se khulta hai)
function SuggestionDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: suggestion, isLoading } = useQuery({
    queryKey: ['suggestion-detail', id],
    queryFn: () => getSuggestionDetail(id),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute end-4 top-4 z-10 rounded-full bg-white/80 p-2 text-gray-500 hover:bg-gray-100"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {isLoading ? (
          <div className="p-10 text-center text-gray-500">Loading...</div>
        ) : suggestion ? (
          <div className="overflow-y-auto">
            <div className="h-32 w-full bg-gradient-to-r from-brand to-brand-violet" />
            <div className="px-6 pb-6">
              <div className="relative -mt-16 mb-4 mx-auto h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white shadow-md">
                <Photo
                  person={{ name: suggestion.name, photoUrl: suggestion.photoUrl }}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold">{suggestion.name}</h2>
                <div className="mt-1">
                  <CategoryBadge category={suggestion.category} />
                </div>
                <p className="text-gray-500">{suggestion.headline}</p>
                <p className="mt-2 text-sm text-gray-600">{suggestion.reason}</p>
              </div>

              <div className="mt-6 flex justify-center gap-6 rounded-2xl bg-gray-50 p-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-brand">
                    {suggestion.followerCount?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500">Total Followers</div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Social Accounts</h3>
                <div className="space-y-2">
                  {suggestion.socials.map((social) => (
                    <a
                      key={social.url}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-xl border border-gray-100 p-3 hover:bg-gray-50"
                    >
                      <span className="font-medium capitalize">{social.platform}</span>
                      <span className="text-sm text-gray-500">@{social.handle}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center text-red-500">Suggestion not found.</div>
        )}
      </div>
    </div>
  )
}

// Suggestion Card (Clickable)
function SuggestionCard({
  suggestion,
  selected,
  onToggle,
  isBusy,
  onAdd,
  onDismiss,
  onClick,
}: {
  suggestion: InfluencerSuggestion
  selected: boolean
  onToggle: () => void
  isBusy: boolean
  onAdd: () => void
  onDismiss: () => void
  onClick: () => void
}) {
  return (
    <div
      className={`relative cursor-pointer rounded-xl border p-4 transition hover:shadow-md ${
        selected ? 'border-brand bg-brand/5 ring-1 ring-brand' : 'border-gray-200 bg-white'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-brand">{suggestion?.name || 'Unknown'}</h3>
          <p className="line-clamp-2 text-sm text-gray-500">{suggestion?.headline || 'No headline'}</p>
          <div className="mt-1">
            <CategoryBadge category={suggestion?.category} />
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" checked={selected} onChange={onToggle} className="mt-1 cursor-pointer" />
        </div>
      </div>
      <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onAdd}
          disabled={isBusy}
          className="rounded-lg bg-brand px-3 py-1 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
        >
          Add
        </button>
        <button
          onClick={onDismiss}
          disabled={isBusy}
          className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

function GroupSection({
  group,
  index,
  busyIds,
  onAdd,
  onDismiss,
  onView,
}: {
  group: any
  index: number
  busyIds: string[]
  onAdd: (ids: string[]) => void
  onDismiss: (id: string) => void
  onView: (id: string) => void
}) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string[]>([])
  const suggestions = group?.suggestions ?? []
  const pending = suggestions.filter((s: any) => s.status === 'pending')
  const chosen = selected.filter((id) => pending.some((s: any) => s._id === id))
  const allChosen = pending.length > 0 && chosen.length === pending.length
  const busy = chosen.some((id) => busyIds.includes(id))

  const toggle = (id: string) =>
    setSelected((list) => (list.includes(id) ? list.filter((i) => i !== id) : [...list, id]))

  return (
    <section className="space-y-4 rounded-3xl border border-gray-200 bg-gray-50/60 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">
            {index === 0 ? t('suggestions.latestGroup') : t('suggestions.group')}
            <span className="ms-2 text-sm font-normal text-gray-500">
              {formatDate(group?.generatedAt)}
            </span>
          </h2>
          <p className="text-xs text-gray-500">
            {t('suggestions.groupMeta', {
              total: suggestions.length,
              national: suggestions.filter((s: any) => s.scope === 'national').length,
              international: suggestions.filter((s: any) => s.scope === 'international').length,
              added: suggestions.filter((s: any) => s.status === 'approved').length,
            })}
          </p>
        </div>
        {pending.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(allChosen ? [] : pending.map((s: any) => s._id))}
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
        {suggestions.map((suggestion: any) => (
          <SuggestionCard
            key={suggestion._id}
            suggestion={suggestion}
            selected={chosen.includes(suggestion._id)}
            onToggle={() => toggle(suggestion._id)}
            isBusy={busyIds.includes(suggestion._id)}
            onAdd={() => onAdd([suggestion._id])}
            onDismiss={() => onDismiss(suggestion._id)}
            onClick={() => onView(suggestion._id)}
          />
        ))}
      </div>
    </section>
  )
}

function AdminSuggestionsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const userCountry = (user as any)?.country || 'PK'
  
  const queryClient = useQueryClient()
  const [now, setNow] = useState(() => Date.now())
  const [viewSuggestionId, setViewSuggestionId] = useState<string | null>(null)

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: listSuggestions,
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  })

  const data = query.data

  const missingKeys = data?.missingKeys ?? []
  const groups = data?.groups ?? []
  const intervalSeconds = data?.intervalSeconds ?? 86400
  const enabled = data?.enabled ?? false
  const lastError = data?.lastError ?? null
  const generating = Boolean(data?.generating)
  const nextGenerationAt = data?.nextGenerationAt ?? null

  const tick = useMutation({
    mutationFn: () => tickSuggestions(userCountry),
    onSuccess: (fresh) => {
      queryClient.setQueryData(QUERY_KEY, fresh)
      if (fresh.result?.status === 'generated') toast.success(t('suggestions.newGroup'))
    },
  })

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const dueAt = nextGenerationAt ? new Date(nextGenerationAt).getTime() : null
  const due = Boolean(
    enabled && !generating && dueAt !== null && dueAt <= now && missingKeys.length === 0,
  )

  useEffect(() => {
    if (due && !tick.isPending && !query.isFetching) {
      tick.mutate()
    }
  }, [due, tick.isPending, query.isFetching, tick])

  const setting = useMutation({
    mutationFn: updateSuggestionSetting,
    onSuccess: (enabled) => {
      queryClient.setQueryData(QUERY_KEY, (old: SuggestionsData | undefined) =>
        old ? { ...old, enabled } : old,
      )
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success(enabled ? t('suggestions.enabledToast') : t('suggestions.disabledToast'))
    },
    onError: (error) => toast.error(getApiError(error).message),
  })

  const refresh = useMutation({
    mutationFn: () => refreshSuggestions(userCountry),
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
    mutationFn: (ids: string[]) => approveSuggestions(ids),
    onSuccess: ({ results, added }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      if (added > 0) toast.success(t('suggestions.addedToast', { count: added }))
      for (const failed of results?.filter((r) => !r.ok) ?? []) {
        toast.error(
          failed.code === 'DUPLICATE'
            ? t('suggestions.duplicate')
            : (failed.error ?? t('suggestions.addFailed')),
        )
      }
    },
    onError: (error) => toast.error(getApiError(error).message),
  })

  const dismiss = useMutation({
    mutationFn: dismissSuggestion,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: (error) => toast.error(getApiError(error).message),
  })

  const intervalLabel = useIntervalLabel(intervalSeconds)
  const nextLabel = useRelative(nextGenerationAt, now)
  const isGenerating = Boolean(generating || tick.isPending || refresh.isPending)
  const busyIds = add.isPending ? (add.variables ?? []) : []

  return (
    <>
      <PageHeader title={t('suggestions.title')} subtitle={t('suggestions.subtitle')}>
        <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
          <span className="text-sm font-medium">{t('suggestions.autoGenerate')}</span>
          {/* ✅ ON/OFF Switch */}
          <Switch
            checked={enabled}
            disabled={setting.isPending || query.isLoading}
            onChange={(val) => setting.mutate(val)}
            label={t('suggestions.toggle')}
            size="sm"
          />
        </div>
      </PageHeader>

      <SuggestionStats />

      {data && (
        <div className="mb-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-600">
              <span>
                <FontAwesomeIcon icon={faClock} className="me-1.5 text-gray-400" />
                {t('suggestions.schedule', { interval: intervalLabel })}
              </span>
              {isGenerating ? (
                <span className="font-medium text-brand">
                  <FontAwesomeIcon icon={faSpinner} spin className="me-1.5" />
                  {t('suggestions.generating')}
                </span>
              ) : enabled && nextLabel ? (
                <span>{t('suggestions.nextGroup', { when: nextLabel })}</span>
              ) : (
                !enabled && <span>{t('suggestions.paused')}</span>
              )}
            </p>
            <button
              type="button"
              onClick={() => refresh.mutate()}
              disabled={isGenerating || missingKeys.length > 0}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faArrowsRotate} spin={refresh.isPending} />
              {t('suggestions.refresh')}
            </button>
          </div>

          {missingKeys.length > 0 && (
            <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5" />
              <span>
                No search API key is set ({missingKeys.join(', ')}).{' '}
                <Link to="/admin/settings" className="font-semibold underline">
                  Add one in API settings
                </Link>
              </span>
            </p>
          )}
          {lastError && missingKeys.length === 0 && !isGenerating && (
            <p className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5" />
              <span>
                {t('suggestions.lastError')} {lastError}{' '}
                {/limit|credit|quota|432|429/i.test(lastError) && (
                  <Link to="/admin/settings" className="font-semibold underline">
                    Check API settings
                  </Link>
                )}
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
        emptyTitle={isGenerating ? t('suggestions.generating') : t('suggestions.emptyTitle')}
        emptyText={t('suggestions.emptyText')}
        onRetry={() => query.refetch()}
      >
        <div className="space-y-6">
          {groups.map((group: any, index: number) => (
            <GroupSection
              key={group?.batchId ?? index}
              group={group}
              index={index}
              busyIds={busyIds}
              onAdd={(ids: string[]) => add.mutate(ids)}
              onDismiss={(id: string) => dismiss.mutate(id)}
              onView={(id: string) => setViewSuggestionId(id)}
            />
          ))}
        </div>
      </DataState>

      {viewSuggestionId && (
        <SuggestionDetailModal
          id={viewSuggestionId}
          onClose={() => setViewSuggestionId(null)}
        />
      )}
    </>
  )
}

export default AdminSuggestionsPage