import { useEffect } from 'react';
import { initializeExperience } from './experience.js';
import AmbientBackground from './components/AmbientBackground.jsx';
import SiteHeader from './components/SiteHeader.jsx';
import Hero from './components/Hero.jsx';
import Manifesto from './components/Manifesto.jsx';
import Offers from './components/Offers.jsx';
import Projects from './components/Projects.jsx';
import Articles from './components/Articles.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import AudioReadout from './components/AudioReadout.jsx';

export default function App() {
  useEffect(() => {
    initializeExperience();
  }, []);

  return (
    <>
      <a className="skip-link" href="#contenu">Aller au contenu</a>
      <span id="top" className="page-top" aria-hidden="true" />
      <AmbientBackground />
      <SiteHeader />
      <main id="contenu">
        <Hero />
        <Manifesto />
        <Offers />
        <Projects />
        <Articles />
      </main>
      <SiteFooter />
      <AudioReadout />
    </>
  );
}
