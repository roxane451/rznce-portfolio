import { projects } from '../data/projects.js';

function ProjectCase({ project }) {
  return (
    <details className="case-study">
      <summary>
        <span className="case-kicker">{project.kicker}</span>
        <span className="case-title">{project.name}</span>
        <span className="case-techline">{project.technologies}</span>
        <span className="case-toggle">Afficher ou masquer l’étude de cas</span>
      </summary>
      <div className="case-content">
        <p className="case-lead">{project.summary}</p>
        <div className="case-grid">
          {project.sections.map(([heading, description]) => (
            <article key={heading}>
              <h3>{heading}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
        <a className="case-link" href={project.link} target="_blank" rel="noopener noreferrer">
          {project.linkLabel}
        </a>
      </div>
    </details>
  );
}

export default function Projects() {
  return (
    <section className="articles" id="projets">
      <div className="sec-head">
        <h2>projets<span className="dot">.</span></h2>
        <p>Ce que j’ai construit, à consulter directement.</p>
      </div>
      {projects.map((project) => <ProjectCase key={project.name} project={project} />)}
      <a className="btn-ghost more" href="https://github.com/roxane451" target="_blank" rel="noopener noreferrer">
        Voir mon profil GitHub
      </a>
    </section>
  );
}
