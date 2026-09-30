# rznce — portfolio DevOps

Portfolio statique construit avec React, Vite et GSAP.

## Prérequis

- Node.js 20.19+ ou 22.12+
- npm

## Développement

```sh
npm install
npm run dev
```

## Vérification de production

```sh
npm run build
npm run preview
```

Le build généré se trouve dans `dist/`. Il peut être publié sur un hébergement statique. La base
des URLs est `/` par défaut ; pour publier sous un chemin de dépôt (par exemple GitHub Pages),
définir `VITE_BASE_PATH=/rznce-portfolio/` lors du build.

Les métadonnées SEO et de partage social sont définies dans `index.html`. Après avoir choisi le
domaine public, ajouter l’URL canonique, l’URL `og:url`, un sitemap et une image Open Graph absolue
pour compléter le référencement et l’aperçu de partage.

## Organisation

- `src/components/` contient les composants d’interface et de page.
- `src/data/projects.js` centralise le contenu des études de cas.
- `src/experience.js` initialise les interactions SVG, audio, scroll et GSAP.
- `src/styles.css` contient les styles du site.
- `src/App.jsx` assemble les sections et initialise l’expérience après le montage React.

Les identifiants et classes utilisés par `experience.js` font partie du contrat entre les
composants et l’animation. Lorsqu’un élément est renommé ou déplacé, vérifier les sélecteurs
correspondants dans ce module.
