import { useEffect, useMemo, useRef, useState } from 'react'
import FormCard from '../components/common/FormCard.jsx'
import Field from '../components/common/Field.jsx'
import CustomRadio from '../components/common/CustomRadio.jsx'
import PillButton from '../components/PillButton.jsx'
import {
  CATEGORY_LABELS,
  PARTICIPATION_LABELS,
  isSubmissionRateLimited,
  recordWorkSubmission,
  submitWorkSubmission,
  validateSubmission,
} from '../lib/supabase.js'

const CATEGORY_OPTIONS = [
  { value: 'drawing', label: 'رسم' },
  { value: 'design', label: 'تصميم' },
  { value: 'acting', label: 'تمثيل' },
  { value: 'singing', label: 'غناء' },
  { value: 'handmade', label: 'أعمال يدوية' },
]

const PARTICIPATION_OPTIONS = [
  { value: 'team', label: 'فريق' },
  { value: 'individual', label: 'فردي' },
]

const EMPTY = {
  student_name: '',
  category: '',
  participation_type: '',
  work_title: '',
  idea: '',
  work_link: '',
  website: '', // honeypot
}

const ORDER = ['student_name', 'category', 'participation_type', 'work_title', 'idea', 'work_link']

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => {
        const r = (n) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1
        return {
          left: `${Math.round(r(1) * 100)}%`,
          delay: `${(r(2) * 0.6).toFixed(2)}s`,
          dur: `${(1.8 + r(3) * 1.6).toFixed(2)}s`,
          rot: `${Math.round(r(4) * 720 - 360)}deg`,
          drift: `${Math.round(r(5) * 120 - 60)}px`,
          color: ['var(--lime)', '#fff', '#000', 'var(--purple)'][i % 4],
          shape: i % 3 === 0 ? 'round' : '',
        }
      }),
    [],
  )
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i
          key={i}
          className={`confetti__p ${p.shape}`}
          style={{
            left: p.left,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.dur,
            '--rot': p.rot,
            '--drift': p.drift,
          }}
        />
      ))}
    </div>
  )
}

