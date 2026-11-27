import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { checkSocialLinks, getAccountAudit, keepAuditAccount, removeAuditAccount, type AuditAccount, type LinkCheck } from '../../api/accountAudit'
import { formatCount } from '../../utils/format'
import { getApiError } from '../../utils/apiError'

const KEY = ['admin', 'account-audit']
const REASON: Record<AuditAccount['reason'], string> = {
  reserved: 'This is a page of the platform itself, not a person\'s account',
  unrelated: 'The account name has nothing to do with this person',
}

// Admin: shak wale social accounts. Galat account lag jaye to uske followers insaan ke naam jur jate hain
// (jaise Dylan Page ke naam Instagram ka apna page, 670M followers). Hatao, ya sahi account khud dhoondne do
function AccountAuditCard() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const audit = useQuery({ queryKey: KEY, queryFn: getAccountAudit, staleTime: 30_000 })
  const [busy, setBusy] = useState<string | null>(null)
  const [links, setLinks] = useState<LinkCheck | null>(null)
  const checkLinks = useMutation({
    mutationFn: () => checkSocialLinks(true),
    onSuccess: (result) => {
      setLinks(result)
      if (result.fixed.length > 0) toast.success(`${result.fixed.length} link${result.fixed.length === 1 ? '' : 's'} fixed`)
      queryClient.invalidateQueries({ queryKey: ['people'] })
    },
    onError: (error) => toast.error(getApiError(error).message),
  })

  const done = () => {
    queryClient.invalidateQueries({ queryKey: KEY })
    queryClient.invalidateQueries({ queryKey: ['people'] })
  }
  const idOf = (a: AuditAccount) => `${a.personId}:${a.platform}:${a.handle}`

  const remove = useMutation({
    mutationFn: ({ account, findCorrect }: { account: AuditAccount; findCorrect: boolean }) => removeAuditAccount(account, findCorrect),
    onMutate: ({ account }) => setBusy(idOf(account)),
    onSuccess: (result, { findCorrect }) => {
      if (!findCorrect) toast.success(`Removed from ${result.name}`)
      else if (result.replacement) toast.success(`${result.name}: now @${result.replacement.handle} (${formatCount(result.replacement.followers)} followers)`)
      else toast(`${result.name}: removed. No reliable replacement found, add the right link by hand in Edit profile.`, { icon: 'ℹ️', duration: 7000 })
      done()
    },
    onError: (error) => toast.error(getApiError(error).message),
    onSettled: () => setBusy(null),
  })
  const keep = useMutation({
    mutationFn: keepAuditAccount,
    onMutate: (account) => setBusy(idOf(account as AuditAccount)),
    onSuccess: done,
    onError: (error) => toast.error(getApiError(error).message),
    onSettled: () => setBusy(null),
  })

  const rows = audit.data ?? []
  if (audit.isError) return null

  return (
    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Check social accounts</h2>
          <p className="mt-1 text-sm text-gray-600">
            {audit.isLoading
              ? 'Checking…'
              : rows.length === 0
                ? 'No suspicious accounts found.'
                : `${rows.length} account${rows.length === 1 ? '' : 's'} may be wrong. A wrong account adds someone else's followers to the profile.`}
          </p>
          <p className="mt-1 text-xs text-gray-500">Only profiles that are not claimed by their talent are checked. Nothing changes until you press a button.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={checkLinks.isPending}
            onClick={() => checkLinks.mutate()}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
          >
            {checkLinks.isPending ? 'Checking links…' : 'Check and fix links'}
          </button>
          {rows.length > 0 && (
            <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
              {open ? 'Hide list' : `Review ${rows.length}`}
            </button>
          )}
        </div>
      </div>

      {links && (
        <div className="mt-4 space-y-3 rounded-xl bg-gray-50 p-4 text-sm">
          <p className="font-medium">
            Checked {links.checked} account{links.checked === 1 ? '' : 's'}.
            {links.youtubeSkipped && ' YouTube links were skipped: add the YouTube key in API settings.'}
          </p>
          <div>
            <p className="font-medium text-emerald-700">Fixed ({links.fixed.length})</p>
            {links.fixed.length === 0 && <p className="text-xs text-gray-500">No YouTube link needed fixing.</p>}
            <ul className="mt-1 space-y-1">
              {links.fixed.map((change) => (
                <li key={`${change.personId}-${change.platform}`} className="text-xs">
                  <Link to={`/people/${change.slug}`} target="_blank" className="font-medium underline">
                    {change.name}
                  </Link>
                  : <span className="text-red-600 line-through">{change.from.replace('https://www.', '')}</span> →{' '}
                  <a href={change.to} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">
                    {change.to.replace('https://www.', '')}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {links.missing.length > 0 && (
            <div>
              <p className="font-medium text-red-700">Account not found ({links.missing.length})</p>
              <p className="text-xs text-gray-500">These links point to nothing. Open Edit profile and fix or remove them.</p>
              <ul className="mt-1 space-y-1 text-xs">
                {links.missing.map((problem) => (
                  <li key={`${problem.personId}-${problem.platform}-${problem.handle}`}>
                    <Link to={`/people/${problem.slug}`} target="_blank" className="font-medium underline">
                      {problem.name}
                    </Link>
                    : {problem.platform} @{problem.handle}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {links.unverified.length > 0 && (
            <div>
              <p className="font-medium text-amber-700">Could not be confirmed ({links.unverified.length})</p>
              <p className="text-xs text-gray-500">Instagram, Facebook and X cannot be opened from our server, so the follower count could not be confirmed for these. Open each link once to be sure.</p>
              <ul className="mt-1 space-y-1 text-xs">
                {links.unverified.map((problem) => (
                  <li key={`${problem.personId}-${problem.platform}-${problem.handle}`}>
                    <Link to={`/people/${problem.slug}`} target="_blank" className="font-medium underline">
                      {problem.name}
                    </Link>
                    : {problem.platform}{' '}
                    <a href={problem.url} target="_blank" rel="noopener noreferrer" className="underline">
                      @{problem.handle}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {open && rows.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-100 text-sm">
          {rows.map((account) => {
            const working = busy === idOf(account)
            return (
              <li key={idOf(account)} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    <Link to={`/people/${account.slug}`} target="_blank" className="underline">
                      {account.name}
                    </Link>{' '}
                    <span className="font-normal text-gray-500">
                      · {account.platform} ·{' '}
                      <a href={account.url} target="_blank" rel="noopener noreferrer" className="underline">
                        @{account.handle}
                      </a>
                      {account.followers !== null && ` · ${formatCount(account.followers)} followers counted`}
                    </span>
                  </p>
                  <p className={`text-xs ${account.reason === 'reserved' ? 'text-red-600' : 'text-amber-700'}`}>{REASON[account.reason]}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => remove.mutate({ account, findCorrect: true })}
                    className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
                  >
                    {working ? 'Working…' : 'Remove and find the right one'}
                  </button>
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => {
                      if (window.confirm(`Remove @${account.handle} from ${account.name}?`)) remove.mutate({ account, findCorrect: false })
                    }}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Remove
                  </button>
                  <button type="button" disabled={working} onClick={() => keep.mutate(account)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50">
                    It is correct
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default AccountAuditCard
