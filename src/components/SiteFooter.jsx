export default function SiteFooter() {
  return (
    <footer id="contact">
      <div className="footer-main">
        <h2 className="cta">On est sur la même <em>fréquence</em> ?</h2>
        <div className="footer-action">
          <a className="mail" href="mailto:bonjour@rznce.fr">Écrire à Roxane</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="diapason">
          Ce site est accordé en <b id="footA">la = 432 Hz</b>. Ça ne soigne rien et ça n’aligne
          aucun chakra, mais ça sonne un peu plus chaud. Sans filtre marketing, on a dit.
        </p>
      </div>
    </footer>
  );
}
