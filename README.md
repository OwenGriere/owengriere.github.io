# owengriere.github.io

Site personnel d'Owen Griere, ingénieur en bioinformatique (Toulouse).
En ligne : <https://owengriere.github.io/>

## Stack

HTML/CSS/JS statique, sans build ni framework, servi tel quel par GitHub Pages
(`.nojekyll` désactive le traitement Jekyll).

```
index.html  profile.html  projects.html  tools.html  publications.html  labbook.html
css/style.css    design system : variables CSS, thème clair/sombre, composants partagés
js/main.js       thème, menu mobile, lien de nav actif, scroll reveal, portail Lab Book
images/          logos, favicon, image de partage (og-cover.png)
docs/            PDF servis directement (CV, publications)
sitemap.xml  robots.txt
```

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
