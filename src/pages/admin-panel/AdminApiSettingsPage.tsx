import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getApiSettings,
  removeApiKey,
  saveApiConfig,
  saveApiKey,
  testApiKey,
  type ApiConfig,
  type ApiKeyInfo,
  type ApiSettingsData,
  type SearchId,
} from '../../api/apiSettings'
import DataState from '../../components/admin-panel/DataState'
import PageHeader from '../../components/admin-panel/PageHeader'
import { getApiError } from '../../utils/apiError'

const QUERY_KEY = ['admin', 'api-settings']
const TAVILY_FREE_CREDITS = 1000

const GROUPS: { id: ApiKeyInfo['group']; title: string; text: string }[] = [
  { id: 'search', title: 'Search: finds the people', text: 'One is enough. Add more as backups: when one hits its limit, the next one is used automatically.' },
  { id: 'llm', title: 'AI: reads the search results', text: 'Optional. Without it the app guesses names with a simple rule (less accurate). Anthropic is paid and the most accurate; Groq has a free tier.' },
  { id: 'data', title: 'Follower data', text: 'Exact YouTube subscribers, channel names and photos.' },
]

const TIER_LABEL: Record<ApiKeyInfo['tier'], { text: string; className: string }> = {
  free: { text: 'Free', className: 'bg-emerald-50 text-emerald-700' },
  'free-tier': { text: 'Free tier', className: 'bg-emerald-50 text-emerald-700' },
  paid: { text: 'Paid', className: 'bg-amber-50 text-amber-700' },
}

