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
        <span className="hint" id="hint" />
        <span className="pinglabel" id="pingLabel" />
      </div>

      <div className="hero-foot">
        <div>
          <p>
            <strong>rznce</strong>, comme résonance. J’automatise le déploiement et l’exploitation
            d’applications sur Kubernetes.
          </p>
          <div className="ctas">
            <a className="btn" href="mailto:bonjour@rznce.fr">Échanger autour du DevOps</a>
            <a className="btn-ghost" href="#ouais-mais">Lire mes articles</a>
          </div>
        </div>
        <div className="term-win">
          <div className="tw-bar" aria-hidden="true">
            <i /><i /><i /><span>~/rznce</span>
          </div>
          <div className="term" id="term" />
        </div>
      </div>
    </section>
  );
}
