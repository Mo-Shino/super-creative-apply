import Hero from './components/Hero.jsx'
import Headline from './components/Headline.jsx'
import SponsorsMarquee from './components/SponsorsMarquee.jsx'
import PillButton from './components/PillButton.jsx'
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
      <Hero />
      <Headline />
      <SponsorsMarquee />

      <section className="cta">
        <p className="cta__tag">الموسم الأول &nbsp;•&nbsp; الجودة في التعليم</p>
        <PillButton onClick={goToForm}>قــدم الأن</PillButton>
      </section>

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