function KeyCard({ item }: { item: ApiKeyInfo }) {
  const queryClient = useQueryClient()
  const [value, setValue] = useState('')
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [now] = useState(() => Date.now())

  const update = (fresh: ApiSettingsData) => queryClient.setQueryData(QUERY_KEY, fresh)

  const save = useMutation({
    mutationFn: () => saveApiKey(item.id, value),
    onSuccess: (fresh) => {
      update(fresh)
      setValue('')
      setTestResult(null)
      toast.success(`${item.label} key saved`)
    },
    onError: (error) => toast.error(getApiError(error).message),
  })
  const remove = useMutation({
    mutationFn: () => removeApiKey(item.id),
    onSuccess: (fresh) => {
      update(fresh)
      setTestResult(null)
      toast.success(`${item.label} key removed`)
    },
    onError: (error) => toast.error(getApiError(error).message),
  })
  const test = useMutation({
    mutationFn: () => testApiKey(item.id),
    onSuccess: setTestResult,
    onError: (error) => setTestResult({ ok: false, message: getApiError(error).message }),
  })

  const tier = TIER_LABEL[item.tier]
  const usage = item.usage
  const atLimit = usage.quotaHits30 > 0 && usage.lastErrorAt !== null && now - new Date(usage.lastErrorAt).getTime() < 24 * 3600 * 1000
  const credits = item.id === 'tavily' ? ` · ${usage.month} of ${TAVILY_FREE_CREDITS} free credits used this month` : ''

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{item.label}</h3>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tier.className}`}>{tier.text}</span>
        {item.configured ? (
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
            Connected · {item.source === 'dashboard' ? 'saved here' : 'from server settings'}
          </span>
        ) : (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">Not set</span>
        )}
        {atLimit && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">Hit its limit</span>}
      </div>
      <p className="mt-1 text-sm text-gray-600">{item.purpose}</p>
      <p className="text-xs text-gray-500">
        {item.note}{' '}
        <a href={item.docsUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand underline">
          Get a key
        </a>
      </p>

      {item.configured && (
        <p className="mt-2 text-xs text-gray-500">
          <span className="font-mono">{item.masked}</span>
          {` · today ${usage.today} call${usage.today === 1 ? '' : 's'} · this month ${usage.monthCalls}${credits}`}
        </p>
      )}
      {usage.lastError && usage.errors30 + usage.quotaHits30 > 0 && (
        <p className="mt-1 line-clamp-2 text-xs text-red-600" title={usage.lastError}>
          Last problem: {usage.lastError}
        </p>
      )}

      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          if (value.trim()) save.mutate()
        }}
      >
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={item.configured ? 'Paste a new key to replace it' : 'Paste your key here'}
          className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!value.trim() || save.isPending}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
          >
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            disabled={!item.configured || test.isPending}
            onClick={() => test.mutate()}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {test.isPending ? 'Testing…' : 'Test'}
          </button>
          {item.source === 'dashboard' && (
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm(`Remove the saved ${item.label} key?`)) remove.mutate()
              }}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
      </form>
      {testResult && (
        <p className={`mt-2 text-sm ${testResult.ok ? 'text-emerald-700' : 'text-red-600'}`}>
          {testResult.ok ? '✓ ' : '✗ '}
          {testResult.message}
        </p>
      )}
    </div>
  )
}

const SEARCH_LABEL: Record<SearchId, string> = { tavily: 'Tavily', brave: 'Brave Search', serper: 'Serper' }

function ConfigCard({ config }: { config: ApiConfig }) {
  const queryClient = useQueryClient()
  const [order, setOrder] = useState<SearchId[]>(config.searchOrder)
  const [llm, setLlm] = useState(config.llmProvider)
  const [anthropicModel, setAnthropicModel] = useState(config.anthropicModel)
  const [groqModel, setGroqModel] = useState(config.groqModel)
  const [depth, setDepth] = useState(config.tavilyDepth)

  const save = useMutation({
    mutationFn: () => saveApiConfig({ searchOrder: order, llmProvider: llm, anthropicModel, groqModel, tavilyDepth: depth }),
    onSuccess: (fresh) => {
      queryClient.setQueryData(QUERY_KEY, fresh)
      toast.success('Settings saved')
    },
    onError: (error) => toast.error(getApiError(error).message),
  })

  const move = (index: number, by: -1 | 1) =>
    setOrder((list) => {
      const next = [...list]
      const target = index + by
      if (target < 0 || target >= next.length) return list
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })

  const field = 'w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand'
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <h3 className="font-semibold">How they are used</h3>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-medium">Search order</p>
          <p className="text-xs text-gray-500">The first one with a key is tried first. If it is out of credits, the next one is used.</p>
          <ol className="mt-2 space-y-1.5">
            {order.map((id, index) => (
              <li key={id} className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-1.5 text-sm">
                <span className="w-4 text-gray-400">{index + 1}</span>
                <span className="flex-1">{SEARCH_LABEL[id]}</span>
                <button type="button" aria-label={`Move ${SEARCH_LABEL[id]} up`} disabled={index === 0} onClick={() => move(index, -1)} className="px-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-30">
                  ↑
                </button>
                <button type="button" aria-label={`Move ${SEARCH_LABEL[id]} down`} disabled={index === order.length - 1} onClick={() => move(index, 1)} className="px-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-30">
                  ↓
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="font-medium">AI provider</span>
            <select value={llm} onChange={(event) => setLlm(event.target.value as ApiConfig['llmProvider'])} className={`${field} mt-1`}>
              <option value="auto">Automatic (Anthropic first, then Groq)</option>
              <option value="anthropic">Anthropic only (paid)</option>
              <option value="groq">Groq only (free tier)</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Tavily search depth</span>
            <select value={depth} onChange={(event) => setDepth(event.target.value as ApiConfig['tavilyDepth'])} className={`${field} mt-1`}>
              <option value="basic">Basic (1 credit, saves your free credits)</option>
              <option value="advanced">Advanced (2 credits, slightly richer)</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Anthropic model</span>
            <input value={anthropicModel} onChange={(event) => setAnthropicModel(event.target.value)} className={`${field} mt-1 font-mono`} />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Groq model</span>
            <input value={groqModel} onChange={(event) => setGroqModel(event.target.value)} className={`${field} mt-1 font-mono`} />
          </label>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          disabled={save.isPending}
          onClick={() => save.mutate()}
          className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  )
}

// Admin → API settings: keys yahin se lagti hain (database mein encrypt, poori key dobara kabhi nahi dikhti)
function AdminApiSettingsPage() {
  const query = useQuery({ queryKey: QUERY_KEY, queryFn: getApiSettings })
  const data = query.data

  return (
    <>
      <PageHeader title="API settings" subtitle="Keys used to find and verify people. Saved encrypted; a saved key is never shown again, only its last 4 characters." />

      <div className="mb-5 rounded-2xl bg-brand/5 p-4 text-sm text-gray-700 ring-1 ring-brand/20">
        <p className="font-semibold">Recommended setup</p>
        <ul className="mt-1 list-disc space-y-0.5 ps-5">
          <li>
            <span className="font-medium">Free:</span> Tavily + a second search key (Brave or Serper) as a backup, Groq for reading results, and the YouTube key.
          </li>
          <li>
            <span className="font-medium">Best accuracy:</span> add Anthropic (paid). With "Automatic", it is used first and Groq takes over if it fails.
          </li>
          <li>Tavily's free plan is 1,000 credits a month. Keep depth on Basic, and add a backup search key so a full quota never stops the daily suggestions.</li>
        </ul>
      </div>

      <DataState
        isLoading={query.isLoading}
        isError={query.isError && !data}
        error={query.error}
        isEmpty={false}
        emptyTitle=""
        emptyText=""
        onRetry={() => query.refetch()}
      >
        {data && (
          <div className="space-y-6">
            {GROUPS.map((group) => (
              <section key={group.id} className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold">{group.title}</h2>
                  <p className="text-xs text-gray-500">{group.text}</p>
                </div>
                <div className="grid gap-3 xl:grid-cols-2">
                  {data.keys
                    .filter((item) => item.group === group.id)
                    .map((item) => (
                      <KeyCard key={item.id} item={item} />
                    ))}
                </div>
              </section>
            ))}
            <ConfigCard key={JSON.stringify(data.config)} config={data.config} />
          </div>
        )}
      </DataState>
    </>
  )
}

export default AdminApiSettingsPage
