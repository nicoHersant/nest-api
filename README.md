# MangaAPI — Cours NestJS · Bac+3

Ce cours consiste à construire une application NestJS permettant de fournir des données métier via une API REST professionnelle.
Le README consigne chaque étape avec les commandes CLI à exécuter, les signatures et consignes à implémenter, et les liens vers la documentation officielle NestJS.

> **Important** : ce document ne contient pas de corrections toutes faites. Chaque étape donne les signatures, les décorateurs attendus et les règles métier — à toi d'écrire le corps des méthodes.
> En cas de blocage réel, ton formateur peut débloquer une branche de correction pendant la séance — elle n'est pas communiquée à l'avance.

---

## Stack technique

| Outil | Version | Rôle |
|---|---|---|
| Node.js | 22 LTS | Runtime |
| NestJS | 11 | Framework |
| TypeScript | 5 | Langage |
| class-validator / class-transformer | — | Validation des DTOs |
| @nestjs/throttler | — | Rate limiting |
| @nestjs/swagger | — | Génération spec OpenAPI |
| Scalar | — | UI documentation |

---

## Programme du cours

Chaque étape correspond à un objectif fonctionnel. Garde cette table sous les yeux pour savoir où tu en es — elle ne donne aucune solution, juste le plan.

| Étape | Contenu |
|---|---|
| 0 | Scaffold initial NestJS |
| 1 | Configuration globale : prefix, CORS, throttler |
| 2 | JsonStorageService + mangas.json (50 mangas) + users.json |
| 3 | GET /mangas, GET /mangas/:id, HEAD, search, pagination |
| 4 | POST /auth/register, GET /auth/me, regenerate-key, delete account |
| 5 | Guard API key global + décorateur @Public |
| 6 | POST / PUT / PATCH / DELETE mangas avec persistence JSON |
| 7 | Guard admin + RBAC sur le CRUD mangas |
| 8 | DTOs complets, class-validator, PartialType, ValidationPipe |
| 9 | ExceptionFilter global, messages d'erreur sécurisés |
| 10 | @nestjs/swagger + Scalar UI |
| 11 | Tests unitaires, e2e, couverture |

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

## Installation

Tu pars d'un projet vierge, pas d'un clone : c'est le CLI qui génère la structure de départ (voir Étape 0).

```bash
nest new manga-api --package-manager npm
cd manga-api
git init
```

L'API sera disponible sur `http://localhost:3000/api` une fois l'Étape 1 en place.

---

## Comment lire ce README

- Les extraits `typescript` donnent des **signatures** (nom de classe/méthode, paramètres, décorateurs), jamais le corps d'une méthode métier.
- Les **consignes** en français sous chaque extrait décrivent le comportement attendu : cas d'erreur, codes HTTP, règles de calcul.
- Les commandes `nest generate` sont à taper toi-même — ne copie pas de fichier tout fait.
- Quand un fichier n'est pas montré (ex. `*.module.ts`), c'est que le CLI le génère déjà correctement : contente-toi de brancher les bons imports.

---

## Étapes du cours

---

### Étape 0 — Scaffold du projet

