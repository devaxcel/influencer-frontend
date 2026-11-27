import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { lookupAccounts, type Proposal } from '../../api/accountFinder'
import { formatCount } from '../../utils/format'
import { getApiError } from '../../utils/apiError'

const PLATFORM: Record<string, string> = { youtube: 'YouTube', instagram: 'Instagram', x: 'X', tiktok: 'TikTok', facebook: 'Facebook' }

// Profile form (sirf admin): naam likh kar "Find accounts" dabao, asli accounts ki tajweez aati hai, "Add to form" se form mein lag jate
// hain (save abhi nahi hota: form save karne par). Link khol kar dekh lein ke wahi insaan hai
function AccountFinder({
  name,
  existing,
  onAdd,
}: {
  name: string
  existing: { platform: string; handle?: string }[]
  onAdd: (proposal: Proposal) => void
}) {
  const [proposals, setProposals] = useState<Proposal[] | null>(null)
  const find = useMutation({
    mutationFn: () => lookupAccounts(name.trim(), existing),
    onSuccess: (found) => {
      setProposals(found)
      if (found.length === 0) toast('No reliable account found. Add the links by hand.', { icon: 'ℹ️' })
    },
    onError: (error) => toast.error(getApiError(error).message),
  })

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={find.isPending || name.trim().length < 3}
        onClick={() => find.mutate()}
        className="rounded-lg border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand/5 disabled:opacity-50"
        title={name.trim().length < 3 ? 'Type the name first' : undefined}
      >
        {find.isPending ? 'Searching…' : 'Find accounts'}
      </button>
      {proposals && proposals.length > 0 && (
        <div className="rounded-xl bg-gray-50 p-3 text-sm">
          <p className="mb-2 text-xs text-gray-500">Found for "{name.trim()}". Open the link to check it is really them, then add.</p>
          <ul className="space-y-1.5">
            {proposals.map((proposal) => (
              <li key={`${proposal.platform}:${proposal.handle}`} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="w-20 text-gray-500">{PLATFORM[proposal.platform] ?? proposal.platform}</span>
                <a href={proposal.url} target="_blank" rel="noopener noreferrer" className="font-medium underline">
                  @{proposal.handle}
                </a>
                <span className="text-gray-600">{formatCount(proposal.followers)} followers</span>
                <button
                  type="button"
                  onClick={() => {
                    onAdd(proposal)
                    setProposals((current) => current?.filter((p) => p !== proposal) ?? null)
                  }}
                  className="rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-on-brand hover:bg-brand-hover"
                >
                  Add to form
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default AccountFinder
