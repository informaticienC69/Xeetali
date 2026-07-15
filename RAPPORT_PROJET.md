# Xéétali — Rapport de projet

**« Joxal sa dërew, mu jox aye dund » — Donne ton sang, il donne la vie.**

| | |
|---|---|
| **Nom du projet** | Xéétali — Node Central de gestion des stocks de sang |
| **Contexte** | Centre National de Transfusion Sanguine (CNTS), Sénégal |
| **Version applicative** | Backend `0.2.0` (`app/main.py`) · Frontend `0.1.0` (`xeetali-frontend`), affichée `v1.4.0` dans l'interface |
| **Documents liés** | [`DIAGRAMMES_UML_REVERSE_ENGINEERING.md`](./DIAGRAMMES_UML_REVERSE_ENGINEERING.md) (modèle de données et flux, en diagrammes) · [`GUIDE_UTILISATEURS.md`](./GUIDE_UTILISATEURS.md) (mode d'emploi par rôle) |

---

## Sommaire

1. [Mission et enjeu](#1-mission-et-enjeu)
2. [Acteurs et rôles](#2-acteurs-et-rôles)
3. [Périmètre fonctionnel](#3-périmètre-fonctionnel)
4. [Spécification fonctionnelle par cas d'usage](#4-spécification-fonctionnelle-par-cas-dusage)
5. [Architecture technique](#5-architecture-technique)
6. [Modèle de données](#6-modèle-de-données)
7. [Règles métier](#7-règles-métier)
8. [Sécurité](#8-sécurité)
9. [Surface d'API complète](#9-surface-dapi-complète)
10. [Interface utilisateur — architecture front](#10-interface-utilisateur--architecture-front)
11. [Déploiement et infrastructure](#11-déploiement-et-infrastructure)
12. [Tests et qualité](#12-tests-et-qualité)
13. [État du projet et limitations connues](#13-état-du-projet-et-limitations-connues)
14. [Glossaire](#14-glossaire)
15. [Annexes](#15-annexes)

---

## 1. Mission et enjeu

Xéétali est un système de gestion critique des stocks de sang pour le réseau du CNTS au Sénégal. La donnée manipulée conditionne directement des actes de transfusion — **une erreur applicative peut avoir des conséquences humaines**. Toute la conception du projet en découle : intégrité des données, cohérence métier et traçabilité priment sur la vitesse de développement.

Le système répond à quatre besoins concrets du réseau :

1. **Savoir en temps réel combien de poches de sang sont disponibles**, par groupe sanguin et par établissement, sans jamais risquer une désynchronisation entre « ce que dit l'écran » et « ce qui est physiquement en stock ».
2. **Déplacer du stock entre établissements** (UC-04) quand un hôpital est en tension et qu'un autre est excédentaire, de façon atomique — un transfert réussit intégralement ou pas du tout.
3. **Mobiliser les donneurs compatibles** en cas de besoin urgent (UC-17), en ciblant automatiquement par compatibilité ABO/Rh et localisation, sans jamais exposer leurs coordonnées en clair.
4. **Fidéliser les donneurs** via un parcours gamifié (niveaux, badges, classement, calcul d'éligibilité au prochain don) qui donne un retour concret et valorisant à un acte de don.

## 2. Acteurs et rôles

Le système distingue exactement **3 rôles**, portés par l'énumération `UserRole` (`backend/app/schemas/enums.py`) et contrôlés à chaque requête par `core/deps.require_role(...)` :

| Rôle | Qui | Rattachement | Responsabilités principales |
|---|---|---|---|
| **`ADMIN_CNTS`** | Administrateur national du CNTS | Aucun (vue nationale) | Pilotage stratégique : tableau de bord national, carte des régions, transferts inter-hôpitaux, campagnes d'alerte, gestion des comptes et des établissements, configuration système |
| **`PERSONNEL_MEDICAL`** | Personnel soignant d'un établissement | `User.hospital_id` (obligatoire en pratique) | Opérations de terrain : enregistrement de poches, changement de statut, vérification de validité, émission de demandes de sang |
| **`DONNEUR`** | Donneur de sang, grand public | Aucun (profil `DonorProfile` séparé) | Gestion de son profil, prise de rendez-vous, réponse aux alertes, consultation de son historique et de ses statistiques de gamification |

Un compte n'a **jamais plus d'un rôle**. Le passage d'un rôle à un autre (ex. promouvoir un donneur en personnel médical) se fait exclusivement via l'administration des comptes (`PATCH /api/admin/users/{id}`), jamais par le donneur lui-même.

## 3. Périmètre fonctionnel

### Dans le périmètre (MVP)

- **UC-04** — Transfert inter-hôpitaux de poches de sang.
- **UC-08** — Enregistrement d'une poche (génération UID + QR Code).
- **UC-09 à UC-13** — Cycle de vie de la poche (statut, recherche, validité), inventaire, demandes de sang.
- **UC-14 à UC-19** — Espace donneur complet : profil, points de collecte, rendez-vous, historique, statistiques et classement gamifiés.
- **UC-20 à UC-22** — Alertes donneurs ciblées par compatibilité ABO/Rh (campagne nationale ou locale).
- **UC-23 à UC-27** — Administration : tableau de bord national, carte des régions, CRUD comptes et établissements, campagne, configuration des seuils système.
- 3 acteurs, RBAC complet, authentification JWT.

### Hors périmètre (explicitement exclu)

- **Intelligence artificielle / prévision LSTM** de la demande.
- **Blockchain** pour la traçabilité (la traçabilité repose sur des tables relationnelles classiques + logs applicatifs).
- **IoT** (pas de capteur de température de poche, pas de scan RFID).
- **USSD** (pas d'accès pour téléphone non smartphone).
- **Envoi SMS/Push réel** — les alertes donneurs sont **entièrement simulées** : `envoi_reel: false` dans chaque réponse d'API, aucun fournisseur SMS/Push n'est intégré, les numéros sont systématiquement masqués (`77****89`) y compris dans les logs serveur.

## 4. Spécification fonctionnelle par cas d'usage

*(Numérotation alignée sur celle utilisée dans le code et les diagrammes UML — voir `DIAGRAMMES_UML_REVERSE_ENGINEERING.md` §3 pour la vue synthétique.)*

### UC-01 — Connexion
Email + mot de passe → JWT (HS256, 8h de validité) portant l'identité et servant de Bearer token sur toutes les routes protégées. Limité à 5 tentatives/minute par IP.

### UC-02 — Inscription publique (donneur)
Auto-inscription ouverte à tout visiteur, crée systématiquement un compte `DONNEUR` (le rôle n'est plus paramétrable côté client depuis le durcissement de sécurité appliqué en cours de projet — voir §8). Dans l'interface livrée, cette route existe côté API mais **aucun écran d'inscription n'est branché** ; les comptes donneurs de démonstration sont créés par script de seed, les comptes réels sont aujourd'hui provisionnés par un administrateur via UC-25.

### UC-04 — Transfert inter-hôpitaux de poches
Un administrateur choisit un hôpital source, un hôpital cible, un groupe sanguin et une quantité. Le système sélectionne les N poches `DISPONIBLE` les plus proches de la péremption (FIFO), les verrouille (`SELECT … FOR UPDATE SKIP LOCKED`, sûr en environnement concurrent), les réaffecte à l'hôpital cible et journalise un `TransferOrder`. Si le stock source est insuffisant, **rien n'est modifié** (409, transaction annulée intégralement).

### UC-08 — Enregistrement d'une poche
Le personnel médical saisit groupe sanguin, hôpital, date de prélèvement et date de péremption (validée strictement postérieure au prélèvement). Le système génère un UID unique (`XEE-XXXXXXXXXXXX`) et un QR Code (PNG encodé en base64) encodant cet UID, crée la poche au statut `DISPONIBLE`. Le stock de l'hôpital augmente mécaniquement de 1 — aucune étape de synchronisation manuelle.

### UC-09 — Changement de statut d'une poche
`DISPONIBLE → RESERVEE → UTILISEE`, ou `→ PERIMEE`. Réservé au personnel médical/admin. Chaque changement est journalisé (log applicatif avec ancien/nouveau statut).

### UC-10 — Recherche de poches
Filtrage par groupe sanguin, hôpital, statut — utilisé en situation d'urgence pour localiser rapidement du stock compatible.

### UC-11 — Vérification de validité d'une poche
Par UID (scanné via QR Code ou saisi manuellement) : existence en base, péremption, statut, avec un motif textuel explicite (« Poche périmée », « Poche non disponible (statut …) », « Poche valide et disponible »).

### UC-12 — Consultation de l'inventaire
Vue croisée hôpitaux × groupes sanguins, comptage en direct des poches `DISPONIBLE` — jamais une colonne stockée, toujours un `COUNT(*)` recalculé à chaque appel.

### UC-13 — Émission d'une demande de sang
Un hôpital signale un besoin (groupe, quantité, niveau d'urgence : Normale/Urgente/Critique). Alimente le tableau de bord national et la carte des régions.

### UC-14 — Profil donneur
Création/mise à jour : groupe sanguin, téléphone, localisation, date du dernier don. Un utilisateur `DONNEUR` n'a qu'un seul profil (contrainte unique en base).

### UC-15 — Points de collecte
Consultation des centres de don, filtrable par localité.

### UC-16 — Prise de rendez-vous
Un donneur choisit un point de collecte et une date/heure ; le rendez-vous est créé au statut `PLANIFIE`.

### UC-17 — Alertes donneurs (campagne)
Un administrateur lance une alerte ciblant un groupe sanguin receveur. Le système calcule automatiquement l'ensemble des groupes **donneurs compatibles** via la matrice ABO/Rh (`core/constants.DONOR_COMPATIBILITY`), sélectionne tous les profils donneurs correspondants (filtrés par localité si l'alerte est locale, ou nationale sinon), simule l'envoi (SMS ou Push) et retourne un résumé : nombre de donneurs notifiés, groupes compatibles, numéros masqués. **Aucun message n'est réellement envoyé.**

### UC-18 — Historique de dons
Liste chronologique des dons passés d'un donneur (date, groupe, volume en mL).

### UC-19 — Statistiques et classement (gamification)
Calculées à 100 % depuis les faits en base (nombre de dons, réponses aux alertes) — jamais de donnée fabriquée. Voir §7 pour le détail des règles (niveaux, badges, éligibilité).

### UC-20 à UC-22 — Réponse aux alertes
Un donneur consulte les alertes actives et répond « disponible » ou « indisponible » ; le système renvoie des instructions logistiques adaptées.

### UC-23 — Tableau de bord national (admin)
Agrégats en direct : stock national par groupe, nombre d'hôpitaux, de donneurs, de demandes ouvertes, d'alertes actives — plus un dashboard analytique complet (répartitions, séries temporelles sur 30 jours de transferts et 6 mois de dons, top 8 établissements par stock).

### UC-24 — Carte nationale par région
Stock agrégé par région administrative (les 14 régions officielles du Sénégal, toujours toutes affichées même sans établissement rattaché), comparé à une cible idéale configurable, avec un statut visuel (optimal / tension / critique / hors réseau).

### UC-25 — Gestion des comptes utilisateurs
CRUD complet réservé `ADMIN_CNTS` : création (nom, email, mot de passe, rôle, hôpital optionnel), modification partielle, suppression.

### UC-26 — Gestion des établissements
CRUD complet réservé `ADMIN_CNTS` : nom, région (parmi les 14 régions), type (Hôpital / CHR / Centre National / libre).

### UC-27 — Configuration système
Paramètres ajustables clé/valeur : seuil de stock idéal par groupe (`stock.ideal`, défaut 50), seuil de stock faible (`stock.low_threshold`, défaut 5), seuils de niveaux de gamification (5 paliers).

## 5. Architecture technique

### 5.1 Vue d'ensemble

```
┌─────────────────────┐        REST + JWT         ┌──────────────────────┐        SQL (async)        ┌─────────────┐
│   Frontend (React)   │ ────────────────────────► │   Backend (FastAPI)   │ ─────────────────────────► │ PostgreSQL  │
│  Vite dev server     │ ◄──────────────────────── │   Uvicorn ASGI        │ ◄───────────────────────── │  15-alpine  │
│  :5173                │        JSON                │  :8000                 │      psycopg (async)       │  :5432      │
└─────────────────────┘                            └──────────────────────┘                            └─────────────┘
```

Les trois composants tournent en conteneurs Docker Compose distincts (voir §11), avec rechargement à chaud en développement.

### 5.2 Stack technique complète

**Backend** (`backend/requirements.txt`, versions exactes épinglées) :

| Composant | Version | Rôle |
|---|---|---|
| Python | 3.13 | Langage |
| FastAPI | 0.139.0 | Framework HTTP asynchrone |
| Uvicorn[standard] | 0.50.0 | Serveur ASGI |
| SQLAlchemy | 2.0.51 | ORM async (`Mapped[...]`) |
| Pydantic | 2.13.4 | Validation de schémas |
| pydantic-settings | 2.14.2 | Configuration via variables d'environnement |
| passlib[bcrypt] + bcrypt | 1.7.4 / 4.0.1 | Hachage des mots de passe |
| PyJWT | 2.13.0 | Jetons JWT |
| qrcode[pil] | 8.2 | Génération de QR Codes |
| email-validator | 2.3.0 | Validation Pydantic des emails |
| alembic | 1.14.0 | Migrations de schéma |
| slowapi | 0.1.9 | Rate limiting |
| psycopg[binary] | 3.3.4 | Driver PostgreSQL async |
| aiosqlite | 0.20.0 | Driver SQLite async (tests/dev) |
| pytest / pytest-asyncio / httpx | 9.1.1 / 1.4.0 / 0.28.1 | Suite de tests |

**Frontend** (`frontend/package.json`) :

| Composant | Version | Rôle |
|---|---|---|
| React / React DOM | 19.0.0 | UI |
| TypeScript | 5.7.0 | Typage statique |
| Vite | 6.0.0 | Bundler / dev server |
| Tailwind CSS | 4.0.0 (`@tailwindcss/vite`) | Styles utilitaires |
| React Router | 7.18.1 | Routage côté client |
| TanStack React Query | 5.101.2 | Cache et synchronisation des appels API |
| Recharts | 3.9.2 | Graphiques du dashboard admin |
| react-simple-maps | 3.0.0 | Carte choroplèthe des régions (admin) |
| Leaflet + react-leaflet + leaflet-routing-machine | 1.9.4 / 5.0.0 / 3.2.12 | Carte réelle + itinéraire (espace donneur) |
| react-qr-code | 2.2.0 | QR Code d'identité donneur (généré côté client) |
| lucide-react | 1.23.0 | Iconographie |
| @fontsource/{inter,syne,dm-mono} | 5.2.x | Polices auto-hébergées (pas de CDN externe) |

Aucune librairie de state management globale (pas de Redux/Zustand) : état serveur via React Query, état UI via `useState`/Context (Auth, Thème, Toasts). Aucune librairie de formulaires (pas de react-hook-form/Formik) — formulaires HTML natifs avec validation `useState` + attributs HTML5.

### 5.3 Architecture backend — couches

```
routers/  (HTTP mince, aucune logique métier, aucune requête SQL directe)
   ↓ Depends()
services/ (logique métier, transactions atomiques, lève des exceptions typées)
   ↓
models/   (entités SQLAlchemy 2.0, aucune logique)
   ↓
db/       (engine, session par requête)

schemas/  (contrats Pydantic v2 : Create / Update / Read, validateurs métier)
core/     (transverse : config, sécurité JWT/bcrypt, RBAC, constantes ABO/Rh, rate limiting, gamification)
```

Détail complet des classes, relations et flux : voir `DIAGRAMMES_UML_REVERSE_ENGINEERING.md`.

**Gestion des erreurs** — taxonomie à trois niveaux, strictement séparée :
1. Les services lèvent des exceptions **métier** typées (`services/exceptions.py` : `NotFoundError`, `ConflictError`, `ForbiddenError`, `UnauthorizedError`, `ServiceError`, plus des sous-types nommés comme `HospitalNotFoundError`, `InsufficientStockError`).
2. `main.py` centralise leur traduction en réponses HTTP (404/409/403/401/400).
3. Un handler `Exception` générique final ne renvoie **jamais** de trace technique au client (message fixe « Erreur interne du serveur »), tout en journalisant la trace complète côté serveur.

### 5.4 Architecture frontend

**Routage** (`src/App.tsx`) — 17 routes, chacune protégée par un composant `Protected` inline qui vérifie l'authentification puis le rôle, et enveloppe la page dans le bon habillage (`Layout` à sidebar pour Admin/Médical, `DonorLayout` pour le Donneur). Un utilisateur connecté qui tente d'accéder à une route d'un autre rôle est redirigé vers **son propre** tableau de bord, jamais déconnecté. La page `/admin` (dashboard) est chargée en *lazy* (`React.lazy`) car elle embarque Recharts ; toutes les autres pages sont chargées immédiatement.

**Session** (`src/lib/auth.tsx`) — le JWT est conservé dans `localStorage` (clé `xeetali_token`) avec un instantané `{role, nom, userId, hospitalId}` sous `xeetali_session` pour restaurer l'affichage immédiatement au rechargement de page. Toute réponse `401` sur une route protégée (hors `/api/auth/*`) déclenche une déconnexion globale automatique via un handler enregistré au montage de `AuthProvider`.

**Habillage responsive** — le même jeu de composants sert desktop et mobile via un point de rupture à `1024px` (`lg`) : barre latérale fixe au-dessus, en-tête + barre d'onglets flottante en dessous. `DonorLayout` délègue directement à `Layout` en desktop (chrome strictement identique aux autres rôles) et ne diverge que sous `1024px`, où il affiche son propre habillage mobile distinctif (en-tête glassmorphique avec salutation + devise wolof, cloche d'alertes, barre d'onglets flottante en pilule).

**Thème** — clair / sombre / système, persisté en `localStorage`, réagit en direct au `prefers-color-scheme` du système en mode « système ».

## 6. Modèle de données

13 entités persistées, 10 énumérations métier, aucune colonne de quantité dénormalisée nulle part — **le stock est toujours un comptage en direct des poches**. Le détail complet (attributs, types, cardinalités, index) est dans `DIAGRAMMES_UML_REVERSE_ENGINEERING.md` §1-2 (diagramme de classes et ERD).

Résumé des entités : `User`, `Hospital`, `Region`, `BloodPouch`, `TransferOrder`, `BloodRequest`, `DonorProfile`, `Donation`, `Appointment`, `CollectionPoint`, `Alert`, `AlertResponse`, `Configuration`.

Deux migrations Alembic versionnées (`backend/alembic/versions/`) : le schéma initial, puis l'introduction ultérieure de la table `Region` et de la FK `Hospital.region_id` (avant cette migration, la localisation d'un hôpital était une chaîne libre).

## 7. Règles métier

### 7.1 La poche est l'unique source de vérité du stock
Aucune colonne « quantité » n'existe nulle part dans le schéma. Le stock d'un hôpital pour un groupe = `COUNT(*)` sur `blood_pouches WHERE hospital_id=… AND groupe_sanguin=… AND statut='DISPONIBLE'`. Enregistrer une poche (UC-08) l'incrémente mécaniquement ; changer son statut (UC-09) ou la transférer (UC-04) le fait varier sans jamais nécessiter de synchronisation manuelle.

### 7.2 Compatibilité ABO/Rh
Source unique : `core/constants.py::DONOR_COMPATIBILITY`, une matrice statique qui, pour chaque groupe **receveur**, énumère les groupes **donneurs** compatibles (règle érythrocytaire standard — O- donneur universel, AB+ receveur universel, Rh- ne reçoit que Rh-). Utilisée exclusivement par le ciblage des campagnes d'alerte (UC-17). Voir `DIAGRAMMES_UML_REVERSE_ENGINEERING.md` §9 pour la matrice complète illustrée.

### 7.3 Atomicité de toute opération de stock
Toute écriture touchant une poche (création, changement de statut, transfert) est encapsulée dans une transaction unique : succès complet ou `rollback` complet, jamais d'état intermédiaire. Le transfert (UC-04) verrouille explicitement les lignes sélectionnées (`FOR UPDATE SKIP LOCKED`) pour rester correct sous accès concurrent.

### 7.4 Confidentialité des données donneur
Aucun numéro de téléphone n'apparaît en clair dans une réponse d'alerte ni dans un log applicatif — masquage systématique au format `77****89` avant toute journalisation ou tout retour au client. Le classement des donneurs (UC-19) affiche des noms abrégés (« Awa N. ») plutôt que le nom complet.

### 7.5 Gamification — règles de calcul
Entièrement dérivée des faits en base (nombre de dons, réponses aux alertes), aucune valeur fabriquée.

- **Points** : `nb_dons × 100`.
- **Niveaux** (6 paliers, par nombre de dons cumulés) : Nouveau donneur (0) → Bronze (1) → Argent (3) → Or (5) → Platine (10) → Diamant (20).
- **Badges** : Premier don (1 don), Donneur régulier (3 dons), Donneur confirmé (5 dons), Donneur Or (10 dons), Héros CNTS (20 dons), Réactif (1 réponse à une alerte).
- **Éligibilité au prochain don** : délai minimal de 90 jours depuis le dernier don enregistré.
- **Impact estimé** : 1 don ≈ 3 vies (facteur de sensibilisation, affiché côté donneur).
- **Classement** : tous les donneurs sont classés par nombre de dons décroissant, y compris ceux à 0 don.

### 7.6 Seuils de stock configurables
`stock.ideal` (défaut 50 poches par groupe et par hôpital) sert de cible pour la carte régionale et les indicateurs de tension ; `stock.low_threshold` (défaut 5) déclenche l'affichage « stock faible » côté personnel médical. Modifiables par un administrateur (UC-27) sans redéploiement.

## 8. Sécurité

- **Authentification** : JWT signé HS256 (`PyJWT`), sujet = email, durée de vie 8 heures, transmis en en-tête `Authorization: Bearer`.
- **Mots de passe** : hachés `bcrypt` (version épinglée `4.0.1`) via `passlib.CryptContext`, jamais stockés ni renvoyés en clair.
- **RBAC** : chaque route sensible déclare les rôles autorisés via `core/deps.require_role(...)` ; le rôle est **relu depuis la base à chaque requête** (pas depuis le JWT), garantissant qu'un changement de rôle prend effet immédiatement.
- **Auto-inscription publique verrouillée** : `POST /api/auth/register` ne peut créer que des comptes `DONNEUR` — un champ `role` fourni par le client n'a plus aucun effet sur le rôle assigné (durcissement appliqué en cours de projet, avec test de régression dédié).
- **Rate limiting** : 5 tentatives par minute et par IP sur la connexion et l'inscription (`slowapi`).
- **Aucune fuite d'information** : toute exception non prévue renvoie un message générique au client ; le détail complet n'est journalisé que côté serveur.
- **Zéro injection SQL** : 100 % des accès base passent par l'ORM SQLAlchemy (`select()`), aucune concaténation de chaîne SQL nulle part dans le dépôt.
- **CORS** : origines explicitement listées (pas de wildcard), configurables par variable d'environnement.
- **Secrets** : lus depuis l'environnement (`pydantic-settings`, fichier `.env` non versionné) — le mécanisme est correct ; l'audit d'architecture (voir §13) note que la valeur utilisée pour l'environnement « production » du fichier `docker-compose.yml` doit être remplacée par un secret réel avant toute mise en production effective.

Un audit de sécurité et d'architecture complet, avec verdict de mise en production, a été mené sur ce projet — voir §13.

## 9. Surface d'API complète

Toutes les routes sont préfixées `/api`. Authentification : en-tête `Authorization: Bearer <jwt>`, sauf mention « public ».

| Domaine | Méthode & route | Rôle requis | Description |
|---|---|---|---|
| **Auth** | `POST /api/auth/register` | public | Inscription (crée toujours un compte `DONNEUR`) |
| | `POST /api/auth/login` | public | Connexion → JWT |
| **Inventaire** | `GET /api/inventory` | authentifié | Stock par hôpital, paginé (`skip`/`limit`) |
| **Poches** | `POST /api/pouches` | Médical, Admin | UC-08 enregistrement |
| | `GET /api/pouches/search` | authentifié | Recherche par groupe/hôpital/statut |
| | `GET /api/pouches/{uid}/validity` | authentifié | Vérification de validité |
| | `PATCH /api/pouches/{uid}/status` | Médical, Admin | Changement de statut |
| **Transferts** | `POST /api/transfers` | Admin | UC-04 |
| **Demandes** | `POST /api/requests` | Médical, Admin | Émission d'une demande |
| | `GET /api/requests` | authentifié | Liste des demandes |
| **Points de collecte** | `GET /api/collection-points` | authentifié | Liste, filtrable par localité |
| **Donneurs** | `GET /api/donors/me/profile` | Donneur | Profil courant |
| | `PUT /api/donors/me/profile` | Donneur | Créer/mettre à jour le profil |
| | `GET /api/donors/me/donations` | Donneur | Historique de dons |
| | `GET /api/donors/me/stats` | Donneur | Statistiques gamifiées |
| | `GET /api/donors/leaderboard` | Donneur | Classement |
| | `GET /api/donors/urgency` | authentifié | Urgence nationale en direct |
| **Rendez-vous** | `POST /api/appointments` | Donneur | Prise de RDV |
| | `GET /api/appointments` | Donneur | Mes rendez-vous |
| **Alertes** | `POST /api/alerts` | Admin | Lancement d'une alerte ciblée |
| | `GET /api/alerts` | authentifié | Alertes actives |
| | `POST /api/alerts/{id}/respond` | Donneur | Réponse à une alerte |
| **Configuration** | `GET /api/config/public` | authentifié | Seuils publics (stock idéal, seuil faible) |
| | `GET /api/config` / `GET /api/config/{key}` | Admin | Lecture complète |
| | `POST /api/config` / `PUT /api/config/{key}` / `DELETE /api/config/{key}` | Admin | CRUD des paramètres |
| | `POST /api/config/seed-defaults` | Admin | Réinitialise les valeurs par défaut |
| **Administration** | `GET /api/admin/dashboard` | Admin | Agrégats nationaux |
| | `GET /api/admin/analytics` | Admin | Dashboard analytique complet |
| | `GET /api/admin/stock-by-region` | Admin | Carte nationale |
| | `GET /api/admin/regions` | Admin | Les 14 régions |
| | `GET/POST/PATCH/DELETE /api/admin/users` | Admin | CRUD comptes |
| | `GET/POST/PATCH/DELETE /api/admin/hospitals` | Admin | CRUD établissements |
| | `POST /api/admin/campaigns` | Admin | Campagne nationale (force `localisation=null`) |
| **Système** | `GET /health` | public | Sonde de disponibilité |

Documentation interactive générée automatiquement par FastAPI (OpenAPI/Swagger) accessible sur l'instance en cours d'exécution à `/docs`.

## 10. Interface utilisateur — architecture front

Le détail écran par écran, action par action, est dans `GUIDE_UTILISATEURS.md`. Ce qui suit est la vue architecturale.

**Principe de conception** : chaque rôle a son propre jeu de pages sous `src/pages/{admin,medical,donor}/`, partageant un système de composants commun (`src/components/ui/`) mais avec une identité visuelle propre à chaque parcours — le donneur a l'expérience la plus « grand public » (gamification, cartes interactives, animations), l'administration et le médical ont une esthétique plus dense/« centre de contrôle ».

**Design system** : trois polices auto-hébergées (Syne pour les titres/logo, Inter pour le corps, DM Mono pour les données tabulaires/labels techniques), palette claire/sombre complète, aucune dépendance à un CDN de polices externe (conforme aux contraintes CSP strictes).

**Composants transverses notables** :
- `Modal` / `ConfirmModal` — système de fenêtres modales maison, accessible clavier (piège de focus, Échap pour fermer, restauration du focus).
- `ToastProvider` — notifications succès/erreur/info, auto-disparition.
- `DataTable`, `KpiTile`, `Badges` (`GroupBadge`, `StatusBadge`, `UrgencyBadge`), `Skeleton` — vocabulaire visuel cohérent sur tout l'admin/médical.
- `SenegalMap` (carte choroplèthe des 14 régions, admin uniquement) et `InteractiveMap` (carte Leaflet + itinéraire réel, espace donneur uniquement) — deux technologies de cartographie distinctes pour deux besoins distincts (vue stratégique nationale vs. géolocalisation individuelle).

**Points d'attention connus** (état réel du build actuel, à date de ce rapport) :
- La page « Points de collecte » (`/donor/points`) est routée et fonctionnelle mais n'a **aucune entrée de navigation** dans la barre latérale ni la barre d'onglets mobile du donneur — accessible uniquement par lien direct.
- Le composant `AlertCenter` du tableau de bord admin (liste des demandes urgentes à router) a son code de récupération de données présent mais son rendu visuel n'est pas branché dans le JSX retourné — la section n'apparaît donc pas à l'écran dans le build actuel.
- Aucun écran d'inscription publique n'est branché dans l'interface (le donneur type entre dans le système via un compte provisionné par un administrateur) bien que la route API existe et soit fonctionnelle.

## 11. Déploiement et infrastructure

Orchestration via **Docker Compose** (`docker-compose.yml`, racine du dépôt), 4 services :

1. **`db`** — PostgreSQL 15 alpine, healthcheck `pg_isready`, volume nommé externe `xeetali_postgres_data` (survit à `docker compose down -v`).
2. **`db_setup`** — conteneur à exécution unique : `alembic upgrade head && python seed.py`. Démarre seulement une fois `db` en bonne santé ; le backend attend que ce conteneur se termine avec succès avant de démarrer à son tour.
3. **`backend`** — FastAPI/Uvicorn, code monté en bind-mount avec `--reload` (modification d'un fichier = rechargement automatique, pas besoin de relancer `docker compose`), port `8000`.
4. **`frontend`** — serveur de développement Vite, code monté en bind-mount, `CHOKIDAR_USEPOLLING=true` pour un watch fiable à travers la frontière Windows-hôte/Linux-conteneur, port `5173`.

**Idempotence du seed** : `seed.py` vérifie qu'aucun hôpital n'existe déjà avant de peupler la base — un redémarrage du stack ne réinitialise jamais des données réelles (sauf appel explicite `python seed.py --force`).

**Jeu de données de démonstration** : 14 régions, 16 établissements (répartition réaliste, dont 3 sur Dakar), plusieurs centaines de poches réparties avec un mix réaliste de statuts (~78 % disponibles, 10 % réservées, 8 % utilisées, 4 % périmées), 8 profils donneurs avec historiques de dons variés, 45 transferts répartis sur 30 jours, 24 demandes de sang, 3 comptes de démonstration (voir §15).

## 12. Tests et qualité

Suite de tests `pytest` + `pytest-asyncio`, exécutée contre une base **SQLite en mémoire** isolée par test (fixture `db_session`, `StaticPool`), avec une application FastAPI complète servie via `httpx.AsyncClient`/`ASGITransport` — les tests exercent la vraie pile HTTP → routeur → service → ORM, pas des appels de fonction isolés.

**5 fichiers de tests**, organisés par domaine métier :
- `test_auth.py` — inscription, connexion, contrôle d'accès par rôle (y compris un test de non-régression garantissant qu'un rôle fourni par le client à l'inscription est bien ignoré).
- `test_admin.py` — tableau de bord, CRUD comptes/établissements, analytics, carte régionale, campagne nationale.
- `test_donors_alerts.py` — profil donneur, points de collecte, rendez-vous, ciblage ABO/Rh des alertes, masquage des numéros, réponse aux alertes, statistiques et classement gamifiés.
- `test_pouches.py` — enregistrement (UID/QR), unicité, cohérence des dates, reflet dans l'inventaire, changement de statut, validité.
- `test_transfers.py` — transfert réussi, stock insuffisant (aucune modification), source=cible rejetée, hôpital inexistant, émission de demande.

**Intégration continue** (`.github/workflows/ci.yml`) : à chaque push/PR sur `main`, deux jobs parallèles — `test-backend` (lint Ruff + suite `pytest` complète sur SQLite en mémoire) et `build-frontend` (`npm ci` + `npm run build`, qui exécute la vérification TypeScript via `tsc -b`).

## 13. État du projet et limitations connues

Un **audit d'architecture indépendant**, couvrant les 18 axes usuels d'une revue pré-production (architecture, transactions, SQLAlchemy, scalabilité, sécurité OWASP, validation, gestion d'erreurs, journalisation, tests, dette technique, production readiness, conformité aux règles projet), a été mené sur ce dépôt. Verdict : plusieurs constats critiques ont été identifiés et corrigés en direct pendant l'audit (escalade de privilèges sur l'inscription publique, perte silencieuse de données sur la configuration système, suite de tests non fiable en environnement d'intégration continue, incohérence des seuils de gamification) ; deux constats critiques restent ouverts et nécessitent une décision produit/infrastructure avant mise en production réelle :

- Le secret de signature JWT et les identifiants PostgreSQL de l'environnement « production » du fichier `docker-compose.yml` sont actuellement des valeurs par défaut committées au dépôt — à remplacer par un secret réel avant toute exposition publique.
- Le changement de statut d'une poche (`PATCH /api/pouches/{uid}/status`) n'est protégé par aucune machine à états : rien n'empêche techniquement de faire repasser une poche déjà utilisée ou périmée au statut « disponible ». La correction nécessite de valider avec le métier CNTS la table exacte des transitions autorisées.

L'audit complet, avec chaque constat cité par fichier et ligne, noté par sévérité, et accompagné d'un plan d'amélioration priorisé, est disponible séparément (rapport d'audit dédié, hors du présent document).

## 14. Glossaire

| Terme | Signification |
|---|---|
| **CNTS** | Centre National de Transfusion Sanguine (Sénégal) |
| **Poche** (`BloodPouch`) | Unité physique de sang collectée, tracée par UID unique et QR Code — l'unique source de vérité du stock |
| **UID** | Identifiant unique lisible d'une poche, format `XEE-XXXXXXXXXXXX` |
| **ABO/Rh** | Système de groupes sanguins (A, B, AB, O) croisé avec le facteur Rhésus (+/-) déterminant la compatibilité de transfusion |
| **CHR** | Centre Hospitalier Régional |
| **UC** | Use Case — cas d'utilisation |
| **RBAC** | Role-Based Access Control — contrôle d'accès par rôle |
| **JWT** | JSON Web Token — jeton d'authentification signé |
| **Wolof** | Langue véhiculaire du Sénégal ; la devise de l'application (« Joxal sa dërew, mu jox aye dund ») y est écrite |

## 15. Annexes

### 15.1 Comptes de démonstration (mot de passe commun : `Password123!`)

| Email | Rôle | Détail |
|---|---|---|
| `admin@cnts.sn` | `ADMIN_CNTS` | Vue nationale |
| `medecin@cnts.sn` | `PERSONNEL_MEDICAL` | Rattaché à « CNTS Dakar » |
| `donneur@cnts.sn` | `DONNEUR` | Profil O-, Dakar, 7 dons historiques |

7 autres comptes donneurs de démonstration existent (Thiès, Saint-Louis, Kaolack, Louga, Ziguinchor…), mêmes identifiants de mot de passe, listés dans `backend/seed.py`.

### 15.2 Commandes de démarrage

```bash
docker compose up            # démarre db + db_setup + backend + frontend
# Frontend : http://localhost:5173
# Backend  : http://localhost:8000  (docs interactives : /docs)
```

### 15.3 Documents complémentaires

- **`DIAGRAMMES_UML_REVERSE_ENGINEERING.md`** — diagrammes de classes, ERD, cas d'utilisation, séquence, états, composants/déploiement, activité.
- **`GUIDE_UTILISATEURS.md`** — mode d'emploi détaillé par rôle, écran par écran.

---

*Rapport rédigé par lecture exhaustive du code source (backend et frontend) à date de ce document. Toute évolution fonctionnelle ou technique doit être répercutée ici pour qu'il reste fiable.*
