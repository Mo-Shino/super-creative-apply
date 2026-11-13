export default function Hero() {
  return (
    <header className="hero">
      <img
        className="hero__logo"
        src="/images/logo.webp"
        alt="Super كريتيف"
        width="1400"
        height="852"
        fetchPriority="high"
        decoding="async"
      />
      <img
        className="hero__collage"
        src="/images/collage.webp"
        alt="أعمال فنية لطلاب المسابقة: لوحات ورسومات وفخارة"
        width="1289"
        height="1053"
        fetchPriority="high"
        decoding="async"
      />
    </header>
  )
}
