# Xéétali — Guide utilisateurs

**« Joxal sa dërew, mu jox aye dund » — Donne ton sang, il donne la vie.**

Ce guide explique, écran par écran, comment utiliser Xéétali selon votre rôle : **Administrateur CNTS**, **Personnel médical**, ou **Donneur**. Aucune connaissance technique n'est nécessaire pour le suivre.

> Pour la documentation technique (architecture, modèle de données, API), voir `RAPPORT_PROJET.md` et `DIAGRAMMES_UML_REVERSE_ENGINEERING.md`.

---

## Sommaire

1. [Se connecter](#1-se-connecter)
2. [Prise en main générale](#2-prise-en-main-générale)
3. [Guide — Administrateur CNTS](#3-guide--administrateur-cnts)
4. [Guide — Personnel médical](#4-guide--personnel-médical)
5. [Guide — Donneur](#5-guide--donneur)
6. [Questions fréquentes](#6-questions-fréquentes)
7. [Comptes de démonstration](#7-comptes-de-démonstration)

---

## 1. Se connecter

Ouvrez l'application dans votre navigateur. Vous arrivez sur l'écran de connexion.

1. Saisissez votre **email** et votre **mot de passe**.
2. Cliquez sur l'icône en forme d'œil pour afficher/masquer votre mot de passe si besoin.
3. Cliquez sur **Se connecter**.

Vous êtes automatiquement dirigé vers votre espace, selon votre rôle : tableau de bord administrateur, espace médical, ou espace donneur.

**Si la connexion échoue** : un message rouge apparaît sous le formulaire (« Email ou mot de passe incorrect », ou « Connexion impossible. Backend démarré ? » si le serveur est injoignable). Après 5 tentatives en une minute, l'accès est temporairement bloqué (protection anti-piratage) — patientez une minute et réessayez.

**Comptes de démonstration** — trois boutons sur l'écran de connexion pré-remplissent automatiquement les champs (Admin CNTS, Personnel Médical, Donneur), voir §7 pour le détail. Cliquer sur un bouton remplit le formulaire ; vous devez ensuite cliquer vous-même sur **Se connecter**.

**Créer un compte** : il n'existe pas d'écran d'auto-inscription accessible directement dans l'application. Si vous êtes donneur et n'avez pas encore de compte, contactez un administrateur CNTS qui créera votre accès. Si vous êtes personnel médical, votre compte est créé par un administrateur et rattaché à votre établissement.

## 2. Prise en main générale

**Thème clair/sombre** : une icône (soleil / lune / écran) en haut de chaque page permet de basculer entre thème clair, thème sombre, ou suivre automatiquement le réglage de votre appareil. Votre choix est mémorisé.

**Déconnexion** : une icône de sortie est disponible en permanence dans le menu (bas de la barre latérale sur ordinateur, en-tête sur mobile).

**Sur ordinateur** (écran large) : une **barre latérale** à gauche donne accès à toutes les pages de votre rôle, avec votre nom et votre rôle affichés en bas.

**Sur mobile/tablette** (écran étroit) : un en-tête en haut affiche votre nom, et une **barre d'icônes flottante** en bas de l'écran remplace la barre latérale — appuyez sur une icône pour changer de page.

**Bandeau bas de page** : chaque écran affiche en pied de page une mention de conformité (« Données hébergées à Diamniadio · Conforme CDP loi 2008-12 ») rappelant que vos données sont hébergées au Sénégal et protégées selon la loi sénégalaise sur la protection des données personnelles.

---

## 3. Guide — Administrateur CNTS

Votre rôle vous donne une vue nationale : pilotage du stock, transferts entre hôpitaux, campagnes d'alerte, gestion des comptes et des établissements.

Menu (barre latérale) : **Command Center · Transferts · Alerte Nationale · Utilisateurs · Établissements**.

### 3.1 Command Center (tableau de bord)

Votre écran d'accueil. Tout ce qui s'y affiche est calculé en direct depuis la base de données — aucun chiffre n'est figé.

- **8 indicateurs clés** en haut de page : poches disponibles au niveau national, alertes actives (l'indicateur clignote s'il y en a), donneurs inscrits, poches expirant sous 7 jours (clignote si non nul), nombre total de transferts effectués, demandes de sang ouvertes (s'illumine en alerte au-delà de 5), dons collectés sur les 6 derniers mois, nombre d'établissements du réseau.
- **Carte du Sénégal interactive** : chaque région est colorée selon son niveau de stock (optimal / tension / critique / hors réseau, c'est-à-dire sans établissement rattaché). Deux modes d'affichage sont disponibles (Stock / Urgences), ainsi qu'un filtre par groupe sanguin qui recolore la carte selon la disponibilité de ce groupe précis. Survolez une région pour voir le détail par groupe sanguin ; cliquez sur une région pour ouvrir un panneau détaillé avec des raccourcis directs vers **Lancer alerte urgence** (vous envoie sur la page Alerte Nationale) et **Commander approvisionnement** (vous envoie sur la page Transferts).
- **Graphiques** : évolution des transferts sur 30 jours, dons collectés par mois sur 6 mois, répartition du stock national par groupe sanguin, répartition des poches par statut, top 8 des établissements les mieux fournis, répartition des donneurs par groupe sanguin, demandes de sang par niveau d'urgence.

Cette page est en **lecture seule** — pour agir, utilisez les autres pages du menu.

### 3.2 Transferts

Pour déplacer du stock d'un établissement excédentaire vers un établissement en tension.

1. Choisissez l'**hôpital source** et l'**hôpital cible** dans les listes déroulantes (ils doivent être différents).
2. Choisissez le **groupe sanguin** concerné.
3. Indiquez la **quantité** de poches à transférer.
4. Cliquez sur **Valider le transfert**.

Un message de confirmation apparaît (« Transfert #… COMPLETED : N poche(s) GROUPE »). Si le stock de l'hôpital source est insuffisant, un message d'erreur explicite l'indique et **aucune poche n'est déplacée** — le transfert échoue proprement, sans état intermédiaire.

En bas de la page, un **tableau croisé** liste tous les établissements et leur stock par groupe sanguin (colonne Total incluse) — utilisez la recherche pour filtrer par nom/localité et le bouton de tri pour classer par stock total croissant/décroissant. C'est votre outil pour repérer visuellement qui a du stock à donner et qui en a besoin, avant de lancer un transfert.

### 3.3 Alerte Nationale (campagne)

Pour mobiliser rapidement des donneurs compatibles avec un groupe sanguin en tension, à l'échelle nationale.

1. Choisissez le **groupe recherché** (celui du patient/receveur, pas celui des donneurs).
2. Choisissez le **canal de diffusion** (SMS ou notification Push).
3. Cliquez sur **Lancer la campagne**.

Le système calcule automatiquement quels groupes de donneurs sont compatibles (par exemple, un besoin en O- ne peut être couvert que par des donneurs O-, alors qu'un besoin en AB+ peut être couvert par tous les groupes). Le résultat affiche le nombre de donneurs notifiés, les groupes compatibles retenus, le message envoyé, et les numéros de téléphone concernés — **toujours masqués** (format `77****89`), jamais affichés en clair.

> **Important** : cette fonctionnalité est une **simulation**. Aucun SMS ni notification n'est réellement envoyé à ce jour — c'est explicitement indiqué à l'écran (« aucun envoi réel, numéros masqués »). Elle sert à démontrer et tester le ciblage, pas à contacter réellement les donneurs.

### 3.4 Utilisateurs

Gestion de tous les comptes de la plateforme (Administrateurs, Personnel médical, Donneurs).

- Le tableau liste chaque utilisateur avec son nom, son email et son rôle (affiché en pastille colorée). Utilisez la **recherche** (nom ou email) et le **filtre par rôle** pour retrouver un compte.
- **Créer un compte** : bouton **Nouvel utilisateur**, renseignez nom, email, mot de passe (8 caractères minimum), rôle, et éventuellement l'établissement de rattachement (utile pour le personnel médical). C'est la voie normale pour créer un compte donneur ou médical.
- **Supprimer un compte** : bouton de suppression sur la ligne concernée, une fenêtre de confirmation s'affiche avant toute suppression (action irréversible, le nom de l'utilisateur est rappelé explicitement dans la confirmation).

### 3.5 Établissements

Gestion du réseau d'hôpitaux, CHR et centres de collecte.

- Affichage en **cartes** (une par établissement) : identifiant, nom, région, type. Recherche par nom/région, filtre par type d'établissement.
- **Créer un établissement** : bouton **Nouvel établissement**, renseignez nom, région (parmi les 14 régions administratives du Sénégal), et type (Hôpital, CHR, ou une catégorie libre).
- **Supprimer un établissement** : icône de suppression sur la carte, confirmation obligatoire avant suppression.

---

## 4. Guide — Personnel médical

Votre rôle est centré sur les opérations de terrain dans **votre établissement** : enregistrer des poches, suivre le stock local, vérifier des poches, faire remonter des besoins.

Menu (barre latérale) : **Vue d'ensemble · Enregistrement · Stock & Urgence · Contrôle · Demandes**.

### 4.1 Vue d'ensemble

Votre tableau de bord personnel, centré sur votre établissement.

- Une salutation personnalisée (« Bonjour », « Bon après-midi » ou « Bonsoir » selon l'heure) avec la date du jour et le nom de votre établissement.
- Un bandeau **Priorités du moment** résume les demandes critiques en attente et les groupes sanguins en rupture, si applicable.
- 4 indicateurs : poches disponibles dans votre établissement, demandes ouvertes, demandes critiques, groupes en rupture (avec leur code affiché).
- Colonne **Stock** : votre stock local présenté par famille de groupe (A, B, AB, O), chaque groupe avec une barre de progression vers le seuil idéal et une étiquette de statut (OK / Faible / Rupture).
- Colonne **Actions prioritaires** : trois raccourcis directs (**Nouvelle poche**, **Vérifier UID**, **Demande sang**), et la liste des demandes ouvertes les plus urgentes de votre réseau.

### 4.2 Enregistrement (UC-08)

Pour enregistrer une nouvelle poche de sang collectée.

1. Choisissez le **groupe sanguin** en cliquant sur l'un des 8 boutons proposés.
2. Choisissez le **centre de prélèvement** (pré-rempli sur votre établissement).
3. Renseignez la **date de prélèvement** (aujourd'hui par défaut) et la **date de péremption** (42 jours plus tard par défaut, modifiable) — le nombre de jours restants s'affiche en direct, et le formulaire vous empêche de valider si la péremption n'est pas postérieure au prélèvement.
4. Cliquez sur **Créer la poche et générer l'UID**.

Le panneau de droite affiche immédiatement le résultat : l'**identifiant unique** (UID, format `XEE-XXXXXXXXXXXX`) et son **QR Code**, généré automatiquement. Un bouton **Exporter QR Code** permet de télécharger l'image pour l'imprimer et la coller sur la poche physique.

### 4.3 Stock & Urgence

Pour rechercher des poches précises dans l'ensemble du réseau (utile en urgence, pour localiser du stock compatible ailleurs).

- Filtrez par **statut** (Disponible par défaut), **groupe sanguin**, **hôpital**, ou recherchez directement un **UID**.
- Le tableau de résultats affiche, pour chaque poche : UID et date d'enregistrement, groupe, statut, hôpital et délai avant péremption (affiché en rouge si moins de 14 jours et toujours disponible), et les actions possibles.
- Pour une poche **disponible**, deux actions sont proposées : **Utiliser** (passe la poche au statut « utilisée », après confirmation) et **Périmée** (marque la poche comme périmée, après confirmation). Une poche qui n'est plus disponible n'a plus d'action proposée.
- Les résultats sont paginés (12 par page) avec des boutons Précédent/Suivant.

### 4.4 Contrôle

Pour vérifier rapidement la validité d'une poche à partir de son UID (scanné ou saisi manuellement).

1. Saisissez l'UID de la poche (majuscule automatique).
2. Cliquez sur **Vérifier**.

Le résultat affiche clairement si la poche est **valide et utilisable** (bandeau vert) ou **non utilisable** (bandeau rouge), avec le motif exact (« Poche périmée », « Poche non disponible (statut …) », « UID inconnu en base », etc.) et le détail (statut, date de péremption).

Vos **8 dernières vérifications** sont conservées localement sur votre appareil et listées sous le résultat — cliquez sur une entrée pour la revérifier instantanément.

### 4.5 Demandes

Deux usages sur cette page : consulter les demandes du réseau, ou en émettre une nouvelle.

**Consulter (vue par défaut)** : filtrez par statut (Ouverte par défaut), niveau d'urgence, ou groupe sanguin. Un compteur en haut de page signale le nombre de demandes critiques encore ouvertes.

**Émettre une nouvelle demande** : cliquez sur le bouton dédié pour ouvrir le formulaire.
1. Vérifiez/choisissez l'**hôpital demandeur** (pré-rempli sur votre établissement).
2. Choisissez le **groupe sanguin** requis.
3. Ajustez la **quantité** avec les boutons +/-.
4. Choisissez le **niveau d'urgence** (Normale, Urgente, Critique).
5. Un encart vous rappelle les groupes de sang compatibles pouvant se substituer si besoin.
6. Validez — la demande apparaît immédiatement dans la liste et remonte au tableau de bord national.

---

## 5. Guide — Donneur

Votre espace est pensé pour vous accompagner dans votre parcours de don : suivi de votre impact, prise de rendez-vous, réponse aux appels urgents, progression et récompenses.

Menu : **Accueil · Alertes · Rendez-vous · Mes dons · Profil** (barre latérale sur ordinateur, barre d'icônes flottante en bas sur mobile).

### 5.1 Accueil

Votre tableau de bord personnel et gamifié.

- **Carte principale** : votre niveau actuel (Nouveau donneur, Bronze, Argent, Or, Platine ou Diamant), votre rang parmi tous les donneurs, votre total de points, une barre de progression vers le niveau suivant, et un bouton **Partager** pour publier votre progression.
- **Bloc d'action** : si vous êtes **éligible à donner maintenant**, un bandeau vous invite directement à prendre rendez-vous. Sinon, un compte à rebours circulaire indique combien de jours vous séparent de votre prochaine éligibilité (délai de 90 jours entre deux dons), accompagné d'un message expliquant à quelle étape de récupération votre corps se trouve.
- **Bandeau d'urgence nationale** : si le pays fait face à un besoin critique, un bandeau apparaît avec le nombre de vies en attente, le groupe le plus critique, les régions concernées et une jauge de capacité.
- **Mon impact** : nombre de dons réalisés, vies potentiellement sauvées (environ 3 par don), volume total donné en mL — présentés avec une animation de comptage.
- **Mes badges** : vos badges obtenus et ceux restant à débloquer (affichés cadenassés), avec le seuil requis pour chacun.
- **Classement** : votre position et celle des meilleurs donneurs, votre ligne étant mise en évidence (« VOUS »).
- **Raccourcis** : accès rapide à votre prochain rendez-vous (avec le nombre de jours restants) et à votre **QR Code donneur personnel** — une carte d'identité numérique à présenter à l'accueil d'un centre de collecte pour vous identifier instantanément.

### 5.2 Alertes

La liste des appels aux dons actuellement actifs, avec un aperçu de la situation nationale (vies en attente, groupe critique, régions touchées, jauge de capacité).

Pour chaque alerte affichée, deux réponses possibles :
- **JE SUIS DISPONIBLE** — vous confirmez votre disponibilité ; des instructions logistiques s'affichent (présentez-vous au centre le plus proche avec une pièce d'identité).
- **Je ne peux pas** — votre indisponibilité est enregistrée sans obligation.

S'il n'y a aucune alerte en cours, un message rassurant l'indique.

### 5.3 Rendez-vous

Pour trouver un centre de collecte et réserver un créneau.

**Onglet Carte** : votre position est utilisée (avec votre autorisation navigateur) pour afficher les centres les plus proches sur une carte interactive, triés par distance. En dessous, une liste déroulante de centres proches (avec photo, distance, horaires) vous permet de sélectionner un centre directement. Une fois un centre choisi :
1. Un bouton **itinéraire** ouvre Google Maps pour vous guider jusqu'au centre.
2. Choisissez une **date** (à partir d'aujourd'hui) et une **heure**.
3. Cliquez sur **Confirmer mon don**.

**Onglet Mes Dons** : la liste de vos rendez-vous passés et à venir, présentée en frise chronologique avec le centre, la date, l'heure et le statut (Planifié / Honoré / Annulé).

### 5.4 Mes dons (historique)

Votre journal de dons complet.

- Un résumé global : nombre de vies sauvées estimées (dons × 3), nombre de dons, volume total en litres, et une indication claire si vous pouvez donner **aujourd'hui** ou dans combien de jours (calculée sur la base de votre dernier don + 56 jours).
- En dessous, une frise chronologique détaillant chaque don passé : date, groupe sanguin, volume en mL, et son impact estimé (« ~3 vies touchées »).

Si vous n'avez encore aucun don enregistré, un message vous l'indique simplement.

### 5.5 Profil

Pour créer ou mettre à jour vos informations personnelles.

- Une **carte d'identité numérique** stylisée récapitule vos informations en direct pendant que vous complétez le formulaire (nom, groupe sanguin, localité, téléphone, dernier don).
- Formulaire : **groupe sanguin**, **téléphone**, **ville/localité**, **date du dernier don** (facultatif si vous n'avez jamais donné via ce système).
- Cliquez sur **Synchroniser l'Identité** pour enregistrer.

> Si vous n'avez pas encore rempli ce formulaire, la plupart des autres fonctionnalités de votre espace (alertes, statistiques) resteront incomplètes tant que votre profil n'existe pas — c'est la première chose à faire après votre première connexion.

---

## 6. Questions fréquentes

**Je ne reçois pas de SMS après une campagne d'alerte, est-ce normal ?**
Oui. Les campagnes d'alerte de cette version de Xéétali sont des **simulations** : elles calculent qui devrait être contacté et le démontrent à l'écran, mais n'envoient aucun message réel.

**Je suis médecin, puis-je changer mon rôle moi-même ?**
Non. Seul un administrateur CNTS peut modifier le rôle ou l'établissement d'un compte, via la page **Utilisateurs**.

**J'ai oublié mon mot de passe, comment le réinitialiser ?**
Il n'existe pas aujourd'hui de fonction de réinitialisation en libre-service. Contactez un administrateur CNTS, qui peut modifier votre mot de passe depuis la page **Utilisateurs**.

**Pourquoi ma poche ne peut-elle pas être remise « disponible » après avoir été marquée « utilisée » par erreur ?**
C'est un comportement à connaître : à ce jour, l'application ne bloque techniquement aucune transition de statut (voir la note dans `RAPPORT_PROJET.md` §13) — un membre du personnel médical peut néanmoins la remettre manuellement au statut voulu via la page **Stock & Urgence**. Faites-le avec prudence et uniquement en cas d'erreur de saisie avérée.

**Le stock affiché est-il vraiment en temps réel ?**
Oui — chaque chiffre de stock affiché est recalculé à chaque chargement de page directement depuis les poches enregistrées en base, il n'existe aucun compteur figé à resynchroniser.

**Puis-je utiliser l'application sur mon téléphone ?**
Oui, l'interface s'adapte automatiquement (barre de navigation en bas de l'écran au lieu d'une barre latérale) pour les trois rôles.

---

## 7. Comptes de démonstration

Mot de passe commun : **`Password123!`**

| Email | Rôle | Contexte |
|---|---|---|
| `admin@cnts.sn` | Administrateur CNTS | Vue nationale complète |
| `medecin@cnts.sn` | Personnel médical | Rattaché à l'établissement « CNTS Dakar » |
| `donneur@cnts.sn` | Donneur | Groupe O-, localisé à Dakar, historique de 7 dons |

D'autres comptes donneurs de démonstration existent, répartis sur plusieurs villes du Sénégal (Thiès, Saint-Louis, Kaolack, Louga, Ziguinchor…), avec le même mot de passe, pour observer le classement et la carte nationale avec des données variées.

---

*Guide rédigé à partir du fonctionnement réel de l'application à date de ce document. En cas d'écart avec ce que vous observez à l'écran, l'application a pu évoluer depuis — signalez l'écart pour mise à jour de ce guide.*
