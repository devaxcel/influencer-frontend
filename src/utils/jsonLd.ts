import { useEffect } from 'react'
import type { Person } from '../types/person'
import type { Pricing } from '../types/services'

// Search engines aur AI agents ke liye structured data (schema.org JSON-LD).
// Page khulte hi <head> mein script lagti hai, page band hote hi hat jaati hai.

export const SITE_URL = 'https://influnexa.com'
const ORG_ID = `${SITE_URL}/#organization`

type JsonLd = Record<string, unknown>

export function useJsonLd(id: string, data: JsonLd | null) {
  const json = data ? JSON.stringify(data) : null
  useEffect(() => {
    if (!json) return
    let el = document.getElementById(id) as HTMLScriptElement | null
    if (!el) {
      el = document.createElement('script')
      el.type = 'application/ld+json'
      el.id = id
      document.head.appendChild(el)
    }
    el.textContent = json
    return () => el?.remove()
  }, [id, json])
}

// index.html mein home ka FAQ pehle se hai (bina JS wale agents ke liye).
// App chalte hi usay hata do, Home page apna (chuni hui zaban mein) khud lagata hai.
export function removeStaticPageJsonLd() {
  document.getElementById('ld-faq-home')?.remove()
}

export function faqJsonLd(rows: { q: string; a: string }[], language: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: language,
    mainEntity: rows.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

const UNIT_TEXT: Record<Pricing['unit'], string> = {
  project: 'per project',
  event: 'per event',
  post: 'per post',
  hour: 'per hour',
  day: 'per day',
}

function offerPrice(pricing: Pricing): JsonLd {
  const unitText = UNIT_TEXT[pricing.unit]
  if (pricing.type === 'fixed' && pricing.amount !== undefined) {
    return {
      price: pricing.amount,
      priceCurrency: pricing.currency,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: pricing.amount,
        priceCurrency: pricing.currency,
        unitText,
      },
    }
  }
  if (pricing.type === 'range' && pricing.min !== undefined && pricing.max !== undefined) {
    return {
      priceCurrency: pricing.currency,
      priceSpecification: {
        '@type': 'PriceSpecification',
        minPrice: pricing.min,
        maxPrice: pricing.max,
        priceCurrency: pricing.currency,
        unitText,
      },
    }
  }
  // Price on request: daam nahi likhte, sirf bata dete hain
  return { description: `Price on request (${unitText})` }
}

// Profile page: kaun hai, kitni reach, kya services aur kaise book karein
export function profileJsonLd(person: Person, language: string): JsonLd {
  const url = `${SITE_URL}/people/${person.slug}`
  const personId = `${url}#person`
  const accounts = person.socialAccounts ?? []
  const services = (person.services ?? []).filter((service) => service.isActive)
  const isOpen = person.status === 'hireable' || Boolean(person.availability?.isOpen)

  const personNode: JsonLd = {
    '@type': 'Person',
    '@id': personId,
    name: person.name,
    url,
    ...(person.headline && { description: person.headline }),
    ...(person.photoUrl && { image: person.photoUrl }),
    ...(person.professions.length && { jobTitle: person.professions.map((p) => p.name).join(', ') }),
    ...(person.topics?.length && { knowsAbout: person.topics.map((p) => p.name) }),
    ...(person.languages?.length && { knowsLanguage: person.languages }),
    ...((person.city || person.country) && {
      address: {
        '@type': 'PostalAddress',
        ...(person.city && { addressLocality: person.city }),
        ...(person.country && { addressCountry: person.country }),
      },
    }),
    ...(accounts.length || person.websiteUrl
      ? { sameAs: [person.websiteUrl, ...accounts.map((a) => a.url)].filter(Boolean) }
      : {}),
    ...(accounts.some((a) => a.followers) && {
      interactionStatistic: accounts
        .filter((a) => a.followers)
        .map((a) => ({
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/FollowAction',
          userInteractionCount: a.followers,
          ...(a.url && { url: a.url }),
        })),
    }),
  }

  const graph: JsonLd[] = [
    {
      '@type': 'ProfilePage',
      '@id': url,
      url,
      name: `${person.name} | Influnexa`,
      inLanguage: language,
      dateModified: person.updatedAt,
      mainEntity: { '@id': personId },
      isPartOf: { '@id': `${SITE_URL}/#website` },
    },
    personNode,
  ]

  // Reviews sirf asal (mukammal kaam) se aati hain; koi review na ho to rating nahi likhte
  const rating =
    person.rating && person.rating.count > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: Number(person.rating.average.toFixed(1)),
          ratingCount: person.rating.count,
          bestRating: 5,
          worstRating: 1,
        }
      : null

  if (services.length || rating) {
    graph.push({
      '@type': 'Service',
      '@id': `${url}#services`,
      name: `${person.name}: services`,
      provider: { '@id': personId },
      broker: { '@id': ORG_ID },
      url,
      ...(rating && { aggregateRating: rating }),
      ...(services.length && {
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: `Services by ${person.name}`,
          itemListElement: services.map((service) => ({
            '@type': 'Offer',
            name: service.title,
            ...(service.description && { description: service.description }),
            url,
            availability: isOpen ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
            ...offerPrice(service.pricing),
            ...(service.deliveryDays && {
              deliveryLeadTime: {
                '@type': 'QuantitativeValue',
                value: service.deliveryDays,
                unitCode: 'DAY',
              },
            }),
          })),
        },
      }),
      potentialAction: [
        {
          '@type': 'ReserveAction',
          name: `Hire ${person.name}`,
          target: {
            '@type': 'EntryPoint',
            urlTemplate: url,
            actionPlatform: [
              'https://schema.org/DesktopWebPlatform',
              'https://schema.org/MobileWebPlatform',
            ],
          },
        },
        {
          '@type': 'CommunicateAction',
          name: `Ask about ${person.name}`,
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/api/inquiries`,
            httpMethod: 'POST',
            contentType: 'application/json',
          },
        },
      ],
    })
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}
