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
import DataState from '../../components/admin-panel/DataState'
import PageHeader from '../../components/admin-panel/PageHeader'
import Switch from '../../components/Switch'
import type { SuggestionGroup, SuggestionsData } from '../../types/suggestion'
import { getApiError } from '../../utils/apiError'

const QUERY_KEY = ['admin', 'suggestions']

function formatDate(dateStr?: string) {
  if (!dateStr) return 'N/A'
  try { return new Date(dateStr).toLocaleString() } catch { return 'N/A' }
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

// SuggestionCard 
function SuggestionCard({ suggestion, selected, onToggle, isBusy, onAdd, onDismiss }: any) {
  return (
    <div className={`p-4 border rounded-xl ${selected ? 'border-brand ring-1 ring-brand' : 'border-gray-200'} bg-white`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{suggestion?.name || 'Unknown'}</h3>
          <p className="text-sm text-gray-500">{suggestion?.headline || 'No headline'}</p>
        </div>
        <input type="checkbox" checked={selected} onChange={onToggle} className="mt-1" />
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={onAdd} disabled={isBusy} className="px-3 py-1 bg-brand text-white rounded-lg text-sm">Add</button>
        <button onClick={onDismiss} disabled={isBusy} className="px-3 py-1 border border-gray-300 rounded-lg text-sm">Dismiss</button>
      </div>
    </div>
  )
}

function GroupSection({
  group, index, busyIds, onAdd, onDismiss,
}: {
  group: SuggestionGroup
  index: number
  busyIds: string[]
  onAdd: (ids: string[]) => void
  onDismiss: (id: string) => void
}) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string[]>([])
  
  const suggestions = group?.suggestions ?? []
  const pending = suggestions.filter((s) => s.status === 'pending')
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
            <span className="ms-2 text-sm font-normal text-gray-500">{formatDate(group?.generatedAt)}</span>
          </h2>
          <p className="text-xs text-gray-500">
            {t('suggestions.groupMeta', {
              total: suggestions.length,
              national: suggestions.filter((s) => s.scope === 'national').length,
              international: suggestions.filter((s) => s.scope === 'international').length,
              added: suggestions.filter((s) => s.status === 'approved').length,
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
        {suggestions.map((suggestion) => (
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
    // ✅ Refetch interval 30 minutes set kiya hai
    refetchInterval: 30 * 60 * 1000, 
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
    mutationFn: tickSuggestions,
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
  const due = Boolean(enabled && !generating && dueAt !== null && dueAt <= now && missingKeys.length === 0)
  
  useEffect(() => {
    // ✅ Faltu calls rokne ke liye check
    if (due && !tick.isPending && !query.isFetching) {
      tick.mutate()
    }
  }, [due, tick.isPending, query.isFetching, tick])

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
    mutationFn: (ids: string[]) => approveSuggestions(ids),
    onSuccess: ({ results, added }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      if (added > 0) toast.success(t('suggestions.addedToast', { count: added }))
      for (const failed of results?.filter((r) => !r.ok) ?? []) {
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

  const intervalLabel = useIntervalLabel(intervalSeconds)
  const nextLabel = useRelative(nextGenerationAt, now)
  const isGenerating = Boolean(generating || tick.isPending || refresh.isPending)
  const busyIds = add.isPending ? (add.variables ?? []) : []

  return (
    <>
      <PageHeader title={t('suggestions.title')} subtitle={t('suggestions.subtitle')}>
        <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
          <span className="text-sm font-medium">{t('suggestions.autoGenerate')}</span>
          <Switch
            checked={enabled}
            disabled={setting.isPending || query.isLoading}
            onChange={(val) => setting.mutate(val)}
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
              {t('suggestions.missingKeys', { keys: missingKeys.join(', ') })}
            </p>
          )}
          {lastError && missingKeys.length === 0 && !isGenerating && (
            <p className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <FontAwesomeIcon icon={faCircleExclamation} className="mt-0.5" />
              <span>
                {t('suggestions.lastError')} {lastError}
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
          {groups.map((group, index) => (
            <GroupSection
              key={group?.batchId ?? index}
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