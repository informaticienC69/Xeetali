# Xéétali — Node Central de gestion des stocks de sang

**« Joxal sa dërew, mu jox aye dund » — Donne ton sang, il donne la vie.**

Système de gestion critique des stocks de sang pour le réseau du **CNTS** (Centre
National de Transfusion Sanguine, Sénégal). Trois acteurs, un seul système : visibilité
du stock en temps réel, transferts inter-hôpitaux (**UC-04**), enregistrement de poches
avec QR Code (**UC-08**), et un parcours donneur complet et gamifié (**UC-14 à UC-19**).

> Des vies humaines sont en jeu → **zéro perte de données**. Toute opération touchant une
> poche est **transactionnelle** (atomique, rollback complet en cas d'erreur) et **couverte
> par un test**.

## Documentation

Ce README est le point d'entrée rapide. Pour aller plus loin :

| Document | Contenu |
| --- | --- |
| [`RAPPORT_PROJET.md`](./RAPPORT_PROJET.md) | Rapport complet : mission, acteurs, spécification des 27 cas d'usage, architecture, modèle de données, sécurité, API, déploiement |
| [`DIAGRAMMES_UML_REVERSE_ENGINEERING.md`](./DIAGRAMMES_UML_REVERSE_ENGINEERING.md) | Diagrammes de classes, ERD, cas d'utilisation, séquence, états, déploiement (rétro-conçus depuis le code) |
| [`GUIDE_UTILISATEURS.md`](./GUIDE_UTILISATEURS.md) | Mode d'emploi écran par écran pour chaque rôle |

## Décision d'architecture clé

**La poche (`BloodPouch`) est l'unique source de vérité du stock.** Aucune colonne
« quantité » à synchroniser nulle part : le stock d'un hôpital pour un groupe = **comptage
en direct des poches `DISPONIBLE`**. Enregistrer une poche augmente le stock ; un
transfert **réaffecte** des poches existantes ; « mettre à jour le stock » = changer un
statut. Aucune désynchronisation possible entre ce que dit l'écran et ce qui est
physiquement en stock.

## Acteurs & cas d'usage

| Acteur | Cas d'usage couverts |
| --- | --- |
| **Administrateur CNTS** | Tableau de bord national · carte des régions · transfert (UC-04) · campagne d'alerte nationale · CRUD comptes & établissements · configuration des seuils |
| **Personnel Médical** | Enregistrer une poche + QR (UC-08) · changer un statut · recherche d'urgence · vérifier une validité · émettre une demande de sang |
| **Donneur** (mobile-first) | Profil (UC-14) · points de collecte (UC-15) · rendez-vous (UC-16) · répondre aux alertes (UC-17) · historique (UC-18) · statistiques & classement gamifiés (UC-19) |

**Hors périmètre (délibérément) :** IA/prévision LSTM, Blockchain, IoT, USSD, envoi
SMS/Push réel — les alertes donneurs sont entièrement simulées (`envoi_reel: false`,
numéros systématiquement masqués `77****89`).

## Stack

| Couche | Technologie |
| --- | --- |
| Backend | FastAPI 0.139 · SQLAlchemy 2.0 (async) · Pydantic v2 · PostgreSQL 15 |
| Auth | JWT (`PyJWT`) · bcrypt 4.0.1 (`passlib`) · 3 rôles · rate limiting (`slowapi`) |
| QR Code | `qrcode[pil]` (PNG base64 data-URI) |
| Migrations | Alembic |
| Frontend | React 19 · TypeScript 5.7 · Vite 6 · TailwindCSS v4 · React Router 7 · TanStack Query |
| Cartographie | react-simple-maps (carte nationale admin) · Leaflet + itinéraire OSRM (espace donneur) |
| Graphiques | Recharts |
| Tests / CI | Pytest (39 tests, base SQLite en mémoire isolée) · Ruff · GitHub Actions |

## Architecture backend

```
backend/app/
  core/      config · security (hash + JWT) · deps (get_current_user, require_role)
             constants (compatibilité ABO/Rh, régions) · limiter · gamification
  models/    user · hospital · region · pouch · transfer · request · collection_point
             donor_profile · donation · appointment · alert · configuration
  schemas/   Pydantic v2 (requêtes/réponses) + enums métier
  services/  logique métier isolée et transactionnelle (poches, transferts, alertes,
             donneurs, admin, configuration…)
  routers/   endpoints HTTP minces (délèguent aux services, aucune logique métier)
  db/        base déclarative · engine · session par requête (get_db)
  tests/     suite pytest, une base SQLite en mémoire isolée par test
```

Détail complet du modèle de données et des flux : voir
[`DIAGRAMMES_UML_REVERSE_ENGINEERING.md`](./DIAGRAMMES_UML_REVERSE_ENGINEERING.md).

## Démarrage rapide (Docker Compose — recommandé)

C'est le mode de développement utilisé et vérifié pour ce projet : PostgreSQL, backend
et frontend tournent chacun dans leur conteneur, avec rechargement à chaud (modifier un
fichier suffit, pas besoin de relancer `docker compose`).

**Prérequis :** Docker + Docker Compose.

```bash
# 1) Première fois seulement : créer le volume Postgres nommé (déclaré "external"
#    dans docker-compose.yml, donc jamais supprimé par un `docker compose down -v`).
docker volume create xeetali_postgres_data

# 2) Démarrer toute la stack
docker compose up
```

Ceci enchaîne automatiquement :
1. `db` — PostgreSQL 15, jusqu'à ce qu'il soit prêt (healthcheck).
2. `db_setup` — applique les migrations Alembic puis peuple la base avec un jeu de
   démonstration réaliste (14 régions, 16 établissements, poches, donneurs, historique)
   si elle est vide. **Idempotent** : un redémarrage du stack ne réinitialise jamais des
   données réelles.
3. `backend` — API sur **http://localhost:8000** (documentation interactive sur `/docs`).
4. `frontend` — dashboard sur **http://localhost:5173**.

Pour réinitialiser complètement (revenir au jeu de démo d'origine) :
```bash
docker compose down -v && docker volume rm xeetali_postgres_data
docker volume create xeetali_postgres_data
docker compose up
```

## Alternative — lancer sans Docker

<details>
<summary>Backend (Python 3.13+)</summary>

```bash
cd backend
python -m venv .venv
# Windows PowerShell : .\.venv\Scripts\Activate.ps1
# Git Bash          : source .venv/Scripts/activate
# Linux/macOS       : source .venv/bin/activate
pip install -r requirements.txt

python seed.py                       # données de démo (hôpitaux, poches, donneurs)
uvicorn app.main:app --reload        # API + Swagger sur http://localhost:8000/docs
```

Par défaut la config pointe vers une base SQLite locale (`sqlite:///./xeetali.db`) —
définissez `DATABASE_URL` (Postgres) et `JWT_SECRET` dans un `.env` non committé pour
un usage réaliste. `bcrypt` est épinglé à `4.0.1` pour éviter un incident de
compatibilité `passlib`/`bcrypt` récent sur Python 3.13 ; `core/security.py` est
abstrait (`hash_password`/`verify_password`) si un repli sur `bcrypt` direct devenait
nécessaire.
</details>

<details>
<summary>Frontend (Node 20+)</summary>

```bash
cd frontend
npm install
# Le proxy Vite relaie /api vers 127.0.0.1:8002 par défaut — ne correspond pas au
# port 8000 utilisé par la commande uvicorn ci-dessus, à surcharger explicitement :
VITE_API_PROXY_TARGET=http://127.0.0.1:8000 npm run dev      # dashboard sur http://localhost:5173
```

**Lancez le backend avant le frontend.** L'interface adapte automatiquement ses écrans
et sa navigation au rôle du compte connecté.
</details>

## Tests & CI

```bash
cd backend && pytest -v     # 39 tests, base SQLite en mémoire isolée — jamais la base réelle
cd backend && ruff check .  # lint
cd frontend && npm run build  # vérification TypeScript + build
```

Ces trois commandes sont exactement celles exécutées par la CI GitHub Actions
(`.github/workflows/ci.yml`) à chaque push/PR sur `main`.

## Comptes de démonstration

Mot de passe commun : **`Password123!`**

| Rôle | Email |
| --- | --- |
| Administrateur CNTS | `admin@cnts.sn` |
| Personnel Médical (CNTS Dakar) | `medecin@cnts.sn` |
| Donneur (O-, Dakar, 7 dons) | `donneur@cnts.sn` |

7 comptes donneurs supplémentaires (Thiès, Saint-Louis, Kaolack, Louga, Ziguinchor…)
sont seedés avec le même mot de passe pour donner du relief au classement et au
ciblage des campagnes d'alerte — voir `backend/seed.py`.

## Principaux endpoints

| Méthode | Route | Rôle | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` · `/api/auth/login` | public | Inscription (donneur uniquement) / connexion (JWT) |
| GET | `/api/inventory` | authentifié | Stock live par hôpital, paginé |
| POST | `/api/pouches` | médical/admin | Enregistrer une poche + QR (UC-08) |
| GET | `/api/pouches/search` · `/api/pouches/{uid}/validity` | authentifié | Recherche / vérification de validité |
| PATCH | `/api/pouches/{uid}/status` | médical/admin | Changer un statut |
| POST | `/api/transfers` | admin | Transfert atomique inter-hôpitaux (UC-04) |
| POST | `/api/requests` · GET `/api/requests` | médical/admin · authentifié | Émettre / consulter les demandes de sang |
| GET/PUT | `/api/donors/me/profile` | donneur | Profil (UC-14) |
| GET | `/api/donors/me/donations` · `/api/donors/me/stats` · `/api/donors/leaderboard` | donneur | Historique, statistiques & classement gamifiés (UC-18/19) |
| GET | `/api/collection-points` | authentifié | Points de collecte (UC-15) |
| POST/GET | `/api/appointments` | donneur | Rendez-vous (UC-16) |
| POST | `/api/alerts` · `/api/admin/campaigns` | admin | Alerte ciblée / campagne nationale (UC-17) |
| POST | `/api/alerts/{id}/respond` | donneur | Réponse à une alerte |
| GET | `/api/config/public` · CRUD `/api/config` | authentifié · admin | Seuils système (stock idéal, gamification) |
| GET | `/api/admin/dashboard` · `/api/admin/analytics` · `/api/admin/stock-by-region` | admin | Tableaux de bord et carte nationale |
| CRUD | `/api/admin/users` · `/api/admin/hospitals` | admin | Gestion des comptes et établissements |
| GET | `/health` | public | Sonde de disponibilité |

Codes : `201` créé · `409` conflit / stock insuffisant · `422` invalide · `404`
inexistant · `403` rôle insuffisant · `401` non authentifié · `429` limite de
connexion dépassée.

## Sécurité & conformité

- **Atomicité** : chaque opération de stock (création, changement de statut, transfert)
  s'exécute dans une seule transaction ; toute erreur déclenche un rollback complet.
- **RBAC** : rôle relu depuis la base à chaque requête (`core/deps.require_role`), pas
  depuis le JWT — un changement de rôle prend effet immédiatement.
- **Auto-inscription verrouillée** : `POST /api/auth/register` ne peut créer que des
  comptes `DONNEUR` ; les comptes privilégiés sont exclusivement provisionnés par un
  administrateur via `/api/admin/users`.
- **Confidentialité (UC-17)** : aucun envoi réel, numéros de téléphone systématiquement
  masqués (`77****89`), jamais loggés en clair.
- **Compatibilité ABO/Rh** : matrice unique `core/constants.DONOR_COMPATIBILITY` pour le
  ciblage des donneurs.
- **Zéro fuite** : les erreurs client ne contiennent jamais de trace technique ni de
  détail interne (message générique, détail complet loggé côté serveur uniquement).
- **Zéro injection** : ORM exclusivement (SQLAlchemy `select()`), aucune requête SQL
  concaténée dans le dépôt.
- **Secrets via environnement** : clé JWT et identifiants base lus depuis l'environnement
  (jamais committés) — voir `RAPPORT_PROJET.md` pour les recommandations de durcissement
  avant une mise en production réelle.
