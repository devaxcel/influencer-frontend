import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShieldHalved, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { getCaptchaConfig } from '../api/auth'

declare global {
  interface Window {
    grecaptcha?: {
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

const SCRIPT_SRC = 'https://www.google.com/recaptcha/api.js'
let scriptPromise: Promise<void> | null = null
const TEST_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'

function loadScript() {
  if (window.grecaptcha?.render) return Promise.resolve()
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('reCAPTCHA script failed to load'))
    }
    document.head.appendChild(script)
  })
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
  const [loadingTimeout, setLoadingTimeout] = useState(false) // ✅ Naya state

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

  // ✅ Timeout: Agar 5 second mein script load na ho to fallback dikhao
  useEffect(() => {
    if (!effectiveSiteKey) return
    const timer = setTimeout(() => {
      if (!scriptReady) setLoadingTimeout(true)
    }, 5000)
    return () => clearTimeout(timer)
  }, [effectiveSiteKey, scriptReady])

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
  }, [effectiveSiteKey, onToken])

  useEffect(() => {
    if (resetKey > 0 && widgetId.current !== null) {
      window.grecaptcha?.reset(widgetId.current)
      onToken(null)
      setChecked(false)
    }
  }, [resetKey, onToken])

  if (!effectiveSiteKey) return null

  // ✅ Loading State (Spinner)
  if (!scriptReady && !failed && !loadingTimeout) {
    return (
      <div className="flex min-h-[78px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-500 shadow-sm">
        <FontAwesomeIcon icon={faSpinner} spin className="me-2 text-brand" />
        Loading security check...
      </div>
    )
  }

  // ✅ Fallback State (Agar script fail ho jaye ya timeout ho)
  if (failed || loadingTimeout) {
    return (
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
          <span className="text-[10px] text-gray-400">Security fallback</span>
        </div>
        <FontAwesomeIcon icon={faShieldHalved} className="ms-auto text-xl text-gray-300 group-hover:text-brand" />
      </label>
    )
  }

  // ✅ Real reCAPTCHA Widget
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div ref={container} className="flex min-h-[78px] items-center justify-center overflow-hidden" aria-label="reCAPTCHA" />
    </div>
  )
}

export default RecaptchaCheckbox