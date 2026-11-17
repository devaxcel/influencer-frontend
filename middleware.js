// Vercel Routing Middleware: agar koi AI agent "Accept: text/markdown" bheje to
// usay page ka markdown version do (HTML/JS ki jagah). Baaki sab ke liye kuch nahi badalta.
const BACKEND = 'https://influencer-backend.vercel.app/api/md'

export const config = {
  matcher: ['/', '/about', '/search', '/browse', '/campaigns', '/campaigns/:id', '/people/:slug'],
}

function markdownTarget(pathname) {
  if (pathname === '/' || pathname === '') return '/index.md'
  if (pathname === '/about') return '/about.md'
  if (pathname === '/search' || pathname === '/browse') return `${BACKEND}/talent`
  if (pathname === '/campaigns') return `${BACKEND}/campaigns`
  let m = pathname.match(/^\/campaigns\/([^/.]+)$/)
  if (m) return `${BACKEND}/campaigns/${m[1]}`
  m = pathname.match(/^\/people\/([^/.]+)$/)
  if (m) return `${BACKEND}/people/${m[1]}`
  return null
}

export default function middleware(request) {
  const accept = request.headers.get('accept') || ''
  if (!/text\/markdown/i.test(accept)) return // normal browser: kuch na karo
  const url = new URL(request.url)
  const target = markdownTarget(url.pathname.replace(/\/+$/, '') || '/')
  if (!target) return
  const dest = new URL(target, url.origin)
  return new Response(null, { headers: { 'x-middleware-rewrite': dest.toString() } })
}
