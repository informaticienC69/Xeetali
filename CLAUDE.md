# CLAUDE.md — Directives projet Xéétali

## Identité
**Xéétali** — gestion critique des stocks de sang, Sénégal (contexte CNTS).
Des vies humaines sont en jeu → **zéro perte de données**. La sûreté, l'intégrité des
stocks et la traçabilité priment sur la vitesse.

## Source de vérité
**La poche (`BloodPouch`) est l'unique source de vérité du stock.** Aucune colonne
quantité à synchroniser : le stock = **comptage en direct des poches `DISPONIBLE`**.
UC-08 crée une poche (stock +1) ; UC-04 réaffecte N poches ; « maj stock » = changement
de statut.

## Non négociables
- **Opérations de stock atomiques et testées** : toute modif (UC-04, UC-08, changement de
  statut) dans une seule transaction ; toute erreur → `rollback` complet.
- **Validation stricte** (Pydantic v2) : enum groupe sanguin, quantités entières > 0,
  source ≠ cible, entités existantes, dates cohérentes.
- **Compatibilité ABO/Rh** respectée via `core/constants.DONOR_COMPATIBILITY` (ciblage
  des alertes, éligibilité).
- **Traçabilité** de tout mouvement (ordres + changements de statut journalisés).
- **Aucune PII donneur en clair** dans les logs (numéros masqués `77****89`, aucun envoi réel).
- **Zéro fuite** (pas de stack trace au client) · **zéro injection** (ORM only) · **secrets
  via env** (dont clé JWT).

## Sécurité
JWT (`PyJWT`) + hash bcrypt (`passlib`, `bcrypt==4.0.1` épinglé). 3 rôles :
`ADMIN_CNTS`, `PERSONNEL_MEDICAL`, `DONNEUR`. Accès contrôlé par `core/deps.require_role`.

## Architecture
Modulaire : `models / schemas / routers / services / core (config, security, deps, constants)`.
La **logique métier** vit dans `services`, **pas** dans les routes (routers minces).

## Conventions
- Type hints partout ; Pydantic v2 ; SQLAlchemy 2.0 (`Mapped[...]`).
- Commits conventionnels. **Un test obligatoire pour toute règle métier.**

## Périmètre MVP
3 acteurs · UC-04 (transferts), UC-08 (poches+QR), UC-14/15/16/17/18 (donneurs) +
administration (dashboard, CRUD comptes/établissements, campagne).
**Hors scope** : IA/LSTM, Blockchain, IoT, USSD, envoi SMS/Push réel.

## Règle d'or
> Toute opération touchant une poche est **transactionnelle** et **couverte par un test**.
