import { useEffect, useState } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import SponsorsMarquee from './components/SponsorsMarquee.jsx'
import About from './components/About.jsx'
import ApplyForm from './components/ApplyForm.jsx'
import WorkshopsSection from './components/WorkshopsSection.jsx'
import SubmissionPage from './pages/SubmissionPage.jsx'

function goToForm() {
  const target = document.getElementById('apply')
  if (!target) return
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  // بعد ما السكرول يوصل، نركّز على أول حقل
  window.setTimeout(() => {
    document.getElementById('f-fullName')?.focus({ preventScroll: true })
  }, 650)
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const onPop = () => {
      setCurrentPath(window.location.pathname)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (window.location.hash === '#workshops') {
      setTimeout(() => {
        document.getElementById('workshops')?.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    }
    if (currentPath === '/' || currentPath === '') {
      document.title = 'قدّم الآن | Super كريتيف'
    }
  }, [currentPath])

  const navigate = (path, hash = '') => {
    const fullUrl = hash ? `${path}${hash}` : path
    window.history.pushState({}, '', fullUrl)
    setCurrentPath(path)
    if (hash) {
      setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const isSubmission = currentPath === '/submission' || currentPath.startsWith('/submission')

  return (
    <>
      <Navbar currentPath={currentPath} onNavigate={navigate} />

      {isSubmission ? (
        <SubmissionPage />
      ) : (
        <main className="page">
          <Hero onApply={goToForm} />
          <SponsorsMarquee />
          <About />

          {/* ApplyZone: يمنع تداخل الدودل مع سيكشن الورش ويقصه من تحت */}
          <div className="applyZone">
            <section className="formSection" id="apply" aria-label="استمارة التقديم">
              <img
                className="doodle doodle--apply"
                src="/images/ribbon.svg"
                alt=""
                aria-hidden="true"
                width="2877"
                height="1923"
              />
              <ApplyForm />
            </section>
          </div>

          <WorkshopsSection />

          <footer className="footer">
            <span>
              <a href="https://www.facebook.com/share/1m4wJkvBoe/" target="_blank" rel="noopener noreferrer">
                <img
                  src="/images/akar-icons_facebook-fill.svg"
                  alt="Facebook"
                  width="30"
                  height="30"
                />
              </a>
            </span>
            <span aria-hidden="true">•</span>
            <span>Super كريتيف</span>
            <span aria-hidden="true">•</span>
            <span>مسابقة فنية لطلاب التعليم الفني والتكنولوجي</span>
          </footer>
        </main>
      )}
    </>
  )
}
