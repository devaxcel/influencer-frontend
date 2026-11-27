import i18n from '../i18n'

// 1170000 -> "1.17M", 3400000 -> "3.4M" (chuni hui zaban ke andaaz mein). Do ashariya tak: pehle 1.17M "1.2M" ban jata tha
// aur asal (YouTube pe 1.17M) se alag dikhta tha
export function formatCount(value: number) {
  return new Intl.NumberFormat(i18n.language, {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value)
}

const countryNames = () => new Intl.DisplayNames([i18n.language], { type: 'region' })
const languageNames = () => new Intl.DisplayNames([i18n.language], { type: 'language' })

// "PK" -> "Pakistan" / "پاکستان"
export function countryName(code?: string) {
  if (!code) return ''
  try {
    return countryNames().of(code) ?? code
  } catch {
    return code
  }
}

// "ur" -> "Urdu"
export function languageName(code: string) {
  try {
    return languageNames().of(code) ?? code
  } catch {
    return code
  }
}

// "Sana Rafiq" -> "SR"
export function initials(name: string) {
  return name
    .replace(/^(dr|mr|mrs|ms)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
