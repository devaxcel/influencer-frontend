import { useEffect, useState } from 'react'
import { taxName } from '../utils/taxonomy'
import Sentence from '../components/admin-panel/Sentence'
import ScrollProgressButton from '../components/home/ScrollProgressButton'
import { MARK } from '../components/admin-panel/sentenceSlots'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRight,
  faBriefcase,
  faCheck,
  faPlay,
  faStar,
  faUserTie,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { featuredWeekQuery, peopleQuery } from '../api/queries'
import { listPeople } from '../api/people'
import { ProfileTile } from '../components/home/ProfileTile'
import SearchBar from '../components/SearchBar'
import { useAuth } from '../hooks/useAuth'
import { useTaxonomy } from '../hooks/useTaxonomy'
import {
  Benefits,
  CountUp,
  Faq,
  FeatureShowcase,
  HighlightedText1,
  HowItWorks,
  OpenCampaigns,
  Photo,
  PlatformStrip,
  Reveal,
  prefersReducedMotion,
} from '../components/home/HomeSections'
import type { PersonSummary } from '../types/person'
import { formatCount } from '../utils/format'

const HERO_VIDEO = '/videos/hero.mp4'
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=75'

const FEATURED_COUNT = 8
const MOST_FOLLOWED_PAGE = 8
// Featured this week: ek qatar (4 profiles)
const WEEK_COUNT = 4
const STRIP_COUNT = 12
const INDUSTRY_LIMIT = 8

