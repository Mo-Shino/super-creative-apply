import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/cairo/wght.css'
import './styles/tokens.css'
import './styles/app.css'
import App from './App.jsx'

// صفحة الأدمن في ملف منفصل بيتحمّل بس لما حد يفتح /admin
const AdminPage = lazy(() => import('./admin/AdminPage.jsx'))
const isAdmin = /^\/admin(\/|$)/.test(window.location.pathname)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdmin ? (
      <Suspense fallback={null}>
        <AdminPage />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
