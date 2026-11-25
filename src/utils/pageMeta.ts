import { useEffect } from 'react'

// Server pehle load pe sahi title/description deta hai (backend /api/seo/people/:slug).
// Ye sirf website ke andar ek page se doosre pe jaane (SPA navigation) pe tab ka title badalta hai.

const TITLE_MAX = 60

// Backend (buildProfileTitle) wala hi qaida: "Name: Profession | Reach & Hire | Influnexa"
export function profileTitle(name: string, profession?: string, brand = 'Influnexa') {
  const options = [
    profession ? `${name}: ${profession} | Reach & Hire | ${brand}` : `${name} | Reach & Hire | ${brand}`,
    profession ? `${name} | ${profession} | ${brand}` : '',
    `${name} | ${brand}`,
  ].filter(Boolean)
  return options.find((option) => option.length <= TITLE_MAX) ?? options[options.length - 1]
}

export function usePageMeta(title?: string | null, description?: string | null) {
  useEffect(() => {
    if (!title) return
    const previousTitle = document.title
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const previousDescription = meta?.getAttribute('content') ?? null
    document.title = title
    if (description && meta) meta.setAttribute('content', description)
    return () => {
      document.title = previousTitle
      if (meta && previousDescription !== null) meta.setAttribute('content', previousDescription)
    }
  }, [title, description])
}
