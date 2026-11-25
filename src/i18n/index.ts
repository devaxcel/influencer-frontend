import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ur from './locales/ur.json'
import ar from './locales/ar.json'

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ur', label: 'اردو' },
  { code: 'ar', label: 'العربية' },
] as const

const STORAGE_KEY = 'lang'

// URL ka prefix: /ur/about aur /ar/about. English bina prefix ke (/about).
// Prefix router ka basename banta hai, is liye app ke saare links khud /ur/... ban jate hain
const PREFIX_RE = /^\/(ur|ar)(?=\/|$)/

export function urlLanguage(pathname: string): 'ur' | 'ar' | null {
  const match = PREFIX_RE.exec(pathname)
  return match ? (match[1] as 'ur' | 'ar') : null
}

export function stripLanguagePrefix(pathname: string) {
  return pathname.replace(PREFIX_RE, '') || '/'
}

// Router ka basename (pehle load pe URL se tay hota hai)
export const URL_LANGUAGE = typeof window === 'undefined' ? null : urlLanguage(window.location.pathname)
export const ROUTER_BASENAME = URL_LANGUAGE ? `/${URL_LANGUAGE}` : undefined

function savedLanguage() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? 'en'
  } catch {
    return 'en'
  }
}

// Zaban URL se: /ur/... = Urdu, /ar/... = Arabic, baqi English (crawlers ko hamesha wohi URL ki zaban milti hai).
// Jis ne pehle Urdu / Arabic chuni thi wo bina prefix ke URL kholay to usay us zaban ke URL pe le jao
function initialLanguage() {
  if (URL_LANGUAGE) return URL_LANGUAGE
  const saved = savedLanguage()
  if ((saved === 'ur' || saved === 'ar') && typeof window !== 'undefined') {
    const { pathname, search, hash } = window.location
    if (!pathname.startsWith('/api/')) {
      window.location.replace(`/${saved}${pathname === '/' ? '' : pathname}${search}${hash}`)
    }
  }
  return 'en'
}

export function saveLanguage(code: string) {
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // Private window waghera: sirf is session ke liye
  }
}

// Urdu aur Arabic right-to-left hain; i18n.dir() khud batata hai
i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ur: { translation: ur }, ar: { translation: ar } },
  lng: initialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

// Poori site ki zaban aur disha: <html lang="ur" dir="rtl">
function applyLanguage(code: string) {
  document.documentElement.lang = code
  document.documentElement.dir = i18n.dir(code)
}
applyLanguage(i18n.language)
i18n.on('languageChanged', applyLanguage)

// Zaban badalna = us zaban ke URL pe jana (/about -> /ur/about); page dobara load hota hai
export function changeLanguage(code: string) {
  saveLanguage(code)
  if (typeof window === 'undefined') return i18n.changeLanguage(code)
  const { pathname, search, hash } = window.location
  const path = stripLanguagePrefix(pathname)
  const prefix = code === 'ur' || code === 'ar' ? `/${code}` : ''
  window.location.assign(`${prefix}${path === '/' && prefix ? '' : path}${search}${hash}` || '/')
  return Promise.resolve()
}

export default i18n
