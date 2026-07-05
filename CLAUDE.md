# CLAUDE.md — Directives projet Xéétali

## Identité
**Xéétali** — gestion critique des stocks de sang, Sénégal (contexte CNTS).
Des vies humaines sont en jeu → **zéro perte de données**. Chaque décision de code
privilégie la sûreté, l'intégrité des stocks et la traçabilité avant la vitesse.

## Non négociables
- **Transferts atomiques et testés** : toute opération modifiant un stock s'exécute dans
  une seule transaction (validation → décrément source → incrément cible → création de
  l'ordre). Toute erreur → `rollback` complet. Aucune modification partielle ne persiste.
- **Validation stricte des entrées** : Pydantic v2 sur toutes les routes (enum groupe
  sanguin, quantité entière strictement positive, source ≠ cible, hôpitaux existants).
- **Traçabilité de tout mouvement de stock** : chaque transfert est journalisé (horodatage
  + détails de l'ordre persisté) à des fins d'audit médical.
- **Aucune PII donneur en clair** dans les logs (UC-17) : numéros masqués type `77****89`,
  aucun envoi réel.
- **Zéro fuite d'info** : les erreurs renvoyées au client ne contiennent ni stack trace ni
  détail interne. **Zéro injection** : ORM exclusivement, jamais de SQL concaténé.

## Architecture
Modulaire : `models / schemas / routers / services / db`.
La **logique métier** (transferts, alertes) vit dans la couche `services`, **pas** dans les
routes. Les routers restent minces et délèguent.

## Conventions
- Type hints partout ; Pydantic v2 ; SQLAlchemy 2.0 (mapping déclaratif `Mapped[...]`).
- Commits conventionnels (`feat:`, `fix:`, `test:`, …).
- **Un test obligatoire pour toute règle métier.**
- Secrets via variables d'environnement (`pydantic-settings`) — aucun secret en dur.

## Périmètre MVP
Node Central : **UC-04** (transferts inter-hôpitaux), **UC-17** (mock alerte USSD/SMS).
**Hors scope** : IA/LSTM, Blockchain, IoT, authentification réelle, envoi SMS réel.

## Règle d'or
> Toute opération touchant un stock est **transactionnelle** et **couverte par un test**.
