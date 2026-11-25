import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { getHub } from '../api/hubs'
import { peopleQuery } from '../api/queries'
import PersonCard from '../components/PersonCard'
import { hubText } from '../i18n/hubText'
import { formatCount } from '../utils/format'

// /talent/<profession|industry|topic>/<country>: jaise /talent/technology/uae. Server isi ka HTML pehle bhej deta hai (SEO)
function TalentHub() {
  const { segment = '', country } = useParams()
  const { data: hub, isLoading, isError } = useQuery({
    queryKey: ['hub', segment, country ?? ''],
    queryFn: () => getHub(segment, country),
    retry: false,
    staleTime: 60 * 1000,
  })

  // Cards ke liye wohi people API (poori card info), hub ke filter ke saath
  const params = new URLSearchParams({ limit: '24', sort: 'followers' })
  if (hub) {
    params.set(hub.kind, hub.slug)
    if (hub.country) params.set('country', hub.country.code)
  }
  const { data: people } = useQuery({ ...peopleQuery(params), enabled: !!hub })

  if (isLoading) return <p className="mx-auto max-w-5xl px-4 py-16 text-center text-gray-500">{hubText('loading')}</p>
  if (isError || !hub) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-gray-500">{hubText('notFound')}</p>
        <Link to="/talent" className="mt-4 inline-block text-brand underline">
          {hubText('allTalent')}
        </Link>
      </div>
    )
  }

  const where = hub.country ? `${hubText('inCountry')} ${hub.country.name}` : hubText('worldwide')
  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 pb-16 pt-24 sm:px-6 lg:px-10">
      <nav className="text-sm text-gray-500">
        <Link to="/talent" className="hover:underline">
          {hubText('talent')}
        </Link>{' '}
        › {hub.name}
      </nav>
      <h1 className="font-display mt-3 text-3xl font-bold md:text-5xl">
        {hub.name} {hubText('talent')} {where}
      </h1>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
        <span>
          {hub.total} {hubText('profiles')}
        </span>
        {hub.verified > 0 && (
          <span>
            {hub.verified} {hubText('verified')}
          </span>
        )}
        {hub.openToWork > 0 && (
          <span>
            {hub.openToWork} {hubText('openToWork')}
          </span>
        )}
        {hub.followers > 0 && (
          <span>
            {formatCount(hub.followers)} {hubText('followers')}
          </span>
        )}
      </p>
      <p className="mt-5 max-w-3xl text-base leading-relaxed text-gray-700">{hub.intro}</p>

      <div className="mt-8 grid gap-3 xl:grid-cols-2">
        {people?.people.map((person) => <PersonCard key={person._id} person={person} />)}
        {people && people.people.length === 0 && <p className="text-gray-500">{hubText('noPeople')}</p>}
      </div>

      <section className="mt-12 max-w-3xl">
        <h2 className="font-display text-2xl font-bold">{hubText('faq')}</h2>
        <div className="mt-4 space-y-5">
          {hub.faqs.map((faq) => (
            <div key={faq.q}>
              <h3 className="font-semibold">{faq.q}</h3>
              <p className="mt-1 text-gray-700">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default TalentHub
