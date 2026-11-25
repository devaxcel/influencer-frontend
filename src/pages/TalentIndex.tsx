import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listHubs, type HubLink } from '../api/hubs'
import { hubText } from '../i18n/hubText'

// /talent: category + mulk ke hubs ki fehrist (sirf wo jin mein kam az kam 5 profiles hon)
function TalentIndex() {
  const { data: hubs, isLoading } = useQuery({ queryKey: ['hubs'], queryFn: listHubs, staleTime: 5 * 60 * 1000 })

  const groups = new Map<string, { name: string; links: HubLink[] }>()
  for (const hub of hubs ?? []) {
    const key = `${hub.kind}:${hub.slug}`
    const group = groups.get(key) ?? { name: hub.name, links: [] }
    group.links.push(hub)
    groups.set(key, group)
  }

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 pb-16 pt-24 sm:px-6 lg:px-10">
      <h1 className="font-display text-3xl font-bold md:text-5xl">{hubText('indexTitle')}</h1>
      <p className="mt-3 max-w-2xl text-gray-600">{hubText('indexLead')}</p>
      {isLoading && <p className="mt-8 text-gray-500">{hubText('loading')}</p>}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...groups.entries()].map(([key, group]) => (
          <section key={key} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">{group.name}</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {group.links.map((hub) => (
                <li key={hub.path}>
                  <Link to={hub.path} className="text-brand hover:underline">
                    {hub.country ? hub.country.name : hubText('worldwide')}
                  </Link>{' '}
                  <span className="text-gray-400">({hub.count})</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

export default TalentIndex
