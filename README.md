# MangaAPI — Cours NestJS · M2 Ingénierie Logicielle

Ce cours consiste à construire un nouveau repot git et une application NestJS permettant de fournir des données métier.  
Le README.md contient la suite de commandes nécessaires pour construire l'application.  
Le depot git de référence est disponible ici : https://github.com/nicoHersant/nest-api.  
Vous y trouverez différentes branches correspondant aux étapes de construction de l'application.

Objectif :
API REST pour professionnels construite en NestJS, servant des données de mangas.
Projet pédagogique progressif.

---

## Stack technique

| Outil | Version | Rôle |
|---|---|---|
| Node.js | 22 LTS | Runtime |
| NestJS | 11 | Framework |
| TypeScript | 5 | Langage |
| class-validator | — | Validation des DTOs |
| @nestjs/throttler | — | Rate limiting |
| @nestjs/swagger | — | Génération spec OpenAPI |
| Scalar | — | UI documentation |

---

## Branches pédagogiques

Chaque branche est un état stable et fonctionnel de l'application.
En cas de blocage, récupérer (ou copier / coller un bout de code) la branche de l'étape courante :

```bash
git clone https://github.com/nicoHersant/nest-api.git
cd nest-api
git fetch origin
git checkout step/XX-nom-etape
npm i && npm run start:dev
```

| Branche | Contenu |
|---|---|
| `main` | Scaffold initial NestJS (ce fichier) |
| `step/01-setup` | Configuration globale : CORS, prefix, throttler, pipes, filters |
| `step/02-storage` | JsonStorageService + mangas.json (50 mangas) + users.json |
| `step/03-mangas-read` | GET /mangas, GET /mangas/:id, HEAD, search, pagination |
| `step/04-auth` | POST /auth/register, GET /auth/me, regenerate-key, delete account |
| `step/05-api-key-guard` | Guard API key global + décorateur @Public |
| `step/06-mangas-write` | POST / PUT / PATCH / DELETE mangas avec persistence JSON |
| `step/07-admin-guard` | Guard admin + RBAC sur le CRUD mangas |
| `step/08-validation` | DTOs complets, class-validator, ValidationPipe global |
| `step/09-error-handling` | ExceptionFilter global, messages d'erreur sécurisés |
| `step/10-documentation` | @nestjs/swagger + Scalar UI |

---

## Prérequis

```bash
node --version   # v22.x
npm --version    # v10.x
nest --version   # v11.x

# Installer le CLI NestJS globalement si besoin
npm install -g @nestjs/cli
```

---

## Étapes du cours

---

### Étape 0 — Scaffold du projet (`main`)

```bash
nest new manga-api --package-manager npm
cd manga-api
git init
```

Structure générée par le CLI :

```
src/
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts
```

---

### Étape 1 — Configuration globale (`step/01-setup`)

**Objectifs :** prefix global, CORS, ValidationPipe global, ThrottlerModule.

```bash
npm install @nestjs/throttler
```

Modifications dans `main.ts` :
- `app.setGlobalPrefix('api')`
- `app.enableCors()`
- `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))`

Ajout de `ThrottlerModule` dans `app.module.ts` :
- 100 requêtes maximum par minute par IP.

```bash
# Vérifier que le serveur démarre sans erreur
npm run start:dev
# GET http://localhost:3000/api → 404 (normal, pas encore de route)
```

---

### Étape 2 — Stockage JSON (`step/02-storage`)

**Objectifs :** service de lecture/écriture JSON partagé, données initiales.

```bash
nest generate module storage
nest generate service storage/storage --flat
```

Fichiers de données a créer dans `src/data/` :
- `mangas.json` — 50 mangas célèbres
- `users.json` — admin pré-seedé

`JsonStorageService` doit exposer :
- `read<T>(filename): T` — lecture synchrone
- `write<T>(filename, data: T): void` — écriture atomique

---

### Étape 3 — Lecture des mangas (`step/03-mangas-read`)

**Objectifs :** premier module métier, GET endpoints, query params.

```bash
nest generate module mangas
nest generate controller mangas
nest generate service mangas
```

Endpoints a implémenter :

```
GET  /api/mangas?page=1&limit=10&genre=Action&status=completed
GET  /api/mangas/search?q=naruto
GET  /api/mangas/:id
HEAD /api/mangas/:id
```

Codes HTTP couverts : `200`, `400`, `404`.

---

### Étape 4 — Authentification (`step/04-auth`)

**Objectifs :** création de compte, gestion de la clef API.

```bash
npm install uuid
npm install -D @types/uuid

nest generate module auth
nest generate controller auth
nest generate service auth
```

Endpoints a implémenter :

```
POST   /api/auth/register        → 201 { apiKey }
GET    /api/auth/me              → 200 { user }
POST   /api/auth/regenerate-key  → 200 { apiKey }
DELETE /api/auth/account         → 204
```

