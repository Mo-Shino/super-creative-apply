import PillButton from './PillButton.jsx'

export default function Hero({ onApply }) {
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

      <div className="hero__copy">
        <h1 className="hero__title" aria-label="المستقبل بإبداعكم">
          <span className="hero__w" aria-hidden="true">المستقبل</span>
          <span className="hero__l" aria-hidden="true">بإبداعكم</span>
        </h1>
        <p className="hero__tag">
          مسابقة فنية لطلاب التعليم الفني والتكنولوجي.
          <br />
          الموسم الأول: <strong>الجودة في التعليم</strong>
        </p>
        <PillButton className="hero__cta" onClick={onApply}>
          قــدم الأن
        </PillButton>
      </div>
    </header>
  )
}
