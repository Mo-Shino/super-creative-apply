import { useState } from 'react'
import { workshops } from '../data/workshops.js'

function AvatarFallback() {
  return (
    <div className="workshop-card__fallback" aria-hidden="true">
      <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none">
        <rect width="100" height="100" rx="16" fill="#DDF700" />
        <circle cx="50" cy="38" r="18" fill="#4A37E1" />
        <path d="M22 84c0-15.5 12.5-28 28-28s28 12.5 28 28v4H22v-4z" fill="#4A37E1" />
      </svg>
    </div>
  )
}

function WorkshopCard({ item }) {
  const [imgError, setImgError] = useState(false)

  return (
    <article className="workshop-card">
      <div className="workshop-card__media">
        {imgError || !item.image ? (
          <AvatarFallback />
        ) : (
          <img
            src={item.image}
            alt={item.instructor || item.title}
            className="workshop-card__img"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      <div className="workshop-card__content">
        <h3 className="workshop-card__title">{item.title}</h3>
        <p className="workshop-card__instructor">{item.instructor}</p>
        <div className="workshop-card__date-pill">
          <span>{item.date}</span>
        </div>
      </div>
    </article>
  )
}

export default function WorkshopsSection() {
  return (
    <section className="workshops" id="workshops" aria-label="الورش التدريبية">
      <div className="workshops__container">
        <h2 className="workshops__title">الورش</h2>

        <div className="workshops__grid">
          {workshops.map((w) => (
            <WorkshopCard key={w.id} item={w} />
          ))}
        </div>
      </div>
    </section>
  )
}
