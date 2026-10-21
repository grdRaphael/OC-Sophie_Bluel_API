# Sophie Bluel — API (Node.js / Express)

API du portfolio de l'architecte d'intérieur Sophie Bluel : projets, catégories et connexion.

Elle a été **fournie par OpenClassrooms** pour le projet 3 de la formation *Développeur Web*. Je l'ai ensuite **adaptée et sécurisée** pour la mettre en ligne comme **démo publique**, utilisée par :
- 👉 [la version React du site](https://github.com/grdRaphael/OC-Sophie_Bluel_REACT_version) — **démo en ligne : https://oc-sophie-bluel-react-version.vercel.app**
- 👉 [la version JavaScript d'origine](https://github.com/grdRaphael/OC-Projet3-Portfolio-architecte-Sophie-Bluel), qui fonctionne aussi avec cette API (le contrat de l'API n'a pas changé)

API en ligne : https://grd-raphael.alwaysdata.net/api/works — documentation Swagger : https://grd-raphael.alwaysdata.net/api-docs/

## Ce que j'ai ajouté à l'API d'origine

Une démo publique avec un compte de test public, c'est une API ouverte à tous. J'ai donc ajouté :

| Ajout | Pourquoi |
|---|---|
| **Optimisation des images avec Sharp** : redimensionnement à 1200 px max, conversion en **WebP** qualité 80, rotation EXIF | Images bien plus légères (les 11 images de démo passent de **10,4 Mo à 534 Ko**), site plus rapide. Le ré-encodage supprime aussi les métadonnées (position GPS) et tout contenu caché |
| **Formats acceptés** : JPEG, PNG, WebP uniquement, détectés dans le **contenu** du fichier | Un faux fichier ou un format inattendu (renommé en `.png`) est refusé |
| **40 millions de pixels maximum** (`limitInputPixels`) | Protège la mémoire contre les « bombes de décompression » (fichier léger, image énorme une fois décodée) |
| **10 Mo maximum** par fichier (multer) | Garde-fou : le fichier est écrit dans le dossier temporaire du système avant d'être optimisé |
| **Limite de débit** : 20 ajouts par IP toutes les 15 minutes (`express-rate-limit`) | Empêche les envois en masse (réponse 429) |
| **Plafond de 20 projets** | Le disque ne peut pas déborder, même si quelqu'un change d'IP |
| **`trust proxy`** | Derrière le proxy HTTPS de l'hébergeur : vraie IP du visiteur (pour la limite de débit) et URL d'images en `https` |
| **Cache navigateur de 30 jours** (`immutable`) sur les images | Un fichier ne change jamais sous le même nom → affichage instantané au rechargement |
| **Connexion protégée contre le plantage** : e-mail et mot de passe vérifiés (texte non vide, sinon 400) + `try / catch` (500 sobre) | Avant, une connexion **sans e-mail** arrêtait tout le serveur : Express 4 n'attrape pas les erreurs des fonctions `async`, et Node arrête le processus sur une promesse rejetée non gérée |
| **Mémoire réduite** pour l'hébergement gratuit (256 Mo pour tous les sites du compte) | Mesuré : **125 → 81 Mo** au démarrage, **186 → 94 Mo** au pic pendant les envois. Voir [Économie de mémoire](#économie-de-mémoire) |
| **Données de démo** (`donnees-demo.sql`) + **remise à zéro automatique** (`scripts/reset-demo.sh`) | La démo publique revient à ses 11 projets d'origine toutes les heures |

Les middlewares de la route d'ajout sont ordonnés **du moins coûteux au plus coûteux** : limite de débit → token → plafond → réception du fichier → Sharp. Une requête abusive est refusée avant d'être traitée.

## Économie de mémoire

L'hébergeur gratuit limite la mémoire vive à 256 Mo pour **tous** les sites du compte. Trois changements, sans effet visible pour l'utilisateur :

| Changement | Gain | Explication |
|---|---|---|
| **Swagger en fichiers statiques** (`docs/` + `swagger-ui-dist`) au lieu de `swagger-ui-express` et `yamljs` | environ 37 Mo | `swagger-ui-express` charge tout le JavaScript de l'interface Swagger **dans le serveur**, alors qu'il ne s'exécute que dans le navigateur. Le serveur envoie maintenant ces fichiers tels quels (`express.static`), et Swagger lit `swagger.yaml` lui-même |
| **Sharp dans un processus à part** (`scripts/optimize-worker.js`, lancé avec `fork`) | environ 25 Mo en permanence + les 50 Mo du traitement | Le serveur ne charge plus Sharp. Chaque image est convertie par un petit processus qui s'arrête ensuite : le système récupère **toute** sa mémoire (dans le serveur, elle restait occupée). Une file d'attente traite une seule image à la fois. Coût : environ 250 ms par envoi |
| **Options de Node** `--max-old-space-size=64 --max-semi-space-size=1` | environ 10 Mo, et plus de croissance | Par défaut, Node réserve de la mémoire selon la RAM de la machine, pas selon les besoins de l'application (environ 15 Mo d'objets JavaScript ici) |

Mesures en local (Mac) avec 100 requêtes GET puis l'envoi de 3 images de 8 Mo (JPEG 7000 × 5000 et PNG) :

| Mémoire du serveur | Avant | Après |
|---|---|---|
| Au démarrage | 125 Mo | 81 Mo |
| Après les requêtes GET | 138 Mo | 84 Mo |
| Pic pendant les envois | 186 Mo (et elle ne redescend pas) | 94 Mo (+ environ 85 Mo pendant 0,25 s pour le worker, puis rendus au système) |

Vérifier sur le serveur (SSH) : `ps -o rss,cmd -u $USER` (colonne `RSS` en Ko).

## Routes

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/users/login` | — | Connexion, renvoie `{ userId, token }` |
| `GET` | `/api/categories` | — | Liste des catégories |
| `GET` | `/api/works` | — | Liste des projets (avec leur catégorie) |
| `POST` | `/api/works` | Token | Ajout d'un projet (`multipart/form-data` : `image`, `title`, `category`) |
| `DELETE` | `/api/works/:id` | Token | Suppression d'un projet |

### Compte de test

| E-mail | Mot de passe |
| --- | --- |
| `sophie.bluel@test.tld` | `S0phie` (avec un zéro) |

## Lancer en local

Node.js **20.9 ou plus récent** (requis par Sharp).

```bash
npm install
cp .env.example .env        # puis remplacer TOKEN_SECRET par une longue chaîne aléatoire
npm start
```

L'API écoute sur http://localhost:5678 (Swagger : http://localhost:5678/api-docs/). Laisser ce terminal ouvert.

### Remettre les données de démo

```bash
sqlite3 database.sqlite < donnees-demo.sql
```

## Scripts

| Script | Rôle |
|---|---|
| `scripts/optimize-worker.js` | Optimise **une** image envoyée par un visiteur, puis s'arrête (lancé automatiquement par `middlewares/optimize-image.js`, pas à la main) |
| `scripts/convert-images.js` | Convertit en WebP (1200 px max, qualité 80) les `.png` / `.jpg` du dossier `images/` |
| `scripts/reset-demo.sh` | Remise à zéro de la démo : supprime les images envoyées par les visiteurs (toutes celles qui ne sont pas dans les données de démo), puis recharge les 11 projets |

## Mise en ligne (Alwaysdata)

- Site de type **Node.js**, commande `node --max-old-space-size=64 --max-semi-space-size=1 server.js` (options mémoire, voir [Économie de mémoire](#économie-de-mémoire)), répertoire de travail = dossier du projet.
- Variable d'environnement **`TOKEN_SECRET`** définie dans l'interface de l'hébergeur (pas de `.env` sur le serveur).
- L'adresse et le port d'écoute sont fournis par l'hébergeur (`IP` et `PORT`), lus par `server.js`.
- Dépendances : `npm ci --omit=dev` sur le serveur (les modules natifs Sharp et SQLite doivent être installés **pour Linux**, pas copiés depuis un Mac).
- Données de production : `donnees-demo-prod.sql` est généré à partir de `donnees-demo.sql` en remplaçant l'adresse locale par l'adresse publique :
  ```bash
  sed 's#http://localhost:5678#https://grd-raphael.alwaysdata.net#g' donnees-demo.sql > donnees-demo-prod.sql
  ```
- **Tâche planifiée** toutes les heures : `scripts/reset-demo.sh`.

## Structure

```
├── app.js                  # Express : sécurité (helmet, CORS), trust proxy, cache des images, routes
├── server.js               # Démarrage du serveur (PORT / IP)
├── config/ models/         # Sequelize + SQLite (database.sqlite)
├── controllers/            # Logique des routes
├── routes/                 # Définition des routes et ordre des middlewares
├── middlewares/
│   ├── auth.js             # Vérification du token JWT
│   ├── upload-rate-limit.js
│   ├── check-works-limit.js
│   ├── multer-config.js    # Réception du fichier dans le dossier temporaire (10 Mo max)
│   ├── optimize-image.js   # Lance scripts/optimize-worker.js (Sharp : format, pixels, redimensionnement, WebP)
│   └── checkWork.js        # Vérification des champs
├── docs/                   # Documentation Swagger (/api-docs/) : page, init.js et swagger.yaml
├── images/                 # Images servies (les 11 images de démo en WebP)
├── donnees-demo.sql        # Les 11 projets de démo
└── scripts/
```

## Pistes d'amélioration

- Supprimer le fichier image quand un projet est supprimé (`fs.unlink`) : aujourd'hui seule la ligne en base est effacée.
- Restreindre le CORS au domaine du front.
- Messages d'erreur homogènes (JSON) pour toutes les erreurs, y compris celles de multer.

## Auteur

[grdRaphael](https://github.com/grdRaphael) — formation Développeur Web, OpenClassrooms. API d'origine fournie par OpenClassrooms.
