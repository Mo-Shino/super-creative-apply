const DOTS = Array.from({ length: 14 }, (_, i) => i)

export default function FormCard({ children, cardRef, lockedHeight, className = '' }) {
  return (
    <div
      className={`card ${className}`.trim()}
      ref={cardRef}
      style={lockedHeight ? { minHeight: lockedHeight } : undefined}
    >
      <img className="card__pin" src="/images/pin.webp" alt="" aria-hidden="true" width="420" height="502" />
      <div className="card__dots" aria-hidden="true">
        {DOTS.map((d) => (
          <i key={d} />
        ))}
      </div>
      {children}
    </div>
  )
}
