import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowUpRightFromSquare,
  faArrowsRotate,
  faGlobe,
  faChevronDown,
  faChevronUp,
  faPlus,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import { approveSuggestionGroup, listSuggestions, refreshSuggestions, updateSuggestionSetting } from '../../api/suggestions'
import Avatar from '../../components/Avatar'
import DataState from '../../components/admin-panel/DataState'
import PageHeader from '../../components/admin-panel/PageHeader'
import Switch from '../../components/Switch'
import type { InfluencerSuggestionGroup } from '../../types/suggestion'
import { countryName, formatCount } from '../../utils/format'
import { getApiError } from '../../utils/apiError'

function SuggestionGroupCard({
  group,
  isBusy,
  onApprove,
}: {
  group: InfluencerSuggestionGroup
  isBusy: boolean
  onApprove: (ids?: string[]) => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const addable = group.suggestions.filter((item) => item.status !== 'approved')

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full items-center gap-4 p-5 text-start"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-lg font-bold text-on-brand">
          {group.title.slice(-1)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{group.title}</span>
          <span className="mt-1 block text-sm text-gray-500">
            {t('suggestions.groupCount', { count: group.suggestions.length })}
          </span>
        </span>
        <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} className="text-gray-400" />
      </button>

      {open && (
        <div className="border-t border-gray-100">
          <div className="divide-y divide-gray-100">
            {group.suggestions.map((suggestion) => {
              const added = suggestion.status === 'approved'
              return (
                <div key={suggestion._id} className="p-5">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(suggestion._id)}
                      disabled={isBusy || added}
                      onChange={() => toggle(suggestion._id)}
                      className="mt-2 h-4 w-4 accent-brand"
                      aria-label={t('suggestions.select', { name: suggestion.name })}
                    />
                    <Avatar name={suggestion.name} photoUrl={suggestion.photoUrl} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{suggestion.name}</h3>
                        {added && (
                          <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                            {t('suggestions.added')}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{suggestion.headline}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        <FontAwesomeIcon icon={faGlobe} className="me-1" />
                        {countryName(suggestion.country)}
                        {suggestion.username && ` · @${suggestion.username.replace(/^@/, '')}`}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                        <p><span className="text-gray-500">{t('suggestions.followers')}: </span><strong>{suggestion.followerCount === undefined ? t('suggestions.unknown') : formatCount(suggestion.followerCount)}</strong></p>
                        <p><span className="text-gray-500">{t('suggestions.platform')}: </span><strong>{suggestion.socials[0]?.platform ?? t('suggestions.unknown')}</strong></p>
                        <p><span className="text-gray-500">{t('suggestions.category')}: </span><strong>{suggestion.profession}</strong></p>
                      </div>
                      {suggestion.bio && <p className="mt-3 line-clamp-3 text-sm text-gray-600">{suggestion.bio}</p>}
                      <p className="mt-2 text-xs text-gray-500">{suggestion.reason}</p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        {suggestion.socials.map((social) => (
                          <a key={`${social.platform}-${social.url}`} href={social.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-brand underline">
                            {social.platform}
                            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[9px]" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-gray-100 bg-gray-50 p-4">
            <button type="button" disabled={isBusy || selected.size === 0} onClick={() => onApprove([...selected])} className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-on-brand disabled:opacity-50">
              {t('suggestions.addSelected', { count: selected.size })}
            </button>
            <button type="button" disabled={isBusy || addable.length === 0} onClick={() => onApprove()} className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50">
              <FontAwesomeIcon icon={faPlus} className="me-1.5" />
              {t('suggestions.addAll')}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}


function AdminSuggestionsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['admin', 'suggestions'],
    queryFn: listSuggestions,
    refetchInterval: (query) => {
      const data = query.state.data
      return data?.enabled && data.intervalSeconds ? data.intervalSeconds * 1000 : false
    },
  })

  const setting = useMutation({
    mutationFn: updateSuggestionSetting,
    onSuccess: (enabled) => {
      queryClient.setQueryData(['admin', 'suggestions'], (old: Awaited<ReturnType<typeof listSuggestions>> | undefined) =>
        old ? { ...old, enabled } : old,
      )
      toast.success(enabled ? t('suggestions.enabledToast') : t('suggestions.disabledToast'))
    },
    onError: (error) => toast.error(getApiError(error).message),
  })

  const refresh = useMutation({
    mutationFn: refreshSuggestions,
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'suggestions'], data)
      toast.success(t('suggestions.refreshed'))
    },
    onError: (error) => toast.error(getApiError(error).message),
  })

  const add = useMutation({
    mutationFn: ({ groupId, ids }: { groupId: string; ids?: string[] }) =>
      approveSuggestionGroup(groupId, ids),
    onSuccess: (result) => {
      const approvedIds = new Set(result.approved.map((entry) => entry.suggestion._id))
      queryClient.setQueryData(['admin', 'suggestions'], (old: Awaited<ReturnType<typeof listSuggestions>> | undefined) => {
        if (!old) return old
        const suggestions = old.suggestions.map((item) =>
          approvedIds.has(item._id) ? { ...item, status: 'approved' as const } : item,
        )
        return {
          ...old,
          suggestions,
          groups: old.groups.map((group) => ({
            ...group,
            suggestions: group.suggestions.map((item) =>
              approvedIds.has(item._id) ? { ...item, status: 'approved' as const } : item,
            ),
          })),
        }
      })
      queryClient.invalidateQueries({ queryKey: ['admin', 'people'] })
      queryClient.invalidateQueries({ queryKey: ['people'] })
      if (result.failed.length > 0) {
        toast.error(`${result.failed.length} ${t('suggestions.addFailed')}`)
      } else {
        toast.success(t('suggestions.addedToast'))
      }
    },
    onError: (error) => toast.error(getApiError(error).message),
  })

  const suggestions = query.data?.suggestions ?? []
  const groups = query.data?.groups ?? []
  return (
    <>
      <PageHeader title={t('suggestions.title')} subtitle={t('suggestions.subtitle')}>
        <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
          <span className="text-sm font-medium">{t('suggestions.autoGenerate')}</span>
          <Switch
            checked={query.data?.enabled ?? false}
            disabled={setting.isPending || query.isLoading}
            onChange={(enabled) => setting.mutate(enabled)}
            label={t('suggestions.toggle')}
            size="sm"
          />
        </div>
      </PageHeader>

      <DataState
        isLoading={query.isLoading}
        isError={query.isError && !query.data}
        error={query.error}
        isEmpty={!query.isLoading && suggestions.length === 0}
        emptyTitle={t('suggestions.emptyTitle')}
        emptyText={t('suggestions.emptyText')}
        onRetry={() => query.refetch()}
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500">{t('suggestions.count', { count: suggestions.length })}</p>
            <button
              type="button"
              onClick={() => refresh.mutate()}
              disabled={refresh.isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faArrowsRotate} spin={refresh.isPending} />
              {t('suggestions.refresh')}
            </button>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            {groups.map((group) => (
              <SuggestionGroupCard
                key={group.groupId}
                group={group}
                isBusy={add.isPending}
                onApprove={(ids) => add.mutate({ groupId: group.groupId, ids })}
              />
            ))}
          </div>
        </div>
      </DataState>
    </>
  )
}

export default AdminSuggestionsPage
