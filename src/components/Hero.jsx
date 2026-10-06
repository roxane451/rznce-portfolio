export default function Hero() {
  return (
    <section className="hero">
      <h1 id="title">
        <span className="l">votre infra</span>
        <span className="l l2">en résonance.<span className="sup">432</span></span>
      </h1>

      <div className="harp" id="harp" aria-hidden="true">
        <svg viewBox="0 0 1000 400" preserveAspectRatio="none">
          <defs />
          <g id="sky" />
        </svg>
        <span className="pinglabel" id="pingLabel" />
      </div>

      <div className="hero-foot">
        <div>
          <p>
            <strong>rznce</strong>, comme résonance. Je suis Roxane, profil DevOps à Lyon :
            j’aime fiabiliser les déploiements, automatiser ce qui fatigue les équipes et rendre
            l’infra plus lisible.
          </p>
          <ul className="tech-badges" aria-label="Technologies principales">
            {['Kubernetes', 'GitOps', 'Terraform', 'CI/CD', 'Observabilité'].map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>
          <div className="ctas">
            <a className="btn" href="mailto:bonjour@rznce.fr">Travailler avec moi</a>
            <a className="btn-ghost" href="#ouais-mais">Lire mes articles</a>
          </div>
        </div>
        <div className="term-win">
          <div className="tw-bar" aria-hidden="true">
            <i /><i /><i /><span>~/rznce</span>
          </div>
          <div className="term" id="term" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
