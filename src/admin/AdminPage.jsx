import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import './admin.css'
import Login from './Login.jsx'
import Dashboard from './Dashboard.jsx'
import { ADMIN_EMAIL, auth, isFirebaseConfigured } from './adminFirebase.js'

export default function AdminPage() {
  // undefined = لسه بنتحقق | null = مش مسجّل | user = مسجّل
  const [user, setUser] = useState(isFirebaseConfigured ? undefined : null)

  useEffect(() => {
    // الصفحة دي مش للفهرسة في جوجل
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex,nofollow'
    document.head.appendChild(meta)
    const prevTitle = document.title
    document.title = 'لوحة التحكم | Super كريتيف'
    return () => {
      meta.remove()
      document.title = prevTitle
    }
  }, [])

  useEffect(() => {
    if (!auth) return undefined
    return onAuthStateChanged(auth, (u) => {
      if (u && u.email !== ADMIN_EMAIL) {
        signOut(auth)
        setUser(null)
      } else {
        setUser(u)
      }
    })
  }, [])

  if (user === undefined) {
    return (
      <div className="adm-splash" role="status" aria-label="جارٍ التحميل">
        <span className="spinner spinner--lg" />
      </div>
    )
  }
  return user ? <Dashboard /> : <Login />
}
