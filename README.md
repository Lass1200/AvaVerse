# AvaVerse

AvaVerse est une application web de création d'avatars SVG. Elle permet à un utilisateur de créer une identité visuelle personnalisée sans utiliser sa vraie photo, puis de soumettre son avatar à une validation administrateur avant téléchargement.

## Fonctionnalités principales

- inscription et connexion par pseudo ;
- création d'un avatar à partir d'éléments SVG ;
- aperçu en temps réel pendant la personnalisation ;
- bibliothèque personnelle avec filtres par statut ;
- téléchargement uniquement après validation ;
- espace administrateur pour approuver ou refuser les avatars ;
- catalogue SVG administrable.

## Organisation du projet

- `frontend/` : interface utilisateur réalisée avec React et Vite ;
- `backend/` : API REST Symfony connectée à MongoDB ;
- `backend/src/avatar/` : éléments SVG utilisés pour composer les avatars.

## Lancement en local

### Backend

```bash
cd backend
composer install
cp .env.example .env
symfony server:start --port=8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Le site est ensuite accessible à l'adresse :

```text
http://127.0.0.1:5173/
```

## Comptes et configuration

Les variables de connexion à MongoDB et les clés JWT sont à renseigner dans `backend/.env`. Le fichier `.env.example` sert uniquement de modèle de configuration.

## Notes de projet

Le projet a été développé dans le cadre du projet tuteuré PU3IN307. L'objectif principal est de fournir un parcours complet : création d'avatar, soumission, modération et téléchargement du SVG validé.
