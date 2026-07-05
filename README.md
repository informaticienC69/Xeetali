# Xéétali — Node Central (MVP)

Infrastructure de gestion critique des stocks de sang au Sénégal (contexte **CNTS**).
Ce MVP couvre le **Node Central** : visibilité des stocks, coordination des transferts
inter-hôpitaux (**UC-04**) et simulation d'alertes donneurs USSD/SMS (**UC-17**).

> Vies humaines en jeu → zéro perte de données. Tout mouvement de stock est
> **transactionnel** (atomique, avec rollback) et **couvert par un test**.

## Périmètre

- ✅ Inventaire des stocks par hôpital et groupe sanguin
- ✅ Transferts inter-hôpitaux atomiques (UC-04)
- ✅ Mock d'alerte donneurs USSD/SMS, sans PII en clair (UC-17)
- ❌ Hors scope : IA/LSTM, Blockchain, IoT, authentification réelle, envoi SMS réel

## Stack

| Couche    | Technologie                                                        |
| --------- | ------------------------------------------------------------------ |
| Backend   | FastAPI · SQLAlchemy 2.0 · Pydantic v2 · SQLite (prêt PostgreSQL)  |
| Frontend  | React · Vite · TailwindCSS v4                                       |
| Tests     | Pytest · TestClient · SQLite en mémoire                            |

## Architecture backend

```
backend/app/
  models/    # ORM : Hospital, BloodInventory, TransferOrder
  schemas/   # Pydantic v2 (requêtes/réponses) + enums métier
  services/  # Logique métier isolée (transfert atomique, alerte mock)
  routers/   # Endpoints HTTP minces (délèguent aux services)
  db/        # Base déclarative, engine, session, dépendance get_db
```

## Prérequis

- Python **3.13+**
- Node **18+** et npm (pour le frontend)

## Lancer le backend

```bash
cd backend

# 1. Environnement virtuel + dépendances
python -m venv .venv
# Windows (PowerShell) : .\.venv\Scripts\Activate.ps1
# Windows (Git Bash)   : source .venv/Scripts/activate
# Linux/macOS          : source .venv/bin/activate
pip install -r requirements.txt

# 2. Données de démonstration (5 hôpitaux sénégalais + stocks)
python seed.py

# 3. Démarrer l'API (Swagger sur http://localhost:8000/docs)
uvicorn app.main:app --reload
```

### Endpoints

| Méthode | Route                | Description                                         |
| ------- | -------------------- | --------------------------------------------------- |
| GET     | `/api/inventory`     | Stocks regroupés par hôpital                        |
| POST    | `/api/transfers`     | Transfert atomique (UC-04)                          |
| POST    | `/api/alerts/ussd`   | Mock d'alerte donneurs (UC-17)                      |
| GET     | `/health`            | Sonde de disponibilité                              |
| GET     | `/docs`              | Documentation Swagger interactive                   |

Codes de réponse UC-04 : `201` succès · `409` stock insuffisant (aucun ordre créé) ·
`422` entrée invalide · `404` hôpital inexistant.

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

Le serveur de dev Vite relaie `/api` vers `http://localhost:8000` (proxy) : lancez donc
le backend **avant** le frontend. Le dashboard liste les stocks par hôpital et permet
d'initier un transfert, avec affichage explicite des erreurs (ex. `409 stock insuffisant`).

## Configuration

Via variables d'environnement (fichier `.env` optionnel dans `backend/`, **jamais commité**) :

| Variable        | Défaut                     | Description                          |
| --------------- | -------------------------- | ------------------------------------ |
| `DATABASE_URL`  | `sqlite:///./xeetali.db`   | Bascule PostgreSQL sans autre code   |
| `CORS_ORIGINS`  | `http://localhost:5173`    | Origines autorisées pour le dashboard |

## Sécurité & conformité

- **Atomicité** : décrément source + incrément cible + création d'ordre dans une seule
  transaction ; toute erreur → rollback complet.
- **Traçabilité** : chaque transfert persisté (horodatage) + log applicatif sans PII.
- **Confidentialité (UC-17)** : aucun envoi réel, numéros masqués (`77****89`).
- **Pas de fuite** : les erreurs client ne contiennent ni stack trace ni détail interne.
- **Zéro injection** : ORM exclusivement.