> 📖 [NestJS — First steps](https://docs.nestjs.com/first-steps) · [CLI overview](https://docs.nestjs.com/cli/overview)

```bash
nest new manga-api --package-manager npm
cd manga-api
git init
```

Structure générée par le CLI :

```
src/
├── app.controller.ts   ← route GET / par défaut
├── app.module.ts       ← module racine
├── app.service.ts
└── main.ts              ← point d'entrée, bootstrap()
```

Vérifie que `npm run start:dev` répond bien sur `http://localhost:3000` avant de continuer.

---

### Étape 1 — Configuration globale

> 📖 [NestJS — Modules](https://docs.nestjs.com/modules) · [Rate limiting](https://docs.nestjs.com/security/rate-limiting)

```bash
npm install @nestjs/throttler
```

**`src/main.ts`** — dans `bootstrap()`, avant `app.listen(...)`, ajoute dans cet ordre :

- un préfixe global `api` sur toutes les routes (méthode `setGlobalPrefix`)
- l'activation de CORS (méthode `enableCors`)

**`src/app.module.ts`** — enregistre `ThrottlerModule.forRoot(...)` dans les `imports` :

- une fenêtre de 1 minute (`ttl`, en millisecondes)
- une limite de 100 requêtes par IP sur cette fenêtre (`limit`)

Consigne de vérification :

```bash
npm run start:dev
# GET http://localhost:3000/api → 404 attendu (pas encore de route déclarée)
```

> ⚠️ Ne pose pas encore de `ValidationPipe` ici : le concept est traité à l'Étape 8, avec les paquets qui vont avec. Un `ValidationPipe` posé maintenant sans `class-validator` installé fait planter le démarrage de l'application.

---

### Étape 2 — Stockage JSON

> 📖 [NestJS — Modules](https://docs.nestjs.com/modules) · [Providers](https://docs.nestjs.com/providers)

```bash
nest generate module storage
nest generate service storage/storage --flat
```

**`src/storage/storage.module.ts`** — rends le module `@Global()` pour que `StorageService` soit injectable partout sans import explicite.

**`src/storage/storage.service.ts`** — signatures à implémenter :

```typescript
@Injectable()
export class StorageService {
  private readonly dataDir = path.join(__dirname, '..', 'data');

  read<T>(filename: string): T { }
  write<T>(filename: string, data: T): void { }
}
```

Consignes :
- `read` : lit le fichier `filename` dans `dataDir` en synchrone et retourne le contenu parsé.
- `write` : sérialise `data` en JSON indenté et écrit dans le fichier (aussi en synchrone).

> ⚠️ **Piège NestJS — assets non copiés dans `dist/`**
> Par défaut, NestJS ne copie pas les fichiers non-TypeScript lors de la compilation.
> `__dirname` pointe vers `dist/storage/` : sans configuration, `dist/data/` n'existe pas → **erreur au premier appel qui lit un fichier**.
>
> **Corrige tout de suite dans `nest-cli.json`** (ne remets pas ce correctif à plus tard, il doit être en place avant que tu écrives la moindre route qui lit `mangas.json` ou `users.json`) :

```json
{
  "compilerOptions": {
    "assets": ["**/*.json"],
    "watchAssets": true
  }
}
```

**`src/data/users.json`** — crée un compte admin pré-seedé avec cette structure :

```json
[
  {
    "id": "00000000-0000-0000-0000-000000000001",
    "email": "admin@mangaapi.dev",
    "role": "admin",
    "apiKey": "admin-manga-api-key-dev-only",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
]
```

**`src/data/mangas.json`** — crée un tableau d'au moins 50 entrées avec cette structure :

```json
{
  "id": 1,
  "title": "Berserk",
  "author": "Kentaro Miura",
  "genres": ["Dark Fantasy", "Action"],
  "status": "hiatus",
  "volumes": 41,
  "startYear": 1989,
  "publisher": "Hakusensha",
  "synopsis": "..."
}
```

`status` doit être l'une des valeurs : `ongoing`, `completed`, `hiatus`.

---

### Étape 3 — Lecture des mangas

> 📖 [NestJS — Controllers](https://docs.nestjs.com/controllers) · [Providers](https://docs.nestjs.com/providers)

```bash
nest generate module mangas
nest generate controller mangas
nest generate service mangas
```

**`src/mangas/mangas.service.ts`** — définis une interface `Manga` (champs visibles dans le JSON de l'Étape 2), puis les signatures suivantes :

```typescript
@Injectable()
export class MangasService {
  constructor(private readonly storage: StorageService) {}

  findAll(query: QueryMangaDto) { }
  findOne(id: number): Manga { }
  search(q: string): Manga[] { }
}
```

Consignes :
- `findAll` : applique les filtres `genre` (recherche insensible à la casse dans le tableau `genres`) et `status` (égalité stricte), puis pagine avec `page`/`limit` (valeurs par défaut à choisir). Retourne `{ data, total, page, limit }`.
- `findOne` : lève une `NotFoundException` si l'id n'existe pas → 404.
- `search` : filtre sur `title`, `author` et `synopsis`, recherche insensible à la casse.

**`src/mangas/dto/query-manga.dto.ts`** — classe simple pour l'instant (pas de décorateurs de validation avant l'Étape 8) :

```typescript
export class QueryMangaDto {
  page?: number;
  limit?: number;
  genre?: string;
  status?: string;
}
```

**`src/mangas/mangas.controller.ts`** — routes à déclarer :

```typescript
@Controller('mangas')
export class MangasController {
  @Get()               findAll(@Query() query: QueryMangaDto) { }
  @Get('search')        search(@Query('q') q: string) { }
  @Get(':id')            findOne(@Param('id', ParseIntPipe) id: number) { }
  @Head(':id')           headOne(@Param('id', ParseIntPipe) id: number, @Res() res: Response) { }
}
```

Consignes :
- `search` doit être déclarée **avant** `:id` (sinon NestJS route `search` vers le handler `:id` en pensant que c'est un id).
- `search` lève une `BadRequestException` si `q` est vide/absent → 400.
- `headOne` doit renvoyer un statut 200 sans body (utilise `res.status(...).send()` sans argument), et lever 404 si l'id n'existe pas.

Endpoints attendus :

```
GET  /api/mangas?page=1&limit=10&genre=Action&status=completed
GET  /api/mangas/search?q=naruto
GET  /api/mangas/:id
HEAD /api/mangas/:id
```

Codes HTTP couverts : `200`, `400`, `404`.

---

### Étape 4 — Authentification

> 📖 [NestJS — Controllers](https://docs.nestjs.com/controllers) · [Exception filters](https://docs.nestjs.com/exception-filters)

```bash
npm install uuid && npm install -D @types/uuid
nest generate module auth
nest generate controller auth
nest generate service auth
```

**`src/auth/auth.service.ts`** — signatures :

```typescript
@Injectable()
export class AuthService {
  constructor(private readonly storage: StorageService) {}

  register(email: string): { apiKey: string } { }
  getMe(apiKey: string) { }
  regenerateKey(apiKey: string): { apiKey: string } { }
  deleteAccount(apiKey: string): void { }
  findByApiKey(apiKey: string): User | undefined { }
}
```

Consignes :
- `register` : lève une `ConflictException` si l'email existe déjà → 409. Génère un `id` et un `apiKey` avec `uuid`, rôle `user` par défaut.
- `getMe` : retourne l'utilisateur associé à la clef (sans exposer de champs sensibles superflus).
- `regenerateKey` : remplace la clef existante par une nouvelle, persiste, retourne la nouvelle clef.
- `deleteAccount` : retire l'utilisateur du fichier et persiste.
- `findByApiKey` : simple recherche dans le tableau — cette méthode sera réutilisée par le guard de l'Étape 5.

**`src/auth/dto/register.dto.ts`** :

```typescript
export class RegisterDto {
  email: string;
}
```

**`src/auth/auth.controller.ts`** — routes à déclarer :

```typescript
@Controller('auth')
export class AuthController {
  @Post('register')       register(@Body() body: RegisterDto) { }   // → 201
  @Get('me')                getMe(@Request() req: ExpressRequest) { }
  @Post('regenerate-key')   regenerateKey(@Request() req: ExpressRequest) { }
  @Delete('account')        deleteAccount(@Request() req: ExpressRequest) { }  // → 204, HttpCode explicite
}
```

> À ce stade il n'y a pas encore de guard : `req.user` n'existe pas. Pour tester `getMe`/`regenerate-key`/`deleteAccount` maintenant, tu devras temporairement passer l'apiKey autrement (query param, par exemple) — ce sera remplacé proprement à l'Étape 5.

Codes HTTP couverts : `201`, `204`, `409`.

---

### Étape 5 — Guard API Key

> 📖 [NestJS — Guards](https://docs.nestjs.com/guards) · [Custom decorators](https://docs.nestjs.com/custom-decorators) · [Execution context](https://docs.nestjs.com/fundamentals/execution-context)

```bash
nest generate guard common/guards/api-key --flat
```

**`src/common/decorators/public.decorator.ts`** — décorateur qui pose une métadonnée lisible plus tard par le guard :

```typescript
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => /* SetMetadata(...) */;
```

**`src/common/guards/api-key.guard.ts`** :

```typescript
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean { }
}
```

Consignes :
- Lis la métadonnée `IS_PUBLIC_KEY` via `this.reflector.getAllAndOverride(...)` sur le handler et la classe. Si la route est publique, laisse passer.
- Sinon, récupère le header `X-API-Key` de la requête. Absent → `UnauthorizedException` (401).
- Cherche l'utilisateur correspondant via `AuthService.findByApiKey`. Introuvable → `ForbiddenException` (403).
- Attache l'utilisateur trouvé sur la requête (`request.user = ...`) pour que les handlers suivants (et l'Étape 7) puissent le lire.

**`src/app.module.ts`** — enregistre le guard globalement via `APP_GUARD`, **après** le `ThrottlerGuard` (l'ordre des providers `APP_GUARD` détermine l'ordre d'exécution).

Décore `POST /auth/register` avec `@Public()` — c'est la seule route qui doit rester accessible sans clef.

Codes HTTP couverts : `401` (clef absente), `403` (clef invalide).

---

### Étape 6 — CRUD mangas avec persistence

> 📖 [NestJS — Controllers](https://docs.nestjs.com/controllers)

**`src/mangas/mangas.service.ts`** — méthodes à ajouter :

```typescript
create(dto: CreateMangaDto): Manga { }
replace(id: number, dto: CreateMangaDto): Manga { }   // PUT — remplacement total
update(id: number, dto: UpdateMangaDto): Manga { }    // PATCH — fusion partielle
remove(id: number): void { }
```

Consignes :
- `create` : refuse un titre déjà existant (comparaison insensible à la casse) → `ConflictException` (409). L'id est généré automatiquement (max des ids existants + 1).
- `replace` : `NotFoundException` (404) si l'id n'existe pas ; tous les champs du DTO remplacent l'entrée sauf l'id, qui est conservé.
- `update` : 404 si absent ; seuls les champs fournis dans le DTO sont modifiés (indice : l'opérateur spread `{ ...existant, ...dto }`).
- `remove` : 404 si absent ; retire l'entrée du tableau et persiste.

**`src/mangas/dto/create-manga.dto.ts`** — classe simple pour l'instant (champs visibles dans le JSON de l'Étape 2, pas de décorateurs de validation avant l'Étape 8).

**`src/mangas/dto/update-manga.dto.ts`** — mêmes champs que `CreateMangaDto`, mais tous optionnels (tu peux dupliquer temporairement, `PartialType` sera introduit à l'Étape 8).

**`src/mangas/mangas.controller.ts`** — routes à ajouter :

```typescript
@Post()          create(@Body() body: CreateMangaDto) { }               // → 201, HttpCode explicite
@Put(':id')       replace(@Param('id', ParseIntPipe) id: number, @Body() body: CreateMangaDto) { }
@Patch(':id')     update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateMangaDto) { }
@Delete(':id')    remove(@Param('id', ParseIntPipe) id: number) { }      // → 204, HttpCode explicite
```

Codes HTTP couverts : `201`, `204`, `409`.

---

### Étape 7 — Guard Admin et RBAC

> 📖 [NestJS — Guards](https://docs.nestjs.com/guards) · [Custom decorators](https://docs.nestjs.com/custom-decorators)

```bash
nest generate guard common/guards/admin --flat
```

**`src/common/decorators/admin.decorator.ts`** — même principe que `@Public()` :

```typescript
export const IS_ADMIN_KEY = 'isAdmin';
export const AdminOnly = () => /* SetMetadata(...) */;
```

**`src/common/guards/admin.guard.ts`** :

```typescript
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean { }
}
```

Consignes :
- Lis la métadonnée `IS_ADMIN_KEY`. Si la route n'est pas marquée `@AdminOnly()`, laisse passer sans vérification.
- Sinon, lis `request.user` (garanti posé par `ApiKeyGuard`, qui s'exécute avant) et vérifie `role === 'admin'`. Sinon → `ForbiddenException` (403).

**`src/app.module.ts`** — ajoute `AdminGuard` dans les providers `APP_GUARD`, **après** `ApiKeyGuard` (il a besoin que `request.user` soit déjà posé).

Décore les 4 routes d'écriture de `MangasController` (`create`, `replace`, `update`, `remove`) avec `@AdminOnly()`.

Codes HTTP couverts : `403` (authentifié mais rôle insuffisant).

---

### Étape 8 — Validation

> 📖 [NestJS — Validation](https://docs.nestjs.com/techniques/validation) · [class-validator decorators](https://github.com/typestack/class-validator#validation-decorators)

```bash
npm install class-validator class-transformer
npm install @nestjs/mapped-types
```

**`src/main.ts`** — pose maintenant le `ValidationPipe` global dans `bootstrap()`, avec ces options : `whitelist`, `forbidNonWhitelisted`, `transform` (cherche leur rôle exact dans la doc avant de deviner).

**`src/mangas/dto/create-manga.dto.ts`** — ajoute les décorateurs `class-validator` pour respecter ces contraintes :

| Champ | Type | Contraintes |
|---|---|---|
| `title` | string | requis, non vide, max 200 caractères |
| `author` | string | requis, non vide, max 200 caractères |
| `genres` | string[] | tableau non vide, chaque élément est une string |
| `status` | enum | une des valeurs `ongoing` / `completed` / `hiatus` |
| `volumes` | int | minimum 1 |
| `startYear` | int | entre 1900 et l'année courante |
| `publisher` | string | requis, non vide, max 200 caractères |
| `synopsis` | string | requis, non vide, max 2000 caractères |

**`src/mangas/dto/update-manga.dto.ts`** — remplace ta classe dupliquée de l'Étape 6 par un `extends PartialType(CreateMangaDto)`.

**`src/mangas/dto/query-manga.dto.ts`** — ajoute la validation :

| Champ | Contraintes |
|---|---|
| `page` | optionnel, transformé en nombre, entier ≥ 1 |
| `limit` | optionnel, transformé en nombre, entier entre 1 et 50 |
| `genre` | optionnel, string |
| `status` | optionnel, une des valeurs de l'enum manga |

> Indice : pour transformer une query string (`"1"`) en nombre, il existe un décorateur de `class-transformer` dédié — cherche-le dans la doc plutôt que de le deviner.

Le `ValidationPipe` global déclenche automatiquement la validation sur tous les DTOs. Les erreurs produisent un `400 Bad Request` avec le détail des contraintes violées.

---

### Étape 9 — Gestion des erreurs

> 📖 [NestJS — Exception filters](https://docs.nestjs.com/exception-filters) · [Built-in HTTP exceptions](https://docs.nestjs.com/exception-filters#built-in-http-exceptions)

**`src/common/filters/http-exception.filter.ts`** :

```typescript
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void { }
}
```

Consignes :
- `@Catch()` sans argument capture toutes les exceptions, HTTP et non-HTTP.
- Récupère `response` et `request` via `host.switchToHttp()`.
- Si `exception instanceof HttpException` : récupère le status réel et le message (attention, `class-validator` renvoie ses messages dans un tableau — gère ce cas).
- Sinon (erreur non anticipée) : réponds en `500`, avec un message générique — **ne jamais exposer le détail de l'erreur au client**. Log le détail réel côté serveur uniquement (`Logger`).
- Réponds toujours au format uniforme :

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "...",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "path": "/api/mangas/999"
}
```

Enregistre le filtre globalement dans `main.ts` (`app.useGlobalFilters(...)`).

Codes HTTP couverts : `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`.

---

### Étape 10 — Documentation

> 📖 [NestJS — OpenAPI / Swagger](https://docs.nestjs.com/openapi/introduction) · [Scalar NestJS](https://guides.scalar.com/scalar/scalar-api-references/integrations/nestjs)

```bash
npm install @nestjs/swagger
npm install @scalar/nestjs-api-reference
```

**`src/main.ts`** — construis un `DocumentBuilder` (titre, description, version, sécurité `apiKey` sur le header `X-API-Key`), génère le document avec `SwaggerModule.createDocument`, puis monte :
- la spec JSON brute + une UI Swagger classique sur `api/swagger` (via `SwaggerModule.setup`)
- l'UI Scalar sur `api/docs`, pointée vers la spec JSON (`import` dynamique de `@scalar/nestjs-api-reference`)

**Décorateurs à ajouter sur les controllers** — pattern à répliquer sur chaque route :

```typescript
@ApiTags('Mangas')
@ApiSecurity('api-key')
@Controller('mangas')
export class MangasController {
  @ApiOperation({ summary: '...' })
  @ApiResponse({ status: 200, description: '...' })
  @ApiResponse({ status: 401, description: '...' })
  @Get()
  findAll(@Query() query: QueryMangaDto) { }
}
```

Adapte le `summary` et les `status`/`description` de chaque `@ApiResponse` aux codes HTTP réellement couverts par la route (revois les encarts "Codes HTTP couverts" des étapes précédentes).

**Décorateurs à ajouter sur les DTOs** — un `@ApiProperty({...})` par champ, avec au minimum un `example` et, pour les enums, la liste `enum`.

URLs attendues une fois l'étape terminée :

| URL | Contenu |
|---|---|
| `http://localhost:3000/api/docs` | UI Scalar (documentation interactive) |
| `http://localhost:3000/api/docs-json` | Spec OpenAPI brute (JSON) |
| `http://localhost:3000/api/swagger` | UI Swagger classique (backup) |

---

### Étape 11 — Tests

> 📖 [NestJS — Testing](https://docs.nestjs.com/fundamentals/testing)

Écris les tests unitaires (services, controllers, guards, filter) avec Jest et les mocks NestJS (`Test.createTestingModule`), puis un test e2e qui démarre l'application complète.

Structure attendue :

```
src/
├── app.controller.spec.ts
├── storage/
│   └── storage.service.spec.ts          ← read, write (fs mocké)
├── auth/
│   ├── auth.service.spec.ts             ← register, getMe, regenerateKey, deleteAccount, findByApiKey
│   └── auth.controller.spec.ts          ← délégation vers AuthService
├── mangas/
│   ├── mangas.service.spec.ts           ← findAll, search, findOne, create, replace, update, remove
│   └── mangas.controller.spec.ts        ← délégation + validation search
└── common/
    ├── guards/
    │   ├── api-key.guard.spec.ts        ← routes publiques, 401, 403, attache req.user
    │   └── admin.guard.spec.ts          ← @AdminOnly(), rôle user vs admin
    └── filters/
        └── http-exception.filter.spec.ts ← format d'erreur HTTP et non-HTTP

test/
└── app.e2e-spec.ts                      ← tests d'intégration sur toutes les routes
```

Consigne pour les tests de guards/filter : mock l'`ExecutionContext`/`ArgumentsHost` à la main plutôt que de démarrer une vraie application — c'est plus rapide et ça force à comprendre ce que NestJS injecte réellement dans ces objets.

```bash
npm test              # tous les tests unitaires
npm run test:watch    # mode watch
npm run test:cov       # rapport de couverture → coverage/lcov-report/index.html
npm run test:e2e       # tests e2e, données mockées
```

---

## Structure finale du projet

```
src/
├── main.ts
├── app.module.ts
├── app.controller.ts           ← health check GET /api
├── data/
│   ├── mangas.json
│   └── users.json
├── storage/
│   ├── storage.module.ts       ← @Global()
│   └── storage.service.ts      ← read<T> / write<T>
├── mangas/
│   ├── mangas.module.ts
│   ├── mangas.controller.ts
│   ├── mangas.service.ts
│   └── dto/
│       ├── create-manga.dto.ts
│       ├── update-manga.dto.ts  ← PartialType(CreateMangaDto)
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
    └── decorators/
        ├── public.decorator.ts
        └── admin.decorator.ts
```

---

## Tester l'API

### Compte admin (disponible dès le démarrage)

```
X-API-Key: admin-manga-api-key-dev-only
```

### Workflow de test avec Postman ou Scalar

```
1. POST /api/auth/register        body: { "email": "dev@example.com" }
                                   → 201 { "apiKey": "..." }

2. Ajouter le header X-API-Key: <apiKey> à toutes les requêtes suivantes

3. GET  /api/mangas                → 200 liste paginée
4. GET  /api/mangas/search?q=ber   → 200 résultats
5. GET  /api/mangas/1              → 200 détail
6. HEAD /api/mangas/1              → 200 sans body

# Routes admin uniquement (utiliser X-API-Key: admin-manga-api-key-dev-only)
7. POST   /api/mangas              body: { "title": "...", "author": "...", ... }  → 201
8. PATCH  /api/mangas/1            body: { "status": "completed" }  → 200
9. PUT    /api/mangas/1            body: { tous les champs }  → 200
10. DELETE /api/mangas/1           → 204
```

---

## Codes HTTP de référence

| Code | Signification | Contexte dans l'API |
|---|---|---|
| 200 | OK | Lecture ou mise à jour réussie |
| 201 | Created | Ressource créée (POST) |
| 204 | No Content | Suppression réussie (pas de body) |
| 400 | Bad Request | Paramètre ou body invalide |
| 401 | Unauthorized | Header `X-API-Key` absent |
| 403 | Forbidden | Clef valide mais rôle insuffisant |
| 404 | Not Found | Ressource inexistante |
| 409 | Conflict | Email ou titre de manga déjà utilisé |
| 422 | Unprocessable Entity | Données invalides sémantiquement |
| 429 | Too Many Requests | Rate limit dépassé (100 req/min) |
| 500 | Internal Server Error | Erreur serveur non anticipée |

---

## Liens documentation officielle NestJS

| Concept | Lien |
|---|---|
| Vue d'ensemble & First steps | [docs.nestjs.com/first-steps](https://docs.nestjs.com/first-steps) |
| Modules | [docs.nestjs.com/modules](https://docs.nestjs.com/modules) |
| Controllers | [docs.nestjs.com/controllers](https://docs.nestjs.com/controllers) |
| Providers / Services | [docs.nestjs.com/providers](https://docs.nestjs.com/providers) |
| Pipes & Validation | [docs.nestjs.com/pipes](https://docs.nestjs.com/pipes) |
| Guards | [docs.nestjs.com/guards](https://docs.nestjs.com/guards) |
| Exception Filters | [docs.nestjs.com/exception-filters](https://docs.nestjs.com/exception-filters) |
| Custom Decorators | [docs.nestjs.com/custom-decorators](https://docs.nestjs.com/custom-decorators) |
| Execution Context | [docs.nestjs.com/fundamentals/execution-context](https://docs.nestjs.com/fundamentals/execution-context) |
| Validation (class-validator) | [docs.nestjs.com/techniques/validation](https://docs.nestjs.com/techniques/validation) |
| Rate Limiting | [docs.nestjs.com/security/rate-limiting](https://docs.nestjs.com/security/rate-limiting) |
| OpenAPI / Swagger | [docs.nestjs.com/openapi/introduction](https://docs.nestjs.com/openapi/introduction) |
| Testing | [docs.nestjs.com/fundamentals/testing](https://docs.nestjs.com/fundamentals/testing) |
| CLI | [docs.nestjs.com/cli/overview](https://docs.nestjs.com/cli/overview) |
