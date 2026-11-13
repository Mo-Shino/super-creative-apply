import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import PillButton from '../components/PillButton.jsx'
import { ADMIN_EMAIL, auth, isFirebaseConfigured } from './adminFirebase.js'

const DOTS = Array.from({ length: 14 }, (_, i) => i)

function errorMessage(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'كلمة المرور غير صحيحة'
    case 'auth/too-many-requests':
      return 'محاولات كتير غلط. استنى شوية وحاول تاني.'
    case 'auth/network-request-failed':
      return 'مفيش اتصال بالإنترنت. حاول تاني.'
    case 'auth/operation-not-allowed':
      return 'تسجيل الدخول بالباسورد مش متفعّل في Firebase (Authentication ← Sign-in method).'
    default:
      return 'حصلت مشكلة. حاول تاني.'
  }
}

export default function Login() {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    if (busy) return
    if (!password) {
      setError('اكتب كلمة المرور')
      return
    }
    if (!isFirebaseConfigured) {
      setError('Firebase مش متوصّل (متغيرات البيئة ناقصة).')
      return
    }
    setBusy(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password)
      // onAuthStateChanged في الصفحة الأم هيفتح اللوحة
    } catch (err) {
      setError(errorMessage(err?.code))
      setBusy(false)
    }
  }

  return (
    <main className="adm-login">
      <img className="adm-login__logo" src="/images/logo.webp" alt="Super كريتيف" width="1400" height="852" />

      <form className="card adm-login__card" onSubmit={onSubmit} noValidate>
        <img className="card__pin" src="/images/pin.webp" alt="" aria-hidden="true" width="420" height="502" />
        <div className="card__dots" aria-hidden="true">
          {DOTS.map((d) => (
            <i key={d} />
          ))}
        </div>

        <div className="adm-login__body">
          <h1 className="adm-login__title">لوحة التحكم</h1>
          <p className="adm-login__sub">اكتب كلمة المرور للدخول</p>

          <div className={`field ${error ? 'is-invalid' : ''}`}>
            <label className="field__label" htmlFor="adm-pass">
              كلمة المرور
            </label>
            <div className="field__control">
              <input
                id="adm-pass"
                type={show ? 'text' : 'password'}
                dir="ltr"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError('')
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'adm-pass-err' : undefined}
                disabled={busy}
              />
              <button
                type="button"
                className="adm-eye"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                aria-pressed={show}
              >
                {show ? 'إخفاء' : 'إظهار'}
              </button>
            </div>
            {error && (
              <p className="field__error" id="adm-pass-err" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="form__submit">
            <PillButton type="submit" size="md" disabled={busy} aria-busy={busy}>
              {busy ? (
                <>
                  <span className="spinner" aria-hidden="true" /> جارٍ الدخول...
                </>
              ) : (
                'دخـــول'
              )}
            </PillButton>
          </div>
        </div>
      </form>
    </main>
  )
}
