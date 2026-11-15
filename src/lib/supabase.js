import { createClient } from '@supabase/supabase-js'

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (typeof process !== 'undefined' && process.env ? process.env : {})

export const supabaseUrl = env.VITE_SUPABASE_URL || ''
export const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

export const CATEGORY_LABELS = {
  drawing: 'رسم',
  design: 'تصميم',
  acting: 'تمثيل',
  singing: 'غناء',
  handmade: 'أعمال يدوية',
}

export const PARTICIPATION_LABELS = {
  team: 'فريق',
  individual: 'فردي',
}

export const SUBMISSION_RATE_LIMIT_KEY = 'sc_submissions_timestamps'

export function isSubmissionRateLimited(maxSubmits = 3, windowMs = 10 * 60 * 1000) {
  try {
    const raw = localStorage.getItem(SUBMISSION_RATE_LIMIT_KEY)
    if (!raw) return false
    const now = Date.now()
    const list = JSON.parse(raw).filter((ts) => now - ts < windowMs)
    return list.length >= maxSubmits
  } catch {
    return false
  }
}

export function recordWorkSubmission(windowMs = 10 * 60 * 1000) {
  try {
    const raw = localStorage.getItem(SUBMISSION_RATE_LIMIT_KEY)
    const now = Date.now()
    const list = raw ? JSON.parse(raw).filter((ts) => now - ts < windowMs) : []
    list.push(now)
    localStorage.setItem(SUBMISSION_RATE_LIMIT_KEY, JSON.stringify(list))
  } catch {
    // ignore local storage errors
  }
}

export const WORK_LINK_REGEX = /^https:\/\/(drive\.google\.com|docs\.google\.com|(www\.)?youtube\.com|youtu\.be)\/.+/i

export function validateSubmission(values) {
  const errors = {}

  const studentName = (values.student_name || '').trim()
  if (!studentName) {
    errors.student_name = 'اكتب اسم الطالب'
  } else if (studentName.length < 3) {
    errors.student_name = 'اسم الطالب يجب أن يكون 3 أحرف على الأقل'
  } else if (studentName.length > 100) {
    errors.student_name = 'اسم الطالب طويل جدًا (حد أقصى 100 حرف)'
  }

  if (!values.category) {
    errors.category = 'اختر فئة المسابقة'
  } else if (!CATEGORY_LABELS[values.category]) {
    errors.category = 'فئة المسابقة غير صالحة'
  }

  if (!values.participation_type) {
    errors.participation_type = 'اختر نوع المشاركة'
  } else if (!PARTICIPATION_LABELS[values.participation_type]) {
    errors.participation_type = 'نوع المشاركة غير صالح'
  }

  const workTitle = (values.work_title || '').trim()
  if (!workTitle) {
    errors.work_title = 'اكتب عنوان العمل'
  } else if (workTitle.length < 2) {
    errors.work_title = 'عنوان العمل يجب أن يكون حرفين على الأقل'
  } else if (workTitle.length > 100) {
    errors.work_title = 'عنوان العمل طويل جدًا (حد أقصى 100 حرف)'
  }

  const idea = (values.idea || '').trim()
  if (!idea) {
    errors.idea = 'احكي لنا عن فكرتك'
  } else if (idea.length < 20) {
    errors.idea = 'الفكرة يجب أن تكون 20 حرفًا على الأقل'
  } else if (idea.length > 1000) {
    errors.idea = 'الفكرة طويلة جدًا (حد أقصى 1000 حرف)'
  }

  const workLink = (values.work_link || '').trim()
  if (!workLink) {
    errors.work_link = 'اكتب رابط العمل'
  } else if (workLink.length > 500) {
    errors.work_link = 'الرابط طويل جدًا (حد أقصى 500 حرف)'
  } else if (!WORK_LINK_REGEX.test(workLink)) {
    errors.work_link = 'من فضلك ادخل رابط Google Drive أو YouTube صحيح'
  }

  return errors
}

export async function submitWorkSubmission(payload) {
  if (!isSupabaseConfigured || !supabase) {
    const err = new Error('supabase-not-configured')
    err.code = 'supabase/not-configured'
    throw err
  }

  const cleaned = {
    student_name: payload.student_name.trim(),
    category: payload.category,
    participation_type: payload.participation_type,
    work_title: payload.work_title.trim(),
    idea: payload.idea.trim(),
    work_link: payload.work_link.trim(),
  }

  const { data, error } = await supabase.from('submissions').insert([cleaned]).select()

  if (error) {
    throw error
  }

  return data
}

export async function getSubmissions() {
  if (!isSupabaseConfigured || !supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}

export async function deleteSubmission(id) {
  if (!isSupabaseConfigured || !supabase) {
    const err = new Error('supabase-not-configured')
    throw err
  }

  const { error } = await supabase.from('submissions').delete().eq('id', id)
  if (error) {
    throw error
  }
}
