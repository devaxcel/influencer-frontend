import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSuggestionStats } from '../../api/suggestions'
import { CATEGORY_LABEL } from '../../pages/admin-panel/suggestionCategories'

const RANGES = [7, 14, 30] as const

function Card({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

const dayLabel = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })

// Admin: roz kitni AI suggestions bani, kitni approve aur dismiss hui (counter jis din se laga, uske baad ka poora hisaab;
// approve ki ginti puraane dinon ki bhi AI se bani profiles se aati hai)
function SuggestionStats() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(14)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'suggestions', 'stats', days],
    queryFn: () => getSuggestionStats(days),
    staleTime: 60 * 1000,
  })

  if (isLoading) return <p className="mb-5 text-sm text-gray-500">Loading stats…</p>
  if (isError || !data) return null

  const rows = [...data.days].reverse() // naya din upar
  const maxBar = Math.max(1, ...rows.map((row) => Math.max(row.generated, row.approved, row.dismissed)))
  // Approval rate sirf un dinon se jin ka generated ka hisaab hai (purane dinon ke approve ka generated record nahi)
  const trackedRows = data.days.filter((row) => row.tracked)
  const trackedGenerated = trackedRows.reduce((total, row) => total + row.generated, 0)
  const trackedApproved = trackedRows.reduce((total, row) => total + row.approved, 0)
  const approvalRate = trackedGenerated > 0 ? Math.round((trackedApproved / trackedGenerated) * 100) : null

  return (
    <section className="mb-6 space-y-4 rounded-3xl border border-gray-200 bg-gray-50/60 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Daily stats</h2>
          <p className="text-xs text-gray-500">
            {data.dailyTarget} suggestions are generated per scheduled run. Nothing is published until you approve it.
            {data.trackedSince ? ` Generated and dismissed counts start on ${dayLabel(data.trackedSince)}.` : ''}
          </p>
        </div>
        <div className="inline-flex overflow-hidden rounded-xl border border-gray-300 bg-white text-sm">
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDays(range)}
              className={`px-3 py-1.5 ${days === range ? 'bg-brand font-semibold text-on-brand' : 'hover:bg-gray-50'}`}
            >
              {range}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label="Generated" value={data.totals.generated} hint={`last ${days} days`} />
        <Card
          label="Approved"
          value={data.totals.approved}
          hint={approvalRate !== null ? `${approvalRate}% of generated since ${dayLabel(data.trackedSince ?? data.days[0].date)}` : `last ${days} days`}
        />
        <Card label="Dismissed" value={data.totals.dismissed} hint={`last ${days} days`} />
        <Card label="Pending now" value={data.totals.pending} hint="waiting for your decision" />
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-start text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-2.5 text-start font-medium">Day (UTC)</th>
              <th className="px-4 py-2.5 text-start font-medium">Generated</th>
              <th className="px-4 py-2.5 text-start font-medium">Approved</th>
              <th className="px-4 py-2.5 text-start font-medium">Dismissed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.date} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-2 font-medium">{dayLabel(row.date)}</td>
                {(['generated', 'approved', 'dismissed'] as const).map((key) => {
                  const untracked = !row.tracked && key !== 'approved'
                  return (
                    <td key={key} className="px-4 py-2">
                      {untracked ? (
                        <span className="text-gray-300" title="Not recorded for this day">
                          —
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="w-6 tabular-nums">{row[key]}</span>
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full ${key === 'approved' ? 'bg-emerald-500' : key === 'dismissed' ? 'bg-rose-400' : 'bg-brand'}`}
                              style={{ width: `${(row[key] / maxBar) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-2.5 text-start font-medium">Category</th>
              <th className="px-4 py-2.5 text-start font-medium">Generated</th>
              <th className="px-4 py-2.5 text-start font-medium">Approved</th>
              <th className="px-4 py-2.5 text-start font-medium">Dismissed</th>
            </tr>
          </thead>
          <tbody>
            {data.categories.map((row) => (
              <tr key={row.category} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-2 font-medium">{CATEGORY_LABEL[row.category] ?? row.category}</td>
                <td className="px-4 py-2 tabular-nums">{row.generated}</td>
                <td className="px-4 py-2 tabular-nums">{row.approved}</td>
                <td className="px-4 py-2 tabular-nums">{row.dismissed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default SuggestionStats
