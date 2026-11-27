import { useState } from 'react'

// Profile ke upar ka banner. Talent ka apna banner (agar ho) warna Influnexa ka aam banner (public/brand/profile-banner.webp:
// "INFLUENCER" wali tasveer, bayen taraf usi kaghaz ke rang mein badhaya hua taake chaure parde pe bhi saaf lage)
const DEFAULT_BANNER = '/brand/profile-banner.webp'

export function CoverImage({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false)
  const custom = Boolean(src) && !failed

  return (
    <>
      <img
        src={custom ? src : DEFAULT_BANNER}
        alt=""
        aria-hidden="true"
        loading="eager"
        onError={() => setFailed(true)}
        // Aam banner: tasveer dayen taraf hai, is liye wahin se dikhao (mobile pe bhi). Talent ka apna banner beech se
        style={{ objectPosition: custom ? 'center' : '92% 72%' }}
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      {/* Talent ke apne banner pe neeche halka andhera, taake photo aur badges saaf dikhein. Aam banner already halka hai */}
      {custom && <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />}
    </>
  )
}

export default CoverImage