Codes HTTP couverts : `201`, `204`, `409`.

---

### Étape 5 — Guard API Key (`step/05-api-key-guard`)

**Objectifs :** protéger toutes les routes, exposer @Public pour les exceptions.

```bash
nest generate guard common/guards/api-key --flat
```

Fonctionnement :
- Le guard lit le header `X-API-Key`
- Vérifie que la clef existe dans `users.json`
- Expose `@Public()` pour les routes ne nécessitant pas d'auth (ex: `/auth/register`)

Codes HTTP couverts : `401` (clef absente), `403` (clef invalide).

---

### Étape 6 — CRUD mangas avec persistence (`step/06-mangas-write`)

**Objectifs :** verbes HTTP POST/PUT/PATCH/DELETE, écriture dans le JSON.

Endpoints a implémenter :

```
POST   /api/mangas        → 201
PUT    /api/mangas/:id    → 200
PATCH  /api/mangas/:id    → 200
DELETE /api/mangas/:id    → 204
```

Codes HTTP couverts : `201`, `204`, `409` (titre déjà existant).

---

### Étape 7 — Guard Admin et RBAC (`step/07-admin-guard`)

**Objectifs :** contrôle d'accès par rôle, composition de guards.

```bash
nest generate guard common/guards/admin --flat
```

- POST/PUT/PATCH/DELETE sur `/mangas` → rôle `admin` requis
- GET → rôle `user` ou `admin`

Codes HTTP couverts : `403` (authentifié mais non autorisé).

---

### Étape 8 — Validation (`step/08-validation`)

**Objectifs :** DTOs typés, validation à la frontière du système.

```bash
npm install class-validator class-transformer
```

DTOs a implémenter :
- `CreateMangaDto` — tous les champs requis validés
- `UpdateMangaDto` (`PartialType` de `CreateMangaDto`) — champs optionnels
- `QueryMangaDto` — query params typés et validés

Codes HTTP couverts : `422` (données valides mais incohérentes), `400` (validation échouée).

---

### Étape 9 — Gestion des erreurs (`step/09-error-handling`)

**Objectifs :** filtre d'exception global, messages sécurisés et cohérents.

Format de réponse d'erreur uniforme :

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Manga with id 999 not found",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "path": "/api/mangas/999"
}
```

Codes HTTP couverts : panel complet `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`.

---

### Étape 10 — Documentation (`step/10-documentation`)

**Objectifs :** spec OpenAPI générée automatiquement, UI Scalar.

```bash
npm install @nestjs/swagger
npm install @scalar/nestjs-api-reference
```

- Spec OpenAPI disponible sur `/api/docs-json`
- UI Scalar disponible sur `/api/docs`

Décorateurs a utiliser :
- `@ApiTags()` sur les controllers
- `@ApiOperation()`, `@ApiResponse()` sur les endpoints
- `@ApiProperty()` sur les DTOs
- `@ApiSecurity('api-key')` pour documenter l'authentification

---

## Structure finale du projet

```
src/
├── main.ts
├── app.module.ts
├── data/
│   ├── mangas.json
│   └── users.json
├── storage/
│   ├── storage.module.ts
│   └── storage.service.ts
├── mangas/
│   ├── mangas.module.ts
│   ├── mangas.controller.ts
│   ├── mangas.service.ts
│   └── dto/
│       ├── create-manga.dto.ts
│       ├── update-manga.dto.ts
│       └── query-manga.dto.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── dto/
│       └── register.dto.ts
└── common/
    ├── guards/
    │   ├── api-key.guard.ts
    │   └── admin.guard.ts
    ├── filters/
    │   └── http-exception.filter.ts
    ├── interceptors/
    │   └── response.interceptor.ts
    └── decorators/
        └── public.decorator.ts
```

---

## Tester l'API avec Postman

1. Créer un compte : `POST /api/auth/register` avec `{ "email": "...", "password": "..." }`
2. Récupérer la clef API dans la réponse
3. Ajouter le header `X-API-Key: <votre-clef>` à toutes les requêtes suivantes

Compte admin disponible directement (voir `src/data/users.json`).

---

## Codes HTTP de référence

| Code | Signification | Contexte dans l'API |
|---|---|---|
| 200 | OK | Lecture réussie |
| 201 | Created | Ressource créée |
| 204 | No Content | Suppression réussie |
| 400 | Bad Request | Paramètre ou body invalide |
| 401 | Unauthorized | Header `X-API-Key` absent |
| 403 | Forbidden | Clef valide mais rôle insuffisant |
| 404 | Not Found | Ressource inexistante |
| 409 | Conflict | Email ou titre de manga déjà utilisé |
| 422 | Unprocessable Entity | Données invalides sémantiquement |
| 429 | Too Many Requests | Rate limit dépassé (100 req/min) |
| 500 | Internal Server Error | Erreur serveur non anticipée |
