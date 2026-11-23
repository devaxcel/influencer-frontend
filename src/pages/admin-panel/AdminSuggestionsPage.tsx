import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowUpRightFromSquare,
  faArrowsRotate,
  faCircleCheck,
  faGlobe,
  faPlus,
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import { approveSuggestion, listSuggestions, refreshSuggestions, updateSuggestionSetting } from '../../api/suggestions'
import Avatar from '../../components/Avatar'
import DataState from '../../components/admin-panel/DataState'
import PageHeader from '../../components/admin-panel/PageHeader'
import Switch from '../../components/Switch'
import type { InfluencerSuggestion } from '../../types/suggestion'
import { countryName, formatCount } from '../../utils/format'
import { getApiError } from '../../utils/apiError'

function SuggestionCard({
  suggestion,
  isBusy,
  onAdd,
}: {
  suggestion: InfluencerSuggestion
  isBusy: boolean
  onAdd: () => void
}) {
  const { t } = useTranslation()
  const added = suggestion.status === 'approved'
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-4 p-5">
        <Avatar name={suggestion.name} photoUrl={suggestion.photoUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{suggestion.name}</h2>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              suggestion.scope === 'national'
                ? 'bg-green-50 text-green-700'
                : 'bg-blue-50 text-blue-700'
            }`}>
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
          <p className="mt-0.5 truncate text-sm font-semibold">{suggestion.profession}</p>
        </div>
        <div>
          <p className="text-gray-500">{t('suggestions.platform')}</p>
          <p className="mt-0.5 truncate text-sm font-semibold">{suggestion.socials[0]?.platform ?? t('suggestions.unknown')}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {suggestion.bio && <p className="line-clamp-3 text-sm text-gray-600">{suggestion.bio}</p>}
        <p className="mt-3 line-clamp-2 text-xs text-gray-500">{suggestion.reason}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestion.socials.map((social) => (
            <a
              key={`${social.platform}-${social.url}`}
              href={social.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand underline"
            >
              {social.platform}
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[9px]" />
            </a>
          ))}
          {suggestion.websiteUrl && (
            <a href={suggestion.websiteUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand underline">
              {t('suggestions.website')}
            </a>
          )}
        </div>
        <button
          type="button"
          disabled={isBusy || added}
          onClick={onAdd}
          className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
            added
              ? 'cursor-default bg-green-50 text-green-700'
              : 'bg-brand text-on-brand hover:bg-brand-hover disabled:opacity-50'
          }`}
        >
          <FontAwesomeIcon icon={added ? faCircleCheck : faPlus} />
          {added ? t('suggestions.added') : t('suggestions.add')}
        </button>
      </div>
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
    mutationFn: approveSuggestion,
    onSuccess: (approved) => {
      queryClient.setQueryData(['admin', 'suggestions'], (old: Awaited<ReturnType<typeof listSuggestions>> | undefined) =>
        old
          ? {
              ...old,
              suggestions: old.suggestions.map((item) =>
                item._id === approved._id ? { ...item, status: 'approved', personId: approved.personId } : item,
              ),
            }
          : old,
      )
      queryClient.invalidateQueries({ queryKey: ['admin', 'people'] })
      queryClient.invalidateQueries({ queryKey: ['people'] })
      toast.success(t('suggestions.addedToast'))
    },
    onError: (error) => toast.error(getApiError(error).message),
  })

  const suggestions = query.data?.suggestions ?? []
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
          <div className="grid gap-5 lg:grid-cols-2">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion._id}
                suggestion={suggestion}
                isBusy={add.isPending && add.variables === suggestion._id}
                onAdd={() => add.mutate(suggestion._id)}
              />
            ))}
          </div>
        </div>
      </DataState>
    </>
  )
}

export default AdminSuggestionsPage