export default function SubmissionPage() {
  const [values, setValues] = useState(EMPTY)
  const [touched, setTouched] = useState({})
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | submitting | success
  const [submitError, setSubmitError] = useState('')
  const [lockedHeight, setLockedHeight] = useState(null)
  const cardRef = useRef(null)
  const submittingRef = useRef(false)

  useEffect(() => {
    const prev = document.title
    document.title = 'تسليم العمل | Super كريتيف'
    return () => {
      document.title = prev
    }
  }, [])

  const set = (name, value) => {
    const updated = { ...values, [name]: value }
    setValues(updated)
    if (touched[name]) {
      const errs = validateSubmission(updated)
      setErrors((e) => ({ ...e, [name]: errs[name] || '' }))
    }
  }

  const blur = (name) => {
    setTouched((t) => ({ ...t, [name]: true }))
    const errs = validateSubmission(values)
    setErrors((e) => ({ ...e, [name]: errs[name] || '' }))
  }

  const isOk = (name) => touched[name] && !errors[name] && Boolean(values[name])

  async function onSubmit(e) {
    e.preventDefault()
    if (submittingRef.current || status === 'submitting') return
    setSubmitError('')

    // Honeypot: لو اتملا، نتجاهل بصمت ونوري نجاح وهمي
    if (values.website) {
      if (cardRef.current) setLockedHeight(cardRef.current.offsetHeight)
      setStatus('success')
      return
    }

    const errs = validateSubmission(values)
    setErrors(errs)
    setTouched(Object.fromEntries(ORDER.map((k) => [k, true])))

    const firstBad = ORDER.find((k) => errs[k])
    if (firstBad) {
      const el = document.getElementById(`sub-${firstBad}`)
      if (el) {
        el.focus()
      } else {
        const fallback = document.querySelector(`[name="${firstBad}"]`)
        fallback?.focus()
      }
      return
    }

    if (isSubmissionRateLimited()) {
      setSubmitError('بعتّ أعمال كتير في وقت قصير. استنى شوية وحاول تاني.')
      return
    }

    submittingRef.current = true
    setStatus('submitting')

    try {
      await submitWorkSubmission({
        student_name: values.student_name,
        category: values.category,
        participation_type: values.participation_type,
        work_title: values.work_title,
        idea: values.idea,
        work_link: values.work_link,
      })
      recordWorkSubmission()
      if (cardRef.current) setLockedHeight(cardRef.current.offsetHeight)
      setStatus('success')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setStatus('idle')
      if (err?.code === 'supabase/not-configured') {
        setSubmitError('الموقع لسه مش متوصّل بقاعدة البيانات (Supabase). كلّم المسؤول.')
      } else if (err?.message?.includes('violates check constraint') || err?.code === '23514') {
        setSubmitError('البيانات غير صالحة وفق شروط قاعدة البيانات. راجع الحقول وحاول تاني.')
      } else {
        setSubmitError('حصلت مشكلة في الإرسال. اتأكد من الإنترنت وحاول تاني.')
      }
    } finally {
      submittingRef.current = false
    }
  }

  function reset() {
    setValues(EMPTY)
    setTouched({})
    setErrors({})
    setSubmitError('')
    setLockedHeight(null)
    setStatus('idle')
  }

  const busy = status === 'submitting'

  return (
    <main className="submission-page">
      <div className="submission-hero">
        <h1 className="submission-hero__title">تسليم العمل</h1>
        <p className="submission-hero__subtitle">
          ارفع عملك على Google Drive أو YouTube وحط الرابط هنا.
        </p>
      </div>

      <div className="submission-zone">
        <img
          className="doodle doodle--submission"
          src="/images/ribbon.svg"
          alt=""
          aria-hidden="true"
        />

        <FormCard cardRef={cardRef} lockedHeight={lockedHeight} className="card--submission">
          {status === 'success' ? (
            <div className="success" role="status" aria-live="polite">
              <Confetti />
              <div className="success__badge" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="46" height="46">
                  <path
                    d="M5 12.8l4.3 4.3L19 7.4"
                    fill="none"
                    stroke="#000"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="success__title">تم استلام عملك بنجاح 🎉</h2>
              <p className="success__text">هنراجعه ونتواصل معاك قريبًا</p>
              <PillButton size="md" onClick={reset}>
                تسليم عمل آخر
              </PillButton>
            </div>
          ) : (
            <form className="form form--submission" onSubmit={onSubmit} noValidate>
              {/* 1. اسم الطالب */}
              <Field
                id="sub-student_name"
                label="اسم الطالب"
                error={errors.student_name}
                ok={isOk('student_name')}
              >
                <input
                  id="sub-student_name"
                  name="student_name"
                  type="text"
                  autoComplete="name"
                  maxLength={100}
                  value={values.student_name}
                  onChange={(e) => set('student_name', e.target.value)}
                  onBlur={() => blur('student_name')}
                  aria-invalid={Boolean(errors.student_name)}
                  aria-describedby={errors.student_name ? 'sub-student_name-err' : undefined}
                  disabled={busy}
                  required
                />
              </Field>

              {/* 2. فئة المسابقة */}
              <fieldset
                className={`field radio-group-field ${errors.category ? 'is-invalid' : ''}`}
                disabled={busy}
              >
                <legend className="field__label">فئة المسابقة</legend>
                <div
                  className="radio-group radio-group--wrap"
                  role="radiogroup"
                  aria-required="true"
                >
                  {CATEGORY_OPTIONS.map((opt, i) => (
                    <CustomRadio
                      key={opt.value}
                      id={i === 0 ? 'sub-category' : undefined}
                      name="category"
                      value={opt.value}
                      label={opt.label}
                      checked={values.category === opt.value}
                      disabled={busy}
                      onChange={() => {
                        set('category', opt.value)
                        setTouched((t) => ({ ...t, category: true }))
                      }}
                      onBlur={() => blur('category')}
                    />
                  ))}
                </div>
                {errors.category && (
                  <p className="field__error" role="alert">
                    {errors.category}
                  </p>
                )}
              </fieldset>

              {/* 3. نوع المشاركة */}
              <fieldset
                className={`field radio-group-field ${errors.participation_type ? 'is-invalid' : ''}`}
                disabled={busy}
              >
                <legend className="field__label">نوع المشاركة</legend>
                <div
                  className="radio-group"
                  role="radiogroup"
                  aria-required="true"
                >
                  {PARTICIPATION_OPTIONS.map((opt, i) => (
                    <CustomRadio
                      key={opt.value}
                      id={i === 0 ? 'sub-participation_type' : undefined}
                      name="participation_type"
                      value={opt.value}
                      label={opt.label}
                      checked={values.participation_type === opt.value}
                      disabled={busy}
                      onChange={() => {
                        set('participation_type', opt.value)
                        setTouched((t) => ({ ...t, participation_type: true }))
                      }}
                      onBlur={() => blur('participation_type')}
                    />
                  ))}
                </div>
                {errors.participation_type && (
                  <p className="field__error" role="alert">
                    {errors.participation_type}
                  </p>
                )}
              </fieldset>

              {/* 4. عنوان العمل */}
              <Field
                id="sub-work_title"
                label="عنوان العمل"
                error={errors.work_title}
                ok={isOk('work_title')}
              >
                <input
                  id="sub-work_title"
                  name="work_title"
                  type="text"
                  maxLength={100}
                  value={values.work_title}
                  onChange={(e) => set('work_title', e.target.value)}
                  onBlur={() => blur('work_title')}
                  aria-invalid={Boolean(errors.work_title)}
                  aria-describedby={errors.work_title ? 'sub-work_title-err' : undefined}
                  disabled={busy}
                  required
                />
              </Field>

              {/* 5. احكي لنا عن فكرتك */}
              <Field
                id="sub-idea"
                label="احكي لنا عن فكرتك"
                hint="ماذا يعبّر عنه عملك؟ وما علاقته بـ«الجودة في التعليم»؟"
                error={errors.idea}
                ok={isOk('idea')}
              >
                <div className="textarea-wrapper">
                  <textarea
                    id="sub-idea"
                    name="idea"
                    rows={5}
                    maxLength={1000}
                    value={values.idea}
                    onChange={(e) => set('idea', e.target.value)}
                    onBlur={() => blur('idea')}
                    aria-invalid={Boolean(errors.idea)}
                    aria-describedby={errors.idea ? 'sub-idea-err' : undefined}
                    disabled={busy}
                    required
                  />
                  <div className="char-counter" aria-live="polite">
                    {values.idea.length} / 1000
                  </div>
                </div>
              </Field>

              {/* 6. رابط العمل */}
              <Field
                id="sub-work_link"
                label="رابط العمل"
                hint="Google Drive / YouTube"
                helper="تأكد إن صلاحية الرابط تسمح للمنظمين بمشاهدة العمل."
                error={errors.work_link}
                ok={isOk('work_link')}
              >
                <input
                  id="sub-work_link"
                  name="work_link"
                  type="url"
                  dir="ltr"
                  maxLength={500}
                  value={values.work_link}
                  onChange={(e) => set('work_link', e.target.value)}
                  onBlur={() => blur('work_link')}
                  aria-invalid={Boolean(errors.work_link)}
                  aria-describedby={errors.work_link ? 'sub-work_link-err' : undefined}
                  disabled={busy}
                  required
                />
              </Field>

              {/* Honeypot */}
              <div className="hp" aria-hidden="true">
                <label>
                  Website
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={values.website}
                    onChange={(e) => setValues((v) => ({ ...v, website: e.target.value }))}
                  />
                </label>
              </div>

              {/* زر الإرسال */}
              <div className="form__submit">
                <PillButton type="submit" size="md" disabled={busy} aria-busy={busy}>
                  {busy ? (
                    <>
                      <span className="spinner" aria-hidden="true" /> جارٍ الإرسال...
                    </>
                  ) : (
                    'ســلّم العمل'
                  )}
                </PillButton>
                {submitError && (
                  <p className="submit-error" role="alert">
                    {submitError}
                  </p>
                )}
              </div>
            </form>
          )}
        </FormCard>
      </div>

      <footer className="footer">
        <span>Super كريتيف</span>
        <span aria-hidden="true">•</span>
        <span>مسابقة فنية لطلاب التعليم الفني والتكنولوجي</span>
      </footer>
    </main>
  )
}
