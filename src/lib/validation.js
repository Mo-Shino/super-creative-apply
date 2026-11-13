export const TALENT_OPTIONS = [
  'رسم',
  'تصميم',
  'غناء',
  'تصوير',
  'هاند ميد',
  'تمثيل',
]

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'
const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

/** يحوّل الأرقام العربي/الفارسي لإنجليزي ويشيل أي رموز غير الأرقام و+ */
export function normalizePhone(raw = '') {
  let s = String(raw)
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[\s\-().]/g, '')
  if (s.startsWith('+20')) s = '0' + s.slice(3)
  else if (s.startsWith('0020')) s = '0' + s.slice(4)
  else if (/^20\d{10}$/.test(s)) s = '0' + s.slice(2)
  return s
}

export const clean = (v = '') => String(v).replace(/\s+/g, ' ').trim()

/** كل دالة بترجّع رسالة خطأ بالعربي أو '' لو سليمة */
export const rules = {
  fullName(v) {
    const s = clean(v)
    if (!s) return 'اكتب اسمك بالكامل'
    if (s.length < 3) return 'الاسم قصير أوي'
    if (s.split(' ').length < 2) return 'اكتب اسمك الثنائي على الأقل'
    if (s.length > 100) return 'الاسم طويل أوي (الحد الأقصى 100 حرف)'
    return ''
  },
  phone(v) {
    const s = normalizePhone(v)
    if (!s) return 'اكتب رقم الواتساب'
    if (!/^01[0125]\d{8}$/.test(s)) return 'رقم غير صحيح، لازم 11 رقم ويبدأ بـ 01'
    return ''
  },
  school(v) {
    const s = clean(v)
    if (!s) return 'اكتب اسم المدرسة'
    if (s.length < 2) return 'اسم المدرسة قصير أوي'
    if (s.length > 100) return 'الاسم طويل أوي (الحد الأقصى 100 حرف)'
    return ''
  },
  grade(v) {
    const s = clean(v)
    if (!s) return 'اكتب الصف الدراسي'
    if (s.length > 30) return 'الحد الأقصى 30 حرف'
    return ''
  },
  talent(v) {
    if (!v) return 'اختار المجال اللي هتقدّم فيه'
    if (!TALENT_OPTIONS.includes(v)) return 'اختار مجال من القائمة'
    return ''
  },
  consent(v) {
    return v ? '' : 'لازم توافق عشان تكمّل'
  },
}

export function validateAll(values) {
  const errors = {}
  for (const key of Object.keys(rules)) {
    const msg = rules[key](values[key])
    if (msg) errors[key] = msg
  }
  return errors
}

/* حماية بسيطة من الإرسال المتكرر: 3 طلبات كل 10 دقايق من نفس المتصفح */
const LS_KEY = 'sc_submits'
const WINDOW_MS = 10 * 60 * 1000
const MAX_SUBMITS = 3

function readTimes() {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
    return arr.filter((t) => Date.now() - t < WINDOW_MS)
  } catch {
    return []
  }
}

export function isRateLimited() {
  return readTimes().length >= MAX_SUBMITS
}

export function recordSubmit() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...readTimes(), Date.now()]))
  } catch {
    /* التخزين مش متاح — مش مشكلة */
  }
}
