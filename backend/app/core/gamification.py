"""Règles de gamification du parcours donneur (niveaux, badges, points).

Tout est dérivé de faits en base (nombre de dons, réponses aux alertes) — aucune
donnée fabriquée. Ce module ne fait que définir les seuils et les calculs purs.
Les seuils peuvent être surchargés par la configuration en base de données.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

POINTS_PAR_DON = 100
VIES_PAR_DON = 3  # estimation de sensibilisation (1 don ≈ 3 vies)
DELAI_ELIGIBILITE_JOURS = 90  # intervalle minimal entre deux dons


@dataclass(frozen=True)
class BadgeDef:
    code: str
    label: str
    description: str
    metric: str  # "dons" | "reponses"
    seuil: int


# Paliers de niveau selon le nombre de dons (borne basse incluse).
DEFAULT_LEVELS: list[tuple[int, str]] = [
    (0, "Nouveau donneur"),
    (1, "Bronze"),
    (3, "Argent"),
    (5, "Or"),
    (10, "Platine"),
    (20, "Diamant"),
]

DEFAULT_BADGES: list[BadgeDef] = [
    BadgeDef("premier_don", "Premier don", "Réalisez votre tout premier don", "dons", 1),
    BadgeDef("regulier", "Donneur régulier", "Atteignez 3 dons", "dons", 3),
    BadgeDef("confirme", "Donneur confirmé", "Atteignez 5 dons", "dons", 5),
    BadgeDef("or", "Donneur Or", "Atteignez 10 dons", "dons", 10),
    BadgeDef("heros", "Héros CNTS", "Atteignez 20 dons", "dons", 20),
    BadgeDef("reactif", "Réactif", "Répondez à une alerte d'urgence", "reponses", 1),
]

# Variables globales pouvant être surchargées par la configuration
LEVELS: list[tuple[int, str]] = DEFAULT_LEVELS.copy()
BADGES: list[BadgeDef] = DEFAULT_BADGES.copy()


async def load_gamification_config(db: AsyncSession) -> None:
    """Charge les configurations de gamification depuis la base de données."""
    from app.services.configuration_service import get_config_value

    global LEVELS, BADGES

    # Charger les seuils de niveaux
    level_thresholds = []
    for i in range(1, 7):  # Jusqu'à 6 niveaux
        threshold = await get_config_value(db, f"gamification.level_{i}_threshold")
        if threshold is not None:
            level_thresholds.append(threshold)

    if level_thresholds:
        # Reconstruire LEVELS avec les seuils personnalisés
        custom_levels = [(0, "Nouveau donneur")]
        level_names = ["Bronze", "Argent", "Or", "Platine", "Diamant"]
        for i, threshold in enumerate(level_thresholds):
            if i < len(level_names):
                custom_levels.append((threshold, level_names[i]))
        LEVELS = custom_levels

    # Charger les seuils de badges (optionnel - pour l'instant on garde les défauts)
    # Les badges pourraient être rendus configurables dans une version future


@dataclass(frozen=True)
class LevelProgress:
    index: int
    nom: str
    dons_avant_niveau_suivant: int
    progression: float  # 0..1 dans le palier courant


def level_for(nb_dons: int) -> LevelProgress:
    """Détermine le niveau et la progression vers le palier suivant."""
    seuils = [s for s, _ in LEVELS]
    index = 0
    for i, s in enumerate(seuils):
        if nb_dons >= s:
            index = i
    nom = LEVELS[index][1]
    if index >= len(LEVELS) - 1:
        return LevelProgress(index=index, nom=nom, dons_avant_niveau_suivant=0, progression=1.0)
    base, nxt = seuils[index], seuils[index + 1]
    span = nxt - base
    progression = (nb_dons - base) / span if span else 1.0
    return LevelProgress(
        index=index,
        nom=nom,
        dons_avant_niveau_suivant=max(0, nxt - nb_dons),
        progression=round(min(1.0, max(0.0, progression)), 3),
    )


def points_for(nb_dons: int) -> int:
    return nb_dons * POINTS_PAR_DON


def evaluate_badges(nb_dons: int, nb_reponses: int) -> list[dict]:
    """Retourne l'état (obtenu/non) de chaque badge."""
    metrics = {"dons": nb_dons, "reponses": nb_reponses}
    return [
        {
            "code": b.code,
            "label": b.label,
            "description": b.description,
            "seuil": b.seuil,
            "obtenu": metrics[b.metric] >= b.seuil,
        }
        for b in BADGES
    ]
