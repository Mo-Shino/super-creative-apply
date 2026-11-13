import { useMemo, useRef, useState } from 'react'
import PillButton from './PillButton.jsx'
import { submitRegistration } from '../lib/firebase.js'
import {
  TALENT_OPTIONS,
  clean,
  isRateLimited,
  normalizePhone,
  recordSubmit,
  rules,
  validateAll,
} from '../lib/validation.js'

const EMPTY = {
  fullName: '',
  phone: '',
  school: '',
  grade: '',
  talent: '',
  consent: false,
  website: '', // honeypot — لازم يفضل فاضي
}

const ORDER = ['fullName', 'phone', 'school', 'grade', 'talent', 'consent']
const DOTS = Array.from({ length: 14 }, (_, i) => i)

function Check() {
  return (
    <span className="field__ok" aria-hidden="true">
      <svg viewBox="0 0 20 20" width="14" height="14">
        <path d="M4.5 10.5l3.6 3.6L15.5 6.5" fill="none" stroke="#000" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function Field({ id, label, hint, error, ok, children }) {
  return (
    <div className={`field ${error ? 'is-invalid' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
        {hint && <span className="field__hint"> : {hint}</span>}
      </label>
      <div className="field__control">
        {children}
        {ok && <Check />}
      </div>
      {error && (
        <p className="field__error" id={`${id}-err`} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

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
          style={{ left: p.left, background: p.color, animationDelay: p.delay, animationDuration: p.dur, '--rot': p.rot, '--drift': p.drift }}
        />
      ))}
    </div>
  )
}

export default function ApplyForm() {
  const [values, setValues] = useState(EMPTY)
  const [touched, setTouched] = useState({})
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | submitting | success
  const [submitError, setSubmitError] = useState('')
  const [lockedHeight, setLockedHeight] = useState(null)
  const cardRef = useRef(null)
  const submittingRef = useRef(false)

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }))
    if (touched[name]) setErrors((e) => ({ ...e, [name]: rules[name]?.(value) || '' }))
  }

  const blur = (name) => {
    setTouched((t) => ({ ...t, [name]: true }))
    setErrors((e) => ({ ...e, [name]: rules[name]?.(values[name]) || '' }))
  }

  const isOk = (name) => touched[name] && !errors[name] && Boolean(values[name])

  async function onSubmit(e) {
    e.preventDefault()
    if (submittingRef.current || status === 'submitting') return
    setSubmitError('')

    // Honeypot: لو اتملا، نتجاهل بصمت ونوري نجاح وهمي
    if (values.website) {
      setStatus('success')
      return
    }

    const errs = validateAll(values)
    setErrors(errs)
    setTouched(Object.fromEntries(ORDER.map((k) => [k, true])))
    const firstBad = ORDER.find((k) => errs[k])
    if (firstBad) {
      document.getElementById(`f-${firstBad}`)?.focus()
      return
    }

    if (isRateLimited()) {
      setSubmitError('بعتّ طلبات كتير في وقت قصير. استنى شوية وحاول تاني.')
      return
    }

    submittingRef.current = true
    setStatus('submitting')
    try {
      await submitRegistration({
        fullName: clean(values.fullName),
        phone: normalizePhone(values.phone),
        school: clean(values.school),
        grade: clean(values.grade),
        talent: values.talent,
        consent: true,
      })
      recordSubmit()
      if (cardRef.current) setLockedHeight(cardRef.current.offsetHeight)
      setStatus('success')
      document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (err) {
      setStatus('idle')
      if (err?.code === 'app/not-configured') {
        setSubmitError('الموقع لسه مش متوصّل بقاعدة البيانات. كلّم المسؤول.')
      } else if (err?.code === 'permission-denied') {
        setSubmitError('البيانات مش مقبولة. راجع الحقول وحاول تاني.')
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
    <div className="card" ref={cardRef} style={lockedHeight ? { minHeight: lockedHeight } : undefined}>
      <img className="card__pin" src="/images/pin.webp" alt="" aria-hidden="true" width="420" height="502" />
      <div className="card__dots" aria-hidden="true">
        {DOTS.map((d) => (
          <i key={d} />
        ))}
      </div>

      {status === 'success' ? (
        <div className="success" role="status" aria-live="polite">
          <Confetti />
          <div className="success__badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="46" height="46">
              <path d="M5 12.8l4.3 4.3L19 7.4" fill="none" stroke="#000" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="success__title">تم استلام طلبك بنجاح</h2>
          <p className="success__text">هنتواصل معاك قريبًا على الواتساب</p>
          <PillButton size="md" onClick={reset}>
            تقديم طلب آخر
          </PillButton>
        </div>
      ) : (
        <form className="form" onSubmit={onSubmit} noValidate>
          <div className="form__head">
            <h2 className="form__title">استمارة التقديم</h2>
            <p className="form__sub">املا بياناتك وإحنا هنتواصل معاك</p>
          </div>

          <Field id="f-fullName" label="الاسم بالكامل" error={errors.fullName} ok={isOk('fullName')}>
            <input
              id="f-fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              maxLength={100}
              value={values.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              onBlur={() => blur('fullName')}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? 'f-fullName-err' : undefined}
              disabled={busy}
              required
            />
          </Field>

          <Field id="f-phone" label="رقم الواتساب" error={errors.phone} ok={isOk('phone')}>
            <input
              id="f-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              placeholder="01XXXXXXXXX"
              maxLength={20}
              value={values.phone}
              onChange={(e) => set('phone', e.target.value)}
              onBlur={() => blur('phone')}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'f-phone-err' : undefined}
              disabled={busy}
              required
            />
          </Field>

          <Field id="f-school" label="اسم المدرسة" error={errors.school} ok={isOk('school')}>
            <input
              id="f-school"
              name="school"
              type="text"
              autoComplete="organization"
              maxLength={100}
              value={values.school}
              onChange={(e) => set('school', e.target.value)}
              onBlur={() => blur('school')}
              aria-invalid={Boolean(errors.school)}
              aria-describedby={errors.school ? 'f-school-err' : undefined}
              disabled={busy}
              required
            />
          </Field>

          <Field id="f-grade" label="الصف الدراسي" hint="مثال الصف الثالث" error={errors.grade} ok={isOk('grade')}>
            <input
              id="f-grade"
              name="grade"
              type="text"
              maxLength={30}
              value={values.grade}
              onChange={(e) => set('grade', e.target.value)}
              onBlur={() => blur('grade')}
              aria-invalid={Boolean(errors.grade)}
              aria-describedby={errors.grade ? 'f-grade-err' : undefined}
              disabled={busy}
              required
            />
          </Field>

          <fieldset className={`field talent ${errors.talent ? 'is-invalid' : ''}`} disabled={busy}>
            <legend className="field__label">الموهبة / المجال المقدَّم فيه</legend>
            <div className="chips" role="radiogroup" aria-required="true">
              {TALENT_OPTIONS.map((opt, i) => (
                <label className="chip" key={opt}>
                  <input
                    id={i === 0 ? 'f-talent' : undefined}
                    type="radio"
                    name="talent"
                    value={opt}
                    checked={values.talent === opt}
                    onChange={() => {
                      set('talent', opt)
                      setTouched((t) => ({ ...t, talent: true }))
                      setErrors((e) => ({ ...e, talent: '' }))
                    }}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            {errors.talent && (
              <p className="field__error" role="alert">
                {errors.talent}
              </p>
            )}
          </fieldset>

          <div className={`field consent ${errors.consent ? 'is-invalid' : ''}`}>
            <label className="check">
              <input
                id="f-consent"
                type="checkbox"
                checked={values.consent}
                onChange={(e) => {
                  set('consent', e.target.checked)
                  setTouched((t) => ({ ...t, consent: true }))
                  setErrors((er) => ({ ...er, consent: rules.consent(e.target.checked) }))
                }}
                disabled={busy}
              />
              <span className="check__box" aria-hidden="true">
                <svg viewBox="0 0 20 20" width="16" height="16">
                  <path d="M4.5 10.5l3.6 3.6L15.5 6.5" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="check__text">
                أقرّ بأن بياناتي صحيحة، وبموافقة ولي أمري على مشاركتي (للمشاركين تحت 18 سنة).
              </span>
            </label>
            {errors.consent && (
              <p className="field__error" role="alert">
                {errors.consent}
              </p>
            )}
          </div>

          {/* Honeypot: مخفي عن المستخدمين الحقيقيين */}
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

          <div className="form__submit">
            <PillButton type="submit" size="md" disabled={busy} aria-busy={busy}>
              {busy ? (
                <>
                  <span className="spinner" aria-hidden="true" /> جارٍ الإرسال...
                </>
              ) : (
                'قــدم الأن'
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
    </div>
  )
}
