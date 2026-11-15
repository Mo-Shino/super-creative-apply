import { useEffect, useState } from 'react'

export default function Navbar({ currentPath = '/', onNavigate }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLinkClick = (e, targetPath, hash = '') => {
    e.preventDefault()
    if (onNavigate) {
      onNavigate(targetPath, hash)
    } else {
      const fullUrl = hash ? `${targetPath}${hash}` : targetPath
      window.history.pushState({}, '', fullUrl)
      window.dispatchEvent(new Event('popstate'))
      if (hash) {
        setTimeout(() => {
          document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  const isHome = currentPath === '/' || currentPath === ''
  const isSubmission = currentPath === '/submission' || currentPath.startsWith('/submission')

  return (
    <nav
      className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}
      aria-label="التنقل الرئيسي"
    >
      <div className="navbar__container">
        {/* Right side: Logo + Links */}
        <div className="navbar__right">
          <a
            href="/"
            className="navbar__logo-link"
            onClick={(e) => handleLinkClick(e, '/')}
            aria-label="الصفحة الرئيسية"
          >
            <img
              src="/images/Group_312.svg"
              alt="Super كريتيف"
              className="navbar__logo"
              width="140"
              height="80"
            />
          </a>

          <div className="navbar__links">
            <a
              href="/"
              className={`navbar__link navbar__link--home ${isHome ? 'is-active' : ''}`}
              onClick={(e) => handleLinkClick(e, '/')}
            >
              الرئيسية
            </a>

            <a
              href="/#workshops"
              className="navbar__link navbar__link--workshops"
              onClick={(e) => handleLinkClick(e, '/', '#workshops')}
            >
              الورش
            </a>
          </div>
        </div>

        {/* Left side: Submission CTA button */}
        <div className="navbar__left">
          <a
            href="/submission"
            className={`navbar__cta-pill ${isSubmission ? 'is-active' : ''}`}
            onClick={(e) => handleLinkClick(e, '/submission')}
          >
            تسليم العمل
          </a>
        </div>
      </div>
    </nav>
  )
}