const INDUSTRY_IMAGES = [
  'photo-1522071820081-009f0129c71c',
  'photo-1600880292203-757bb62b4baf',
  'photo-1543269865-cbf427effbad',
  'photo-1521737604893-d14cc237f11d',
  'photo-1611162617213-7d7a39e9b1d7',
  'photo-1492684223066-81342ee5ff30',
  'photo-1516035069371-29a1b244cc32',
  'photo-1529156069898-49953e39b3ac',
].map((id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=75`)

const TILE_GRADIENTS = [
  'from-gray-600 to-gray-900',
  'from-gray-800 to-black',
  'from-gray-500 to-gray-800',
  'from-gray-900 to-gray-600',
]

const ROLE_IMAGES = {
  brands: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=75',
  talent: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=1200&q=75',
  managers: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=75',
}

const CTA_BACKGROUND =
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=75'

const HERO_SLIDES = [
  { src: '/images/hero-3.png', alt: 'Creators on the platform' },
  { src: '/images/hero-4.png', alt: 'Brand tracking campaign reach' },
  { src: '/images/hero-1.png', alt: 'Lifestyle creator with phone' },
  { src: '/images/hero-5.png', alt: 'Content creator with laptop' },
  { src: '/images/hero-2.png', alt: 'Creator working on laptop' },
]

function RotatingWord({ words }: { words: string[] }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (prefersReducedMotion()) return
    const id = window.setInterval(() => setI((p) => (p + 1) % words.length), 2200)
    return () => window.clearInterval(id)
  }, [words.length])
  return (
    <span
      key={i}
      className="inline-block animate-word bg-gradient-to-tr from-[#FFC400] via-[#FF7A00] to-[#FF2D00] bg-clip-text text-transparent"
    >
      {words[i]}
    </span>
  )
}

function HeroShowcase() {
  const { t } = useTranslation()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || prefersReducedMotion()) return
    const id = window.setInterval(() => setActive((p) => (p + 1) % HERO_SLIDES.length), 3500)
    return () => window.clearInterval(id)
  }, [paused])

  return (
    <div
      className="relative mx-auto mb-6 aspect-square w-full max-w-[17rem] sm:max-w-sm md:max-w-md lg:mb-0 lg:ms-auto lg:max-w-lg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {HERO_SLIDES.map((s, i) => (
        <img
          key={s.src}
          src={s.src}
          alt={s.alt}
          loading={i === 0 ? 'eager' : 'lazy'}
          onError={(e) => (e.currentTarget.style.display = 'none')}
          className={`absolute inset-0 h-full w-full object-contain transition-all duration-1000 ease-out ${
            i === active ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        />
      ))}

      <div
        className="absolute bottom-[14%] end-0 z-20 flex animate-float-slow items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 text-[10px] font-semibold text-gray-900 shadow-xl ring-1 ring-gray-200 sm:gap-2 sm:rounded-2xl sm:px-3.5 sm:py-2 sm:text-xs"
        style={{ animationDelay: '-2s' }}
      >
        <FontAwesomeIcon icon={faStar} className="text-[#FF7A00]" />
        {t('home.topRated', { defaultValue: 'Top rated' })}
      </div>

      <div className="absolute inset-x-0 -bottom-5 z-20 flex justify-center gap-2">
        {HERO_SLIDES.map((s, i) => (
          <button
            key={s.src}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={() => setActive(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === active ? 'w-7 bg-brand-violet' : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
// Roles section background: sirf dotted grid (footer jaisa)
function RoleShapes() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <svg className="absolute inset-0 h-full w-full text-white/15 dark:text-[#000000]/20">
        <defs>
          <pattern id="role-dots" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#role-dots)" />
      </svg>
    </div>
  )
}
function IndustryTile({
  to,
  name,
  index,
}: {
  to: string
  name: string
  index: number
}) {
  const { t } = useTranslation()
  const [broken, setBroken] = useState(false)
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-brand-violet/40 sm:gap-4 sm:p-4"
    >
      <span
        className={`keep-dark relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br sm:h-16 sm:w-16 ${
          TILE_GRADIENTS[index % TILE_GRADIENTS.length]
        }`}
      >
        {!broken && (
          <img
            src={INDUSTRY_IMAGES[index % INDUSTRY_IMAGES.length]}
            alt=""
            loading="lazy"
            onError={() => setBroken(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-125"
          />
        )}
      </span>

      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate font-display text-sm font-bold sm:text-base">{name}</span>
        <span className="mt-0.5 block text-[11px] text-gray-500 sm:text-xs">
          {t('home.explore', { defaultValue: 'Explore' })}
        </span>
      </span>

      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition duration-300 group-hover:bg-brand group-hover:text-on-brand">
        <FontAwesomeIcon
          icon={faArrowRight}
          className="text-xs transition duration-300 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
        />
      </span>
    </Link>
  )
}

function CtaCard({
  title,
  body,
  cta,
  to,
  variant = 'solid',
}: {
  title: string
  body: string
  cta: string
  to: string
  variant?: 'solid' | 'outline'
}) {
  return (
    <div className="w-full rounded-xl bg-white/10 p-4 text-center ring-1 ring-white/20 backdrop-blur sm:rounded-2xl sm:p-5 md:p-6 md:text-start">
      <h2 className="font-display text-base font-bold leading-snug sm:text-lg md:text-2xl">
        {title}
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-white/80 sm:text-sm">{body}</p>
      <Link
        to={to}
        className={
          variant === 'solid'
            ? 'mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-on-brand transition hover:scale-105 sm:mt-5 sm:px-5 sm:py-2.5 sm:text-sm md:w-auto md:justify-start'
            : 'mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/40 px-4 py-2 text-xs font-semibold text-white transition hover:scale-105 hover:bg-white/10 sm:mt-5 sm:px-5 sm:py-2.5 sm:text-sm md:w-auto md:justify-start'
        }
      >
        {cta}
        <FontAwesomeIcon icon={faArrowRight} className="text-[10px] sm:text-xs rtl:rotate-180" />
      </Link>
    </div>
  )
}

function Home() {
  const { t } = useTranslation()
  const d = (key: string, defaultValue: string) => t(key, { defaultValue })
  const sub = (p: PersonSummary) =>
    p.totalFollowers > 0
      ? t('site.followers', { value: formatCount(p.totalFollowers) })
      : (p.professions[0] ? taxName(p.professions[0]) : '')
  const { user } = useAuth()
  const { data: industries } = useTaxonomy('industries')
  const [tab, setTab] = useState<'brands' | 'talent' | 'managers'>('brands')
  const [videoOk, setVideoOk] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [reduced] = useState(prefersReducedMotion)

  const { data } = useQuery(
    peopleQuery(new URLSearchParams({ limit: String(STRIP_COUNT), sort: 'followers' })),
  )
  const people = data?.people ?? []
  const reach = people.slice(0, FEATURED_COUNT).reduce((sum, p) => sum + p.totalFollowers, 0)

  // Most followed: 8 profiles, "Load more" se agle 8, jab tak sab na aa jayen
  const mostFollowed = useInfiniteQuery({
    queryKey: ['people', 'most-followed', MOST_FOLLOWED_PAGE],
    queryFn: ({ pageParam }) =>
      listPeople(new URLSearchParams({ limit: String(MOST_FOLLOWED_PAGE), sort: 'followers', page: String(pageParam) })),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (all.length * MOST_FOLLOWED_PAGE < last.meta.total ? all.length + 1 : undefined),
    staleTime: 30 * 1000,
  })
  const featured = mostFollowed.data?.pages.flatMap((page) => page.people) ?? []
  const featuredTotal = mostFollowed.data?.pages[0]?.meta.total ?? 0

  // Featured this week: is hafte ke sab se maqbool profiles
  const week = useQuery(featuredWeekQuery(WEEK_COUNT))

  useEffect(() => {
    if (!playing) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPlaying(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing])

  const stats = [
    { value: data?.meta.total ?? 0, label: t('home.statProfiles') },
    { value: reach, label: d('home.statReach', 'Combined reach of top creators') },
    { value: industries?.length ?? 0, label: t('home.statIndustries') },
    { value: 3, label: t('home.statLanguages') },
  ]

  const tabs = {
    brands: {
      icon: faBriefcase,
      label: d('home.tabBrands', 'For brands'),
      title: d('home.tabBrandsTitle', 'Find the right voice and hire with confidence'),
      points: [
        d('home.tabBrands1', 'Search verified creators by industry, country and followers'),
        d('home.tabBrands2', 'Save favourites to shortlists and compare them side by side'),
        d('home.tabBrands3', 'Send a hire request and sign a milestone agreement online'),
      ],
      cta: d('home.tabBrandsCta', 'Start exploring'),
      to: '/search',
    },
    talent: {
      icon: faStar,
      label: d('home.tabTalent', 'For creators'),
      title: d('home.tabTalentTitle', 'Own your profile and turn reach into work'),
      points: [
        d('home.tabTalent1', 'Claim your profile and get the verified badge'),
        d('home.tabTalent2', 'List your services, prices and availability'),
        d('home.tabTalent3', 'Answer hire requests and get paid per milestone'),
      ],
      cta: user ? t('home.ctaDashboard') : t('home.ctaTalentButton'),
      to: user ? '/dashboard' : '/register',
    },
    managers: {
      icon: faUserTie,
      label: d('home.tabManagers', 'For managers'),
      title: d('home.tabManagersTitle', 'Run a whole roster from one place'),
      points: [
        d('home.tabManagers1', 'Request to represent talent, always with their consent'),
        d('home.tabManagers2', 'Handle hire requests for every talent in one inbox'),
        d('home.tabManagers3', 'Edit profiles and services on their behalf'),
      ],
      cta: user ? t('home.ctaDashboard') : t('home.ctaTalentButton'),
      to: user ? '/dashboard' : '/register',
    },
  }
  const current = tabs[tab]
  const words = [
    d('home.wordCreators', 'creators'),
    d('home.wordJournalists', 'journalists'),
    d('home.wordSpeakers', 'speakers'),
    d('home.wordExperts', 'experts'),
  ]
  const chip =
    'rounded-full border border-white/25 bg-white/10 px-3 py-1.5 backdrop-blur transition hover:bg-white/20 hover:text-white'

  const ctaTalent = {
    title: t('home.ctaTalentTitle'),
    body: t('home.ctaTalentBody'),
    cta: user ? t('home.ctaDashboard') : t('home.ctaTalentButton'),
    to: user ? '/dashboard' : '/register',
    variant: 'solid' as const,
  }
  const ctaBusiness = {
    title: t('home.ctaBusinessTitle'),
    body: t('home.ctaBusinessBody'),
    cta: t('home.ctaBusinessButton'),
    to: '/search',
    variant: 'outline' as const,
  }

  return (
    <div className="home-page overflow-x-hidden pb-16">
      <ScrollProgressButton />

      {/* Hero */}
      <section
        aria-label={t('home.heroLabel')}
        className="keep-dark relative isolate bg-brand-plum"
      >
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <img
            src={HERO_IMAGE}
            alt=""
            onError={(e) => (e.currentTarget.style.display = 'none')}
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />

          {!reduced && (
            <video
              src={HERO_VIDEO}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onCanPlay={() => setVideoOk(true)}
              onError={() => setVideoOk(false)}
              className={`absolute inset-0 hidden h-full w-full object-cover transition-opacity duration-1000 sm:block ${
                videoOk ? 'opacity-20' : 'opacity-0'
              }`}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-brand-plum/95 via-brand-plum/50 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 px-4 pb-28 pt-20 sm:gap-10 sm:pb-40 sm:pt-24 md:pt-28 lg:grid-cols-2">
          <div className="text-center lg:text-start">
            <h1 className="font-display text-2xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              <span className="text-white">
                <HighlightedText1 i18nKey="home.titleRich" />
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:mt-5 sm:text-base md:text-lg lg:mx-0">
              {t('home.subtitle')}
            </p>
            <p className="mt-4 font-display text-lg font-bold text-white sm:mt-5 sm:text-xl md:text-2xl lg:text-3xl">
              <Sentence
                template={t('home.findTopTemplate', { word: `${MARK}word${MARK}` })}
                parts={{ word: <RotatingWord words={words} /> }}
              />
            </p>

            <div className="mx-auto mt-5 max-w-xl sm:mt-6 lg:mx-0">
              <SearchBar size="lg" tone="onDark" />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[11px] text-white/80 sm:mt-4 sm:text-xs lg:justify-start">
              <span className="hidden sm:inline">{t('home.popular')}</span>
              <Link to="/search?sort=followers" className={chip}>
                {t('home.mostFollowed')}
              </Link>
              {industries?.slice(0, 3).map((industry) => (
                <Link key={industry._id} to={`/search?industry=${industry.slug}`} className={chip}>
                  {taxName(industry)}
                </Link>
              ))}
            </div>

            <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center lg:justify-start">
              <Link
                to="/search"
                className="keep-dark inline-flex justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand shadow-lg shadow-brand/30 transition hover:scale-105 hover:bg-brand-hover sm:px-6 sm:py-3"
              >
                {d('home.findInfluencers', 'Find influencers')}
              </Link>
              <Link
                to={user ? '/dashboard' : '/register'}
                className="inline-flex justify-center rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 sm:px-6 sm:py-3"
              >
                {user ? t('home.ctaDashboard') : d('home.joinAsTalent', 'Join as talent')}
              </Link>
              {videoOk && (
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
                  className="inline-flex items-center justify-center gap-3 text-sm font-medium text-white/90 hover:text-white"
                >
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 sm:h-11 sm:w-11">
                    <span className="absolute inset-0 animate-ping rounded-full bg-white/40" />
                    <FontAwesomeIcon icon={faPlay} className="relative text-xs" />
                  </span>
                  {d('home.watchVideo', 'Watch how it works')}
                </button>
              )}
            </div>
          </div>

          <HeroShowcase />
        </div>

        {/* Wavy curve: light mode white, dark mode dark */}
        <div className="pointer-events-none absolute inset-x-0 -bottom-1 z-10 w-full translate-y-[1px]">
          <svg
            viewBox="0 0 1440 200"
            preserveAspectRatio="none"
            className="h-24 w-full sm:h-36 md:h-48 lg:h-56"
            aria-hidden="true"
          >
            <path
              d="M0,100 C240,180 480,20 720,100 C960,180 1200,40 1440,100"
              fill="none"
              stroke="#8b3df5"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M0,100 C240,180 480,20 720,100 C960,180 1200,40 1440,100 L1440,200 L0,200 Z"
              className="fill-[#ffffff] dark:fill-[#171513]"
            />
          </svg>
        </div>
      </section>

      <div className="relative z-20 mx-auto -mt-10 max-w-6xl px-4 sm:-mt-14">
        <Reveal>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-gray-200 shadow-xl ring-1 ring-gray-200 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse gap-1 bg-white p-4 md:p-5 lg:p-6">
                <dt className="text-[11px] text-gray-500 sm:text-xs md:text-sm">{s.label}</dt>
                <dd className="font-display text-2xl font-extrabold text-gray-900 sm:text-3xl md:text-4xl">
                  <CountUp value={s.value} />
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      {people.length > 0 && (
        <section className="group mt-10 overflow-hidden sm:mt-14" aria-label={t('home.mostFollowed')}>
          <div className="flex w-max animate-marquee gap-3 sm:gap-4">
            {[...people, ...people].map((p, i) => (
              <Link
                key={`${p._id}-${i}`}
                to={`/people/${p.slug}`}
                aria-hidden={i >= people.length}
                tabIndex={i >= people.length ? -1 : 0}
                className="flex shrink-0 items-center gap-2 rounded-full bg-white py-1.5 pe-4 ps-1.5 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-0.5 hover:shadow-md sm:gap-3 sm:py-2 sm:pe-5 sm:ps-2"
              >
                <Photo person={p} className="h-9 w-9 rounded-full sm:h-11 sm:w-11" />
                <span className="leading-tight">
                  <span className="block text-xs font-semibold sm:text-sm">{p.name}</span>
                  <span className="block text-[10px] text-gray-500 sm:text-xs">{sub(p)}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto mt-12 max-w-6xl space-y-16 px-4 sm:mt-20 sm:space-y-24">
        <PlatformStrip />

        <section>
          <Reveal>
            <SectionHeader title={t('home.browseByIndustry')} />
          </Reveal>
         <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {industries
              ? industries.slice(0, INDUSTRY_LIMIT).map((industry, i) => (
                  <Reveal key={industry._id} delay={(i % 4) * 80}>
                    <IndustryTile
                      to={`/search?industry=${industry.slug}`}
                      name={taxName(industry)}
                      index={i}
                    />
                  </Reveal>
                ))
              : Array.from({ length: INDUSTRY_LIMIT }, (_, i) => (
                 <div key={i} className="h-[4.75rem] animate-pulse rounded-2xl bg-gray-200/70 sm:h-24" />
                ))}
          </div>
        </section>

        {(week.isLoading || (week.data && week.data.length > 0)) && (
          <section aria-label={d('home.featuredWeek', 'Featured this week')}>
            <Reveal>
              <SectionHeader title={d('home.featuredWeek', 'Featured this week')} to="/search" />
              <p className="mt-1 text-sm text-gray-500">
                {d('home.featuredWeekSub', 'The profiles people viewed, saved and contacted the most in the last 7 days.')}
              </p>
            </Reveal>
            <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {week.isLoading
                ? Array.from({ length: WEEK_COUNT }, (_, i) => (
                    <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-gray-200/70" />
                  ))
                : week.data!.map((p, i) => (
                    <Reveal key={p._id} delay={(i % 4) * 90}>
                      <ProfileTile person={p} hot={p.weekly.source === 'popular'} />
                    </Reveal>
                  ))}
            </div>
          </section>
        )}

        <section>
          <Reveal>
            <SectionHeader title={t('home.mostFollowed')} to="/search?sort=followers" />
          </Reveal>
          {mostFollowed.isError && !mostFollowed.data && (
            <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {t('home.loadError')}
            </p>
          )}
          {mostFollowed.data && featured.length === 0 && (
            <p className="mt-5 text-gray-500">{t('home.noProfiles')}</p>
          )}
          <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {mostFollowed.isLoading
              ? Array.from({ length: FEATURED_COUNT }, (_, i) => (
                  <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-gray-200/70" />
                ))
              : featured.map((p, i) => (
                  <Reveal key={p._id} delay={(i % MOST_FOLLOWED_PAGE % 4) * 90}>
                    <ProfileTile person={p} />
                  </Reveal>
                ))}
          </div>
          {mostFollowed.data && featuredTotal > 0 && (
            <div className="mt-6 flex flex-col items-center gap-2 sm:mt-8">
              <p className="text-xs text-gray-500">
                {d('home.showingOf', 'Showing {{shown}} of {{total}}')
                  .replace('{{shown}}', String(featured.length))
                  .replace('{{total}}', String(featuredTotal))}
              </p>
              {mostFollowed.hasNextPage && (
                <button
                  type="button"
                  onClick={() => mostFollowed.fetchNextPage()}
                  disabled={mostFollowed.isFetchingNextPage}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold shadow-sm transition hover:border-gray-900 hover:shadow-md disabled:opacity-60"
                >
                  {mostFollowed.isFetchingNextPage ? d('home.loadingMore', 'Loading…') : d('home.loadMore', 'Load more')}
                </button>
              )}
            </div>
          )}
        </section>

        <FeatureShowcase people={people} />

        <HowItWorks />
      </div>

     <section className="relative isolate mt-16 w-full overflow-hidden bg-gray-950 py-8 dark:bg-gray-800 sm:mt-24 sm:py-10 md:py-16">
        <RoleShapes />
        <div className="relative z-10 mx-auto max-w-6xl px-4">
          <Reveal>
            <h2 className="text-center font-display text-xl font-bold text-white sm:text-2xl md:text-3xl">
              {d('home.rolesTitle', 'One platform, three ways to work')}
            </h2>
            <div
              role="tablist"
              className="mx-auto mt-4 flex w-fit max-w-full flex-wrap justify-center gap-1.5 rounded-full bg-white/10 p-1 sm:mt-6 sm:gap-2 sm:p-1.5"
            >
              {(Object.keys(tabs) as (keyof typeof tabs)[]).map((id) => (
                <button
                  key={id}
                  role="tab"
                  type="button"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition sm:gap-2 sm:px-5 sm:py-2 sm:text-sm ${
                    tab === id
                      ? 'bg-brand text-on-brand shadow'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <FontAwesomeIcon icon={tabs[id].icon} className="text-[10px] sm:text-xs" />
                  {tabs[id].label}
                </button>
              ))}
            </div>

            <div key={tab} className="mt-6 grid items-center gap-6 sm:mt-8 sm:gap-8 md:grid-cols-2">
              <ul className="space-y-3 sm:space-y-4">
                {current.points.map((point, i) => (
                  <li
                    key={point}
                    className="flex animate-slide-in gap-2.5 sm:gap-3"
                    style={{ animationDelay: `${i * 120}ms` }}
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand sm:h-6 sm:w-6">
                      <FontAwesomeIcon icon={faCheck} className="text-[10px] sm:text-xs" />
                    </span>
                    <span className="text-sm text-gray-100 sm:text-base">{point}</span>
                  </li>
                ))}
              </ul>

              <div className="keep-dark relative isolate overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-8">
                <img
                  src={ROLE_IMAGES[tab]}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 -z-20 h-full w-full object-cover"
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black/85 via-black/70 to-black/50" />

                <FontAwesomeIcon icon={current.icon} className="text-3xl text-white/90 sm:text-4xl" />
                <h3 className="mt-3 font-display text-lg font-bold leading-snug sm:mt-4 sm:text-xl md:text-2xl">
                  {current.title}
                </h3>
                <Link
                  to={current.to}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-on-brand transition hover:scale-105 sm:mt-6 sm:px-5 sm:py-2.5 sm:text-sm"
                >
                  {current.cta}
                  <FontAwesomeIcon icon={faArrowRight} className="text-[10px] rtl:rotate-180 sm:text-xs" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="mt-16 sm:mt-24">
        <OpenCampaigns />
      </div>

      <div className="mx-auto max-w-6xl space-y-16 px-4 sm:space-y-24">
        <Benefits />

        <Faq />

        <Reveal>
          <section className="keep-dark relative isolate overflow-hidden rounded-2xl p-4 text-white sm:rounded-[2rem] sm:p-6 md:p-12">
            <img
              src={CTA_BACKGROUND}
              alt=""
              loading="lazy"
              className="absolute inset-0 -z-20 h-full w-full object-cover"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-plum/95 via-brand-plum/85 to-black/70" />
            <div className="absolute -start-20 -top-20 -z-10 h-80 w-80 animate-drift rounded-full bg-brand-violet/35 blur-3xl" />
            <div
              className="absolute -bottom-24 end-0 -z-10 h-80 w-80 animate-drift rounded-full bg-brand-magenta/25 blur-3xl"
              style={{ animationDelay: '-8s' }}
            />

            <div className="relative flex flex-col gap-3 sm:gap-4 md:grid md:grid-cols-2 md:gap-4">
              <CtaCard {...ctaTalent} />
              <CtaCard {...ctaBusiness} />
            </div>
          </section>
        </Reveal>
      </div>

      {playing && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPlaying(false)}
          className="keep-dark fixed inset-0 z-[100] flex animate-fade items-center justify-center bg-black/85 p-4"
        >
          <button
            type="button"
            aria-label={t('common.close', { defaultValue: 'Close' })}
            onClick={() => setPlaying(false)}
            className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
          <video
            src={HERO_VIDEO}
            controls
            autoPlay
            playsInline
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-4xl rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  )
}

function SectionHeader({ title, to }: { title: string; to?: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-xl font-bold sm:text-2xl md:text-3xl">{title}</h2>
      {to && (
        <Link
          to={to}
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 sm:text-sm"
        >
          {t('home.seeAll')}
          <FontAwesomeIcon icon={faArrowRight} className="text-[10px] rtl:rotate-180" />
        </Link>
      )}
    </div>
  )
}

export default Home