import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faCircleCheck, faFire } from '@fortawesome/free-solid-svg-icons'
import { taxName } from '../../utils/taxonomy'
import { formatCount } from '../../utils/format'
import type { PersonSummary } from '../../types/person'
import { Photo } from './HomeSections'

// Home page ka bara profile card (Most followed aur Featured this week dono mein). `hot` = is hafte ke asal maqbool profile
export function ProfileTile({ person, hot = false }: { person: PersonSummary; hot?: boolean }) {
  const { t } = useTranslation()
  const sub =
    person.totalFollowers > 0
      ? t('site.followers', { value: formatCount(person.totalFollowers) })
      : person.professions[0]
        ? taxName(person.professions[0])
        : ''
  return (
    <Link
      to={`/people/${person.slug}`}
      className="group keep-dark relative block aspect-[4/5] overflow-hidden rounded-3xl bg-brand-plum text-white shadow-lg transition duration-500 hover:-translate-y-2 hover:shadow-2xl"
    >
      <Photo person={person} className="h-full w-full transition duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      {hot && (
        <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-gray-900 shadow sm:start-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs">
          <FontAwesomeIcon icon={faFire} />
          {t('home.popularThisWeek', { defaultValue: 'Popular this week' })}
        </span>
      )}
      {person.totalFollowers > 0 && (
        <span className="absolute end-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-gray-900 shadow sm:end-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs">
          {sub}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <p className="flex items-center gap-1.5 font-display text-sm font-bold sm:gap-2 sm:text-lg">
          <span className="truncate">{person.name}</span>
          {person.verified && <FontAwesomeIcon icon={faCircleCheck} className="text-xs text-brand-sun sm:text-sm" />}
        </p>
        {person.headline && <p className="mt-1 line-clamp-1 text-[11px] text-white/80 sm:text-sm">{person.headline}</p>}
        <span className="mt-2 inline-flex translate-y-3 items-center gap-2 text-xs font-semibold opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:mt-3 sm:text-sm">
          {t('home.viewProfile', { defaultValue: 'View profile' })}
          <FontAwesomeIcon icon={faArrowRight} className="text-[10px] rtl:rotate-180 sm:text-xs" />
        </span>
      </div>
    </Link>
  )
}

export default ProfileTile
