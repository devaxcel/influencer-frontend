import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { addFoundAccount, findAccountsBatch, getMissingAccounts, type FoundForPerson, type Proposal } from '../../api/accountFinder'
import { formatCount } from '../../utils/format'
import { getApiError } from '../../utils/apiError'

const PLATFORM: Record<string, string> = { youtube: 'YouTube', instagram: 'Instagram', x: 'X', tiktok: 'TikTok', facebook: 'Facebook' }

// Admin: jin profiles pe koi social account nahi (jaise shuru ke seeded: Virat Kohli, Messi...) un ke asli accounts dhoondna.
// Dhoondne par kuch save nahi hota: aap link khol kar dekhte hain, sahi ho to "Add" (tab live followers dobara parakhe jate hain)
function FindAccountsCard() {
  const queryClient = useQueryClient()
  const counts = useQuery({ queryKey: ['admin', 'missing-accounts'], queryFn: getMissingAccounts, staleTime: 30_000 })
  const [results, setResults] = useState<FoundForPerson[]>([])
  const [added, setAdded] = useState<Record<string, number>>({}) // "personId:platform" -> followers
  const [busy, setBusy] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const stop = useRef(false)

  const find = useMutation({
    mutationFn: async (force: boolean) => {
      stop.current = false
      setRunning(true)
      let all: FoundForPerson[] = results
      for (let round = 0; round < 40 && !stop.current; round += 1) {
        const batch = await findAccountsBatch({ limit: 3, force: force && round === 0 })
        all = [...all, ...batch.results]
        setResults(all)
        if (batch.results.length === 0 || batch.remaining === 0) break
      }
      return all
    },
    onError: (error) => toast.error(getApiError(error).message),
    onSettled: () => {
      setRunning(false)
      queryClient.invalidateQueries({ queryKey: ['admin', 'missing-accounts'] })
    },
  })

  async function add(person: FoundForPerson, proposal: Proposal) {
    const key = `${person.personId}:${proposal.platform}`
    setBusy(key)
    try {
      const saved = await addFoundAccount(person.personId, proposal.platform, proposal.handle)
      setAdded((current) => ({ ...current, [key]: saved.followers }))
      toast.success(`${person.name}: ${PLATFORM[proposal.platform] ?? proposal.platform} added (${formatCount(saved.followers)})`)
      queryClient.invalidateQueries({ queryKey: ['people'] })
    } catch (error) {
      toast.error(getApiError(error).message)
    } finally {
      setBusy(null)
    }
  }

  const data = counts.data
  if (counts.isError || !data) return null
  const withProposals = results.filter((r) => r.proposals.length > 0)
  const empty = results.filter((r) => r.proposals.length === 0)

  return (
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Find missing social accounts</h2>
          <p className="mt-1 text-sm text-gray-600">
            {data.noAccounts === 0
              ? 'Every public profile has at least one social account.'
              : `${data.noAccounts} public profile${data.noAccounts === 1 ? ' has' : 's have'} no social account, so no followers.`}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            The search finds each person's official accounts and shows them here. Nothing is saved until you press Add. Open the link to check it is really them. It uses search credits. Profiles claimed by their talent are skipped.
            {data.searchedNoResult > 0 && ` ${data.searchedNoResult} were searched recently (tried again after 30 days).`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={running || data.pending === 0}
            onClick={() => find.mutate(false)}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
          >
            {running ? `Searching… ${results.length} done` : `Find accounts (${data.pending})`}
          </button>
          {running ? (
            <button type="button" onClick={() => (stop.current = true)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
              Stop
            </button>
          ) : (
            data.searchedNoResult > 0 && (
              <button type="button" onClick={() => find.mutate(true)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
                Search again
              </button>
            )
          )}
        </div>
      </div>

      {withProposals.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-100 text-sm">
          {withProposals.map((person) => (
            <li key={person.personId} className="py-3">
              <Link to={`/people/${person.slug}`} target="_blank" className="font-semibold underline">
                {person.name}
              </Link>
              <ul className="mt-2 space-y-1.5">
                {person.proposals.map((proposal) => {
                  const key = `${person.personId}:${proposal.platform}`
                  const done = added[key]
                  return (
                    <li key={key} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="w-20 text-gray-500">{PLATFORM[proposal.platform] ?? proposal.platform}</span>
                      <a href={proposal.url} target="_blank" rel="noopener noreferrer" className="font-medium underline">
                        @{proposal.handle}
                      </a>
                      <span className="text-gray-600">{formatCount(proposal.followers)} followers</span>
                      {done !== undefined ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Added · {formatCount(done)}</span>
                      ) : (
                        <button
                          type="button"
                          disabled={busy === key}
                          onClick={() => add(person, proposal)}
                          className="rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
                        >
                          {busy === key ? 'Checking…' : 'Add'}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {empty.length > 0 && (
        <p className="mt-4 text-sm text-gray-600">
          <span className="font-medium">No reliable account found ({empty.length}):</span> {empty.map((p) => p.name).join(', ')}. Add their links by hand in Edit profile.
        </p>
      )}
    </section>
  )
}

export default FindAccountsCard
