import Hero from './components/Hero.jsx'
import SponsorsMarquee from './components/SponsorsMarquee.jsx'
import About from './components/About.jsx'
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
      <About />

      <img
        className="doodle"
        src="/images/ribbon.svg"
        alt=""
        aria-hidden="true"
        width="2877"
        height="1923"
      />

      <section className="formSection" id="apply" aria-label="استمارة التقديم">
        <ApplyForm />
      </section>

      <footer className="footer">
        <span><a href='https://www.facebook.com/share/1m4wJkvBoe/'><img
          src="/images/akar-icons_facebook-fill.svg"
          width="30"
          height="30"
        /> </a></span>
        <span aria-hidden="true">•</span>
        <span>Super كريتيف</span>
        <span aria-hidden="true">•</span>

        <span>مسابقة فنية لطلاب التعليم الفني والتكنولوجي</span>
      </footer>
    </main>
  )
}
