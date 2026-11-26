import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { fillPhotoBatch, getPhotoGaps, type FillResult } from '../../api/photos'
import { getApiError } from '../../utils/apiError'

const SOURCE_LABEL = { youtube: 'YouTube channel picture', wikimedia: 'Wikipedia (free licence)' } as const

// Admin: jin public profiles ki photo nahi hai ya toot gayi hai unhe free zaraye (YouTube channel, Wikipedia) se bharna.
// Server ek request mein kuch hi logon ko dhoondta hai, is liye ye batch dar batch chalta hai jab tak kaam khatam na ho
function FillPhotosCard() {
  const queryClient = useQueryClient()
  const gaps = useQuery({ queryKey: ['admin', 'photo-gaps'], queryFn: getPhotoGaps, staleTime: 30_000 })
  const [results, setResults] = useState<FillResult[]>([])
  const [running, setRunning] = useState(false)
  const stop = useRef(false)

  const run = useMutation({
    mutationFn: async (force: boolean) => {
      stop.current = false
      setResults([])
      setRunning(true)
      let all: FillResult[] = []
      // Har batch ke baad baqi pooch lo; kuch na mile (batch khali) to ruk jao
      for (let round = 0; round < 40 && !stop.current; round += 1) {
        const batch = await fillPhotoBatch({ limit: 6, force: force && round === 0 })
        all = [...all, ...batch.results]
        setResults(all)
        if (batch.results.length === 0 || batch.remaining === 0) break
      }
      return all
    },
    onSuccess: (all) => {
      const filled = all.filter((r) => r.status === 'filled').length
      toast.success(`${filled} photo${filled === 1 ? '' : 's'} added`)
    },
    onError: (error) => toast.error(getApiError(error).message),
    onSettled: () => {
      setRunning(false)
      queryClient.invalidateQueries({ queryKey: ['admin', 'photo-gaps'] })
      queryClient.invalidateQueries({ queryKey: ['people'] })
    },
  })

  const data = gaps.data
  if (gaps.isError || !data) return null
  const total = data.missing + data.broken
  const filled = results.filter((r) => r.status === 'filled')
  const notFound = results.filter((r) => r.status === 'none')

  return (
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Profile photos</h2>
          <p className="mt-1 text-sm text-gray-600">
            {total === 0
              ? 'Every public profile has a photo.'
              : `${data.missing} public profile${data.missing === 1 ? ' has' : 's have'} no photo${data.broken ? ` and ${data.broken} ${data.broken === 1 ? 'has' : 'have'} a broken one` : ''}.`}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Free sources only: the YouTube channel picture, then the Wikipedia photo when it has a free licence (credit is shown on the profile). Instagram, TikTok, X and Facebook pictures are never used. Profiles claimed by their talent are skipped.
            {data.searchedNoResult > 0 && ` ${data.searchedNoResult} were searched recently with no result (tried again after 30 days).`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={running || data.pending === 0}
            onClick={() => run.mutate(false)}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
          >
            {running ? `Working… ${results.length} checked` : `Fill missing photos (${data.pending})`}
          </button>
          {running ? (
            <button type="button" onClick={() => (stop.current = true)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
              Stop
            </button>
          ) : (
            data.searchedNoResult > 0 && (
              <button type="button" onClick={() => run.mutate(true)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
                Search again
              </button>
            )
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="font-medium text-emerald-700">Added ({filled.length})</p>
            <ul className="mt-1 space-y-1">
              {filled.map((r) => (
                <li key={r.slug}>
                  <Link to={`/people/${r.slug}`} className="font-medium underline" target="_blank">
                    {r.name}
                  </Link>{' '}
                  <span className="text-xs text-gray-500">
                    {r.source ? SOURCE_LABEL[r.source] : ''}
                    {r.source === 'wikimedia' && r.pageUrl && (
                      <>
                        {' · '}
                        <a href={r.pageUrl} target="_blank" rel="noopener noreferrer" className="underline">
                          check the article
                        </a>
                      </>
                    )}
                  </span>
                </li>
              ))}
              {filled.length === 0 && <li className="text-gray-500">None yet.</li>}
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-700">No free photo found ({notFound.length})</p>
            <p className="text-xs text-gray-500">Upload one from Edit profile, or the talent can add it after claiming the profile.</p>
            <ul className="mt-1 space-y-0.5 text-gray-600">
              {notFound.map((r) => (
                <li key={r.slug}>{r.name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}

export default FillPhotosCard
