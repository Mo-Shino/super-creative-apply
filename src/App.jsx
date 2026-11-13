import Hero from './components/Hero.jsx'
import SponsorsMarquee from './components/SponsorsMarquee.jsx'
import ApplyForm from './components/ApplyForm.jsx'

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
  return (
    <main className="page">
      <Hero onApply={goToForm} />
      <SponsorsMarquee />

      <section className="formSection" id="apply" aria-label="استمارة التقديم">
        <img className="ribbon ribbon--a" src="/images/ribbon.svg" alt="" aria-hidden="true" width="2877" height="1923" />
        <img className="ribbon ribbon--b" src="/images/ribbon.svg" alt="" aria-hidden="true" width="2877" height="1923" />
        <ApplyForm />
      </section>

      <footer className="footer">
        <span>Super كريتيف</span>
        <span aria-hidden="true">•</span>
        <span>مسابقة فنية لطلاب التعليم الفني والتكنولوجي</span>
      </footer>
    </main>
  )
}
