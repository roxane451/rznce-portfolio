const articles = [
  {
    category: 'souveraineté',
    meta: 'Medium, 6 min',
    title: '« ouais mais AWS c’est le standard, tout le monde l’utilise »',
    summary: 'Choisir son hébergement sans offrir ses données aux États-Unis.',
    url: 'https://medium.com/@ongamira/ouais-mais-aws-cest-le-standard-tout-le-monde-l-utilise-6add3cfa51fc',
    note: 5,
  },
  {
    category: 'conteneurs',
    meta: 'Medium',
    title: '« ouais mais moi j’utilise Docker et ça marche très bien »',
    summary: 'Petit guide de survie pour le développeur qui n’a pas encore lu la note de service du SI.',
    url: 'https://medium.com/@ongamira/ouais-mais-moi-jutilise-docker-et-%C3%A7a-marche-tr%C3%A8s-bien-312ea2c2eb1f',
    note: 7,
  },
];

export default function Articles() {
  return (
    <section className="articles" id="ouais-mais">
      <div className="sec-head">
        <h2>ouais, mais…</h2>
        <p>Des phrases qu’on entend souvent dans le métier, et ce que j’en pense.</p>
      </div>
      <div className="list cards">
        {articles.map((article) => (
          <a
            className="row card"
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            data-note={article.note}
            key={article.url}
          >
            <span className="c-top"><span>{article.category}</span><span>{article.meta}</span></span>
            <span className="a-title">{article.title}</span>
            <span className="a-sub">{article.summary}</span>
            <span className="c-cta">Lire l’article</span>
          </a>
        ))}
      </div>
      <a className="btn-ghost more" href="https://medium.com/@ongamira" target="_blank" rel="noopener noreferrer">
        Voir mon profil Medium
      </a>
    </section>
  );
}
