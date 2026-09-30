const offers = [
  { title: 'déployer sans trembler', tags: 'ci/cd, gitops, automatisation', note: 3 },
  { title: 'changer de cloud sans tout refaire', tags: 'agnosticité, terraform, kubernetes', note: 2 },
  { title: 'garder la main sur ses données', tags: 'souveraineté, auto-hébergement', note: 1 },
  { title: 'savoir ce qui tourne en prod', tags: 'supervision, sécurité de la chaîne logicielle', note: 0 },
];

export default function Offers() {
  return (
    <section className="topics" id="offres">
      <div className="sec-head">
        <h2>Ce que j’accorde<span className="dot">.</span></h2>
      </div>
      <div className="list">
        {offers.map(({ title, tags, note }) => (
          <div className="row" data-note={note} key={title}>
            <h3 className="big">{title}<span className="tone" /></h3>
            <p className="tags">{tags}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
