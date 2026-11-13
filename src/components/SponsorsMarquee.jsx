const SPONSORS = [
  { src: '/images/sponsor-gfd.webp', alt: 'Galaxy for Development', w: 800, h: 197, size: 'wide' },
  { src: '/images/sponsor-fathallah.webp', alt: 'فتح الله', w: 420, h: 379, size: 'square' },
  { src: '/images/sponsor-iats.webp', alt: 'المدارس الدولية للتكنولوجيا التطبيقية iATS', w: 420, h: 422, size: 'square' },
  { src: '/images/sponsor-tech.webp', alt: 'وزارة التربية والتعليم والتعليم الفني — التكنولوجيا التطبيقية', w: 452, h: 167, size: 'wide' },
  { src: '/images/sponsor-sufra.png', alt: 'sufra', w: 800, h: 197, size: 'wide' }
]

// نكرر المجموعة 4 مرات، ونحرك الشريط -50% = مجموعتين، فاللفة بتبقى من غير فجوة
const GROUPS = [0, 1, 2, 3]

export default function SponsorsMarquee() {
  return (
    <section className="marquee" aria-label="الرعاة والشركاء">
      <div className="marquee__track">
        {GROUPS.map((g) => (
          <ul className="marquee__group" key={g} aria-hidden={g > 0 ? 'true' : undefined}>
            {SPONSORS.map((s) => (
              <li className="marquee__item" key={s.src}>
                <img
                  className={`marquee__img marquee__img--${s.size}`}
                  src={s.src}
                  alt={g === 0 ? s.alt : ''}
                  width={s.w}
                  height={s.h}
                  loading="eager"
                  draggable="false"
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  )
}
