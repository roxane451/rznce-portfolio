const properties = [
  {
    kind: 0,
    note: 0,
    kicker: 'Première propriété de la résonance',
    title: <>fréquence propre.<span className="n">1</span></>,
    definition: '« La fréquence à laquelle un système oscille de lui-même, quand on le laisse vibrer sans rien lui imposer. »',
    description: 'Chaque système a la sienne. On l’écoute, et on ne laisse personne la dicter de l’extérieur. C’est le diagnostic, la supervision, et une souveraineté numérique réelle : vos données, vos règles.',
  },
  {
    kind: 1,
    note: 3,
    kicker: 'Deuxième propriété de la résonance',
    title: <><span className="n">2</span>amor&shy;tissement.</>,
    definition: '« La perte d’énergie qui ramène un système au calme après une perturbation. »',
    description: 'Un système sain absorbe les chocs au lieu de les amplifier, attaques comprises. Un conteneur tombe ? Kubernetes en relance un autre avant que quiconque s’en aperçoive. C’est la cybersécurité, la haute disponibilité, l’autoréparation.',
    right: true,
  },
  {
    kind: 2,
    note: 5,
    kicker: 'Troisième propriété de la résonance',
    title: <>ampli&shy;fication.<span className="n">3</span></>,
    definition: '« Quand on pousse un système à son propre rythme, chaque impulsion s’ajoute à la précédente. »',
    description: 'Une petite impulsion, répétée au bon rythme, produit un effet immense. C’est l’automatisation, le CI/CD, et une infra agnostique : le même code, déployé sur n’importe quel cloud.',
  },
];

function PropertyCard({ property }) {
  const { kind, note, kicker, title, definition, description, right } = property;

  return (
    <article className={`prop${right ? ' prop--right' : ''}`} data-kind={kind} data-note={note}>
      <p className="mf-kicker">{kicker}</p>
      <h3>{title}</h3>
      <div className="wave-wrap">
        <svg className="prop-wave" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true">
          <g className="grid" />
          <path className="pw-fill" />
          <path className="pw-ghost" />
          <path className="pw" />
          {kind === 2 && <g className="ticks" />}
        </svg>
        <span className="head" aria-hidden="true" />
        <div className="scope-read" aria-hidden="true">
          <span className="k" />
          <b className="v" />
        </div>
      </div>
      <div className="prop-cols">
        <p className="def">{definition}</p>
        <p className="txt">{description}</p>
      </div>
    </article>
  );
}

export default function Manifesto() {
  return (
    <section className="manifesto" id="manifeste">
      <div className="mf-intro">
        <p className="mf-kicker">manifeste<span className="ext">.yaml</span></p>
        <p className="mf-lead">
          Chaque déploiement, chaque alerte est une onde qui traverse le système. Mon travail :
          bâtir des infrastructures DevOps qui restent sous juridiction européenne et libres de
          changer de fournisseur.
        </p>
      </div>
      <div className="prop-controls" aria-label="Navigation des propriétés">
        <span className="prop-count" aria-live="polite">01 / 03</span>
        <div className="prop-progress" role="progressbar" aria-label="Progression des propriétés" aria-valuemin="1" aria-valuemax="3" aria-valuenow="1">
          <span />
        </div>
        <button type="button" data-prop-step="-1" aria-label="Propriété précédente" disabled>
          <span aria-hidden="true">←</span>
        </button>
        <button type="button" data-prop-step="1" aria-label="Propriété suivante">
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <div className="prop-track" role="region" aria-label="Les trois propriétés de la résonance" tabIndex="0">
        {properties.map((property) => <PropertyCard key={property.kind} property={property} />)}
      </div>
    </section>
  );
}
