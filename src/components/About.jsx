export default function About() {
  return (
    <section className="about" aria-label="عنا">
      <div className="about__col about__col--text">
        <h2 className="about__title">عنا</h2>
        <div className="about__desc">
          <p className="about__p" spellCheck="false">
            هي مسابقة فنية لطلاب التعليم الفني والتكنولوجي بتجمع مختلف أشكال الإبداع والفنون في مساحة واحدة، وبتمنح الطلاب فرصة لعرض مواهبهم وأعمالهم الفنية.
          </p>
          <p className="about__p" spellCheck="false">
            في الموسم الأول، نسلّط الضوء على <strong className="about__bold">الجودة في التعليم</strong> من خلال أعمال فنية تعبّر عن رؤى الطلاب وأفكارهم حول الموضوع بمختلف الوسائط والأساليب الإبداعية.
          </p>
        </div>
      </div>

      <div className="about__col about__col--image">
        <img
          className="about__img"
          src="/images/about.svg"
          alt="طلاب مشاركون في مسابقة Super كريتيف"
          width="598"
          height="516"
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  )
}
