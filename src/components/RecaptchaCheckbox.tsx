import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  if (!scriptReady || failed) {
    return (
      <label className="flex min-h-[78px] items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 shadow-sm">
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
        <span>I am not a robot</span>
        <span className="ms-auto text-[10px] font-bold text-gray-400">reCAPTCHA</span>
      </label>
    )
  }
  return <div ref={container} className="flex min-h-[78px] items-center overflow-hidden" aria-label="reCAPTCHA" />
}

export default RecaptchaCheckbox
