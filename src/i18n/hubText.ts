import i18n from './index'

// /talent aur /talent/<category>/<country> pages ke labels (English / Urdu / Arabic)
const TEXT = {
  indexTitle: {
    en: 'Hire talent by profession, industry and country',
    ur: 'پیشے، صنعت اور ملک کے لحاظ سے ٹیلنٹ ہائر کریں',
    ar: 'وظّف المواهب حسب المهنة والمجال والبلد',
  },
  indexLead: {
    en: 'Browse verified creators, journalists, speakers and experts by what they do and where they are.',
    ur: 'تصدیق شدہ تخلیق کار، صحافی، مقررین اور ماہرین کو ان کے کام اور مقام کے لحاظ سے دیکھیں۔',
    ar: 'تصفّح صنّاع محتوى وصحفيين ومتحدثين وخبراء موثّقين حسب ما يعملون وأين يوجدون.',
  },
  worldwide: { en: 'worldwide', ur: 'دنیا بھر', ar: 'حول العالم' },
  talent: { en: 'talent', ur: 'ٹیلنٹ', ar: 'مواهب' },
  inCountry: { en: 'in', ur: 'میں', ar: 'في' },
  profiles: { en: 'profiles', ur: 'پروفائل', ar: 'ملف' },
  verified: { en: 'verified', ur: 'تصدیق شدہ', ar: 'موثّق' },
  openToWork: { en: 'open to work', ur: 'کام کے لیے دستیاب', ar: 'متاح للعمل' },
  followers: { en: 'followers', ur: 'فالوورز', ar: 'متابع' },
  faq: { en: 'Frequently asked questions', ur: 'اکثر پوچھے جانے والے سوالات', ar: 'الأسئلة الشائعة' },
  allTalent: { en: 'See all talent', ur: 'تمام ٹیلنٹ دیکھیں', ar: 'عرض كل المواهب' },
  notFound: { en: 'This talent page does not exist.', ur: 'یہ ٹیلنٹ پیج موجود نہیں۔', ar: 'صفحة المواهب هذه غير موجودة.' },
  loading: { en: 'Loading…', ur: 'لوڈ ہو رہا ہے…', ar: 'جارٍ التحميل…' },
  noPeople: { en: 'No profiles yet.', ur: 'ابھی کوئی پروفائل نہیں۔', ar: 'لا توجد ملفات بعد.' },
} as const

export type HubTextKey = keyof typeof TEXT

export function hubText(key: HubTextKey) {
  const lang = (i18n.language in TEXT[key] ? i18n.language : 'en') as 'en' | 'ur' | 'ar'
  return TEXT[key][lang]
}
