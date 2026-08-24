# owengriere.github.io

Site personnel d'Owen Griere, ingénieur en bioinformatique (Toulouse).
En ligne : <https://owengriere.github.io/>

## Stack

HTML/CSS/JS statique, sans build ni framework, servi tel quel par GitHub Pages
(`.nojekyll` désactive le traitement Jekyll).

```
index.html  profile.html  projects.html  tools.html  publications.html  labbook.html
404.html         page d'erreur ; GitHub Pages la sert pour toute URL inconnue,
                 donc ses liens et assets sont racine-relatifs (/css/…, /profile.html)
css/style.css    design system : variables CSS, thème clair/sombre, composants partagés
js/main.js       thème, menu mobile, lien de nav actif, scroll reveal, portail Lab Book
js/network.js    graphe des outils (page Tools)
images/          logos, favicon, image de partage (og-cover.png)
docs/            PDF servis directement (CV, publications)
sitemap.xml  robots.txt
```

## Référencement

Chaque page publique porte un bloc `<script type="application/ld+json">` en fin
de `<head>` : `Person` + `WebSite` sur l'accueil, `ProfilePage`, `ScholarlyArticle`
pour la publication, `ItemList` de `SoftwareSourceCode` pour les outils. Tous les
nœuds pointent vers le même `@id` de personne
(`https://owengriere.github.io/#person`), ce qui relie les pages entre elles pour
Google et Google Scholar. L'ORCID (`0009-0004-0295-8228`) y figure en `sameAs`
et en `identifier`.

Ne rien décrire en JSON-LD qui ne soit pas visible sur la page : c'est une règle
explicite de Google, et le poster JOBIM par exemple n'apparaît que sur
`profile.html`, pas dans le balisage de `publications.html`.

`labbook.html` est exclue de l'index par `<meta name="robots" content="noindex">`.
Elle n'est **pas** listée en `Disallow` dans `robots.txt` : un `Disallow` annonce
publiquement l'existence de la page et, surtout, empêche les robots de lire le
`noindex` — l'inverse de l'effet recherché.

## Graphe des outils

`js/network.js` dessine le réseau de la page Tools : simulation force-dirigée
maison en SVG, sans dépendance. Le modèle (`NODES`, `HULLS`, `EDGES`) est en
haut du fichier — c'est le seul endroit à modifier pour ajouter un outil ; tout
le reste s'en déduit.

Structure représentée : `Spatial omics` → `CytoSeg` / `PDACSeg` → `SingleCell`,
puis trois branches à partir de cette table de cellules — la suite MOSNA,
`AnnData Tools` → `Scanpy / Squidpy`, et la modélisation. La génomique
(`VCF` → `MORFEE Wrapper`) est une branche à part.

Un **super-nœud** (`HULLS`) est un cercle tracé autour d'une famille. Il n'est
pas simulé : centre et rayon sont dérivés des membres à chaque pas. Une arête
peut le prendre pour extrémité — elle s'attache alors au bord du cercle, et la
force est répartie sur les membres.

Quatre points qui ne se devinent pas à la lecture :

- La disposition est **résolue en une passe synchrone** (`settle()`) plutôt
  qu'au fil des images. Une simulation animée dépend du nombre d'images
  réellement rendues et donnait des compositions inégales selon la machine, ou
  si l'onglet passait à l'arrière-plan. L'animation ne sert plus qu'à
  l'apparition, et elle est en CSS.
- Le graphe **n'est pas connexe** : la branche génomique ne partage aucune
  brique avec la branche spatiale. Les composantes sont donc disposées
  séparément puis rangées côte à côte, à échelle commune. Traitées ensemble, la
  répulsion les éloignait sans limite et le recadrage tassait la composante
  principale dans un coin.
- **Appartenir à un super-nœud compte comme un lien** dans le calcul des
  composantes. Sinon un filtre coupant les arêtes internes scinderait le
  groupe, dont les morceaux seraient empaquetés dans des zones disjointes du
  cadre — et le cercle censé les entourer se déchirerait.
- Le second argument de `classList.toggle()` doit être un **vrai booléen** :
  avec `undefined`, il bascule la classe au lieu de la forcer. Un prédicat
  écrit `e.isHull && …` renvoie `undefined` sur un nœud ordinaire, ce qui
  allumait toutes les arêtes au survol. D'où les `!!` explicites.

Les styles spécifiques à une page vivent dans son `<style>` ; tout ce qui est
partagé (nav, footer, boutons, badges, modale) est dans `css/style.css`.

## Développement

Aucune dépendance à installer :

```bash
python3 -m http.server 8000   # puis http://localhost:8000
```

Un push sur `main` déclenche le déploiement.

## Lab Book

`labbook.html` est masquée derrière une passphrase côté client
(`js/main.js`). **Ce n'est pas un contrôle d'accès** : la page et le script sont
servis publiquement, donc la passphrase est lisible dans le source. Le vrai
contrôle d'accès repose sur les permissions de partage Google Drive des documents
liés — ce sont elles qu'il faut restreindre.
