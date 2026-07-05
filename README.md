# Xéétali — Node Central (MVP complet)

Infrastructure de gestion critique des stocks de sang au Sénégal (contexte **CNTS**).
Système multi-acteurs : visibilité des stocks, transferts inter-hôpitaux (**UC-04**),
enregistrement de poches avec QR (**UC-08**), et parcours donneur complet
(**UC-14/15/16/17/18**).

> Vies humaines en jeu → zéro perte de données. Tout mouvement de stock est
> **transactionnel** (atomique, rollback) et **couvert par un test**.

## Décision d'architecture clé

**La poche (`BloodPouch`) est l'unique source de vérité du stock.** Il n'existe aucune
colonne « quantité » à synchroniser : le stock d'un hôpital pour un groupe = **comptage
en direct des poches `DISPONIBLE`**. Enregistrer une poche augmente le stock ; un
transfert **réaffecte** des poches ; « mettre à jour le stock » = changer un statut.

## Acteurs & cas d'usage

| Acteur | Cas d'usage couverts |
| --- | --- |
| **Administrateur CNTS** | Tableau de bord national · transfert (UC-04) · campagne d'alerte · CRUD utilisateurs & établissements |
| **Personnel Médical** | Enregistrer une poche + QR (UC-08) · mettre à jour un statut · recherche d'urgence · vérifier une validité · émettre une demande |
| **Donneur** (mobile-first) | Profil (UC-14) · points de collecte (UC-15) · rendez-vous (UC-16) · répondre aux alertes (UC-17) · historique (UC-18) |

**Hors périmètre :** IA/LSTM, Blockchain, IoT, USSD, envoi SMS/Push réel (mock uniquement).

## Stack

| Couche | Technologie |
| --- | --- |
| Backend | FastAPI · SQLAlchemy 2.0 · Pydantic v2 · SQLite (prêt PostgreSQL) |
| Auth | JWT (`PyJWT`) · bcrypt (`passlib`) · 3 rôles (`ADMIN_CNTS`, `PERSONNEL_MEDICAL`, `DONNEUR`) |
| QR Code | `qrcode[pil]` (PNG base64 data-URI) |
| Frontend | React 19 · Vite 6 · TailwindCSS v4 · React Router 7 (mobile-first) |
| Tests | Pytest · TestClient · SQLite en mémoire |

## Architecture backend

```
backend/app/
  core/      config · security (hash + JWT) · deps (get_current_user, require_role) · constants (compatibilité ABO/Rh)
  models/    user · hospital · pouch · transfer · request · collection_point · donor_profile · appointment · alert · donation
  schemas/   Pydantic v2 (requêtes/réponses) + enums métier
  services/  logique métier isolée (poches, transferts, alertes, donneurs, admin…)
  routers/   endpoints HTTP minces (délèguent aux services)
  db/        base déclarative · engine · session · get_db
```

## Prérequis
- Python **3.13+**
- Node **18+** et npm

## Lancer le backend

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

> **Note sécurité JWT** : la clé de signature vient de la variable d'environnement
> `JWT_SECRET` (valeur de dev par défaut). Définissez-la en production dans un `.env`
> (jamais committé) ou l'environnement.

> **Note compatibilité** : `passlib` est utilisé avec `bcrypt==4.0.1` (épinglé) pour
> éviter un incident de compatibilité `passlib`/`bcrypt` récent sur Python 3.13. La
> couche `core/security.py` est abstraite (`hash_password` / `verify_password`), le repli
> sur la lib `bcrypt` directe serait trivial si nécessaire.

## Lancer les tests

```bash
cd backend
pytest -v        # base SQLite en mémoire, jamais la base réelle
```

## Lancer le frontend

```bash
cd frontend
npm install
npm run dev      # dashboard sur http://localhost:5173
```

Le serveur Vite relaie `/api` vers `http://localhost:8000` (proxy) : **lancez le backend
avant le frontend**. L'interface adapte ses vues au rôle du compte connecté.

## Comptes de démonstration

Mot de passe commun : **`Password123!`**

| Rôle | Email |
| --- | --- |
| Administrateur CNTS | `admin@cnts.sn` |
| Personnel Médical | `medecin@cnts.sn` |
| Donneur | `donneur@cnts.sn` |

(4 donneurs supplémentaires réalistes sont seedés pour le ciblage des alertes.)

## Principaux endpoints

| Méthode | Route | Rôle | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` · `/api/auth/login` | public | Inscription / connexion (JWT) |
| GET | `/api/inventory` | authentifié | Stock live par hôpital |
| POST | `/api/pouches` | médical | Enregistrer une poche + QR (UC-08) |
| PATCH | `/api/pouches/{uid}/status` | médical | Changer un statut |
| GET | `/api/pouches/search` · `/api/pouches/{uid}/validity` | authentifié | Recherche / validité |
| POST | `/api/transfers` | admin | Transfert atomique (UC-04) |
| POST | `/api/requests` | médical | Demande de sang |
| GET/PUT | `/api/donors/me/profile` | donneur | Profil (UC-14) |
| GET | `/api/collection-points` | authentifié | Points de collecte (UC-15) |
| POST | `/api/appointments` | donneur | Rendez-vous (UC-16) |
| POST | `/api/alerts` · `/api/alerts/{id}/respond` | admin / donneur | Alerte + réponse (UC-17) |
| GET | `/api/donors/me/donations` | donneur | Historique (UC-18) |
| GET | `/api/admin/dashboard` · CRUD `/api/admin/{users,hospitals}` · `/api/admin/campaigns` | admin | Administration |

Codes : `201` créé · `409` stock insuffisant / conflit · `422` invalide · `404` inexistant · `403` rôle · `401` non authentifié.

## Sécurité & conformité
- **Atomicité** : réaffectation de poches + création d'ordre dans une seule transaction ; toute erreur → rollback.
- **Traçabilité** : ordres de transfert et changements de statut journalisés (audit médical).
- **Confidentialité (UC-17)** : aucun envoi réel, numéros masqués (`77****89`), aucun numéro en clair loggé.
- **Compatibilité ABO/Rh** : matrice `DONOR_COMPATIBILITY` pour le ciblage des donneurs.
- **Pas de fuite** : les erreurs client ne contiennent ni stack trace ni détail interne.
- **Zéro injection** : ORM exclusivement. **Secrets via env** (JWT).
