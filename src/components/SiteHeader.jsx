const menuItems = [
  ['accueil', '#', 0],
  ['manifeste', '#manifeste', 1],
  ['offres', '#offres', 2],
  ['projets', '#projets', 3],
  ['ouais, mais…', '#ouais-mais', 4],
  ['contact', '#contact', 5],
];

export default function SiteHeader() {
  return (
    <>
      <header>
        <a className="logo" href="#" aria-label="rznce, accueil">
          rznce<i>.</i>
        </a>
        <button className="sound" id="sound" aria-pressed="false" aria-label="Activer le son">
          <span className="bars" aria-hidden="true"><i /><i /><i /></span>
          <span id="soundLabel">off</span>
        </button>
      </header>

      <button
        className="burger"
        id="burger"
        aria-expanded="false"
        aria-controls="menu"
        aria-label="Ouvrir le menu"
      >
        <svg viewBox="0 0 30 22" aria-hidden="true">
          <path id="b1" />
          <path id="b2" />
          <path id="b3" />
        </svg>
      </button>

      <div className="menu" id="menu" hidden>
        <canvas className="menu-sky" aria-hidden="true" />
        <nav className="menu-nav" aria-label="Menu principal">
          {menuItems.map(([label, href, note]) => (
            <a href={href} data-note={note} key={href}>
              <span className="m-t">{label}</span>
              <span className="m-n" />
            </a>
          ))}
        </nav>
        <div className="menu-foot">
          <a className="mail" href="mailto:bonjour@rznce.fr">bonjour@rznce.fr</a>
          <button className="sound tune" id="tune" aria-label="Changer le diapason">
            <span id="tuneLabel">la = 432 Hz</span>
          </button>
        </div>
        <svg className="menu-ridges" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true" />
      </div>
    </>
  );
}
