import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShieldHalved, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { getCaptchaConfig } from '../api/auth'

declare global {
  interface Window {
    grecaptcha?: {
      // api.js load hone ke baad asal code alag file se aata hai: ready() usi ka intezaar karta hai
      ready?: (callback: () => void) => void
      render: (container: HTMLElement, options: {
        sitekey: string
        callback: (token: string) => void
        'expired-callback': () => void
        'error-callback': () => void
        theme?: 'light' | 'dark'
      }) => number
      reset: (widgetId?: number) => void
    }
  }
}

// google.com pehle, na chale to recaptcha.net (wahi service; kuch networks / mulkon mein google.com ka script band hota hai)
const SCRIPT_SRCS = ['https://www.google.com/recaptcha/api.js?render=explicit', 'https://www.recaptcha.net/recaptcha/api.js?render=explicit']
let scriptPromise: Promise<void> | null = null
const TEST_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'

function loadOne(src: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      script.remove()
      reject(new Error(`reCAPTCHA script failed to load: ${src}`))
    }
    document.head.appendChild(script)
  })
}

function loadScript() {
  if (window.grecaptcha?.render) return Promise.resolve()
  scriptPromise ??= (async () => {
    let lastError: unknown
    for (const src of SCRIPT_SRCS) {
      try {
        await loadOne(src)
        // api.js ke baad grecaptcha.render turant maujood nahi hota (dusri file aati hai): ready() ka intezaar
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('reCAPTCHA did not become ready')), 10_000)
          const done = () => {
            clearTimeout(timer)
            resolve()
          }
          if (window.grecaptcha?.render) done()
          else if (window.grecaptcha?.ready) window.grecaptcha.ready(done)
          else {
            clearTimeout(timer)
            reject(new Error('reCAPTCHA is not available'))
          }
        })
        return
      } catch (error) {
        lastError = error
      }
    }
    scriptPromise = null
    throw lastError
  })()
  return scriptPromise
}

function RecaptchaCheckbox({
  onToken,
  onEnabled,
  resetKey = 0,
}: {
  onToken: (token: string | null) => void
  onEnabled?: (enabled: boolean) => void
  resetKey?: number
}) {
  const container = useRef<HTMLDivElement>(null)
  const widgetId = useRef<number | null>(null)
  const [failed, setFailed] = useState(false)
  const [scriptReady, setScriptReady] = useState(false)
  const [checked, setChecked] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const { data } = useQuery({
    queryKey: ['auth', 'captcha-config'],
    queryFn: getCaptchaConfig,
    staleTime: Infinity,
    retry: 1,
  })
  
  const effectiveSiteKey =
    data?.siteKey ||
    ((import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined)?.trim()) ||
    TEST_SITE_KEY

  useEffect(() => {
    onEnabled?.(Boolean(effectiveSiteKey))
  }, [effectiveSiteKey, onEnabled])

  // Script 12 second mein na aaye to "load nahi hua" dikhao (dono addresses try ho chuke hote hain)
  useEffect(() => {
    if (!effectiveSiteKey) return
    const timer = setTimeout(() => {
      if (!scriptReady) setLoadingTimeout(true)
    }, 12_000)
    return () => clearTimeout(timer)
  }, [effectiveSiteKey, scriptReady, attempt])

  useEffect(() => {
    if (!effectiveSiteKey || !container.current) return
    let cancelled = false
    loadScript()
      .then(() => {
        if (cancelled || !container.current || !window.grecaptcha) return
        container.current.innerHTML = ''
        widgetId.current = window.grecaptcha.render(container.current, {
          sitekey: effectiveSiteKey,
          callback: (token) => onToken(token),
          'expired-callback': () => onToken(null),
          'error-callback': () => onToken(null),
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        })
        setScriptReady(true)
      })
      .catch(() => setFailed(true))
    return () => {
      cancelled = true
    }
  }, [effectiveSiteKey, onToken, attempt])

  useEffect(() => {
    if (resetKey > 0 && widgetId.current !== null) {
      window.grecaptcha?.reset(widgetId.current)
      onToken(null)
      setChecked(false)
    }
  }, [resetKey, onToken])

  if (!effectiveSiteKey) return null

  const loading = !scriptReady && !failed && !loadingTimeout
  const broken = (failed || loadingTimeout) && !scriptReady

  // Widget ka container hamesha DOM mein rehta hai (loading ke dauran chhupa hua): pehle ye sirf aakhri
  // branch mein tha, is liye script aane par widget kahin render hi nahi ho pata tha aur 5 second baad
  // nakli "fallback" checkbox aa jata tha, jis ka token production mein kabhi pass nahi hota
  return (
    <div>
      {loading && (
        <div className="flex min-h-[78px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-500 shadow-sm">
          <FontAwesomeIcon icon={faSpinner} spin className="me-2 text-brand" />
          Loading security check...
        </div>
      )}

      {broken && !import.meta.env.DEV && (
        <div className="flex min-h-[78px] flex-col justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>The security check could not load. Check your connection, turn off any ad or privacy blocker for this site, then try again.</span>
          <button
            type="button"
            onClick={() => {
              scriptPromise = null
              setFailed(false)
              setLoadingTimeout(false)
              setScriptReady(false)
              setAttempt((n) => n + 1)
            }}
            className="self-start rounded-lg border border-amber-300 bg-white px-3 py-1 font-medium hover:bg-amber-100"
          >
            Try again
          </button>
        </div>
      )}

      {/* Sirf local development: backend wahan nakli token maanta hai (production mein nahi) */}
      {broken && import.meta.env.DEV && (
        <label className="group flex min-h-[78px] cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 shadow-sm transition hover:border-brand/50 hover:bg-brand/5">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => {
              const next = event.target.checked
              setChecked(next)
              onToken(next ? 'browser-recaptcha-fallback' : null)
            }}
            className="h-5 w-5 accent-brand"
          />
          <div className="flex flex-col">
            <span className="font-medium">I am not a robot</span>
            <span className="text-[10px] text-gray-400">Development fallback</span>
          </div>
          <FontAwesomeIcon icon={faShieldHalved} className="ms-auto text-xl text-gray-300 group-hover:text-brand" />
        </label>
      )}

      <div className={scriptReady ? 'rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800' : 'hidden'}>
        <div ref={container} className="flex min-h-[78px] items-center justify-center overflow-hidden" aria-label="reCAPTCHA" />
      </div>
    </div>
  )
}

export default RecaptchaCheckbox