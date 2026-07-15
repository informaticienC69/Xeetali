"""Constantes métier — matrice de compatibilité sanguine ABO/Rh, régions du Sénégal.

``DONOR_COMPATIBILITY[receveur]`` = ensemble des groupes **donneurs** dont les
globules rouges peuvent être transfusés à un receveur de ce groupe.

Règles standard (globules rouges) :
- Rh- ne peut recevoir que du Rh- ; Rh+ peut recevoir Rh- et Rh+.
- O est donneur universel (érythrocytaire) ; AB est receveur universel.
"""
from __future__ import annotations

from typing import TypedDict

from app.schemas.enums import BloodGroup

DONOR_COMPATIBILITY: dict[BloodGroup, frozenset[BloodGroup]] = {
    BloodGroup.O_NEG: frozenset({BloodGroup.O_NEG}),
    BloodGroup.O_POS: frozenset({BloodGroup.O_NEG, BloodGroup.O_POS}),
    BloodGroup.A_NEG: frozenset({BloodGroup.O_NEG, BloodGroup.A_NEG}),
    BloodGroup.A_POS: frozenset(
        {BloodGroup.O_NEG, BloodGroup.O_POS, BloodGroup.A_NEG, BloodGroup.A_POS}
    ),
    BloodGroup.B_NEG: frozenset({BloodGroup.O_NEG, BloodGroup.B_NEG}),
    BloodGroup.B_POS: frozenset(
        {BloodGroup.O_NEG, BloodGroup.O_POS, BloodGroup.B_NEG, BloodGroup.B_POS}
    ),
    BloodGroup.AB_NEG: frozenset(
        {BloodGroup.O_NEG, BloodGroup.A_NEG, BloodGroup.B_NEG, BloodGroup.AB_NEG}
    ),
    BloodGroup.AB_POS: frozenset(set(BloodGroup)),  # receveur universel
}


def compatible_donor_groups(receiver: BloodGroup) -> frozenset[BloodGroup]:
    """Groupes donneurs éligibles pour un receveur donné."""
    return DONOR_COMPATIBILITY[receiver]


class RegionInfo(TypedDict):
    """Référence géographique statique d'une région administrative du Sénégal."""

    name: str
    capital: str
    population: int
    coords: tuple[float, float]  # [longitude, latitude]


# Les 14 régions administratives officielles du Sénégal (ANSD). Référence
# géographique statique (nom, capitale, population, coordonnées) utilisée
# uniquement pour amorcer la table ``regions`` (cf. seed.py) — une fois en
# base, c'est ``Region``/``Hospital.region_id`` la source de vérité, jamais
# cette constante directement (le stock, lui, est toujours calculé depuis les
# poches, cf. stock_by_region). ``name`` doit correspondre exactement à
# ``NAME_1`` du GeoJSON GADM utilisé par la carte frontend.
SENEGAL_REGIONS: list[RegionInfo] = [
    {"name": "Dakar",       "capital": "Dakar",       "population": 3732284, "coords": (-17.35, 14.75)},
    {"name": "Diourbel",    "capital": "Diourbel",    "population": 1527838, "coords": (-16.25, 14.73)},
    {"name": "Fatick",      "capital": "Fatick",      "population": 785455,  "coords": (-16.50, 14.35)},
    {"name": "Kaffrine",    "capital": "Kaffrine",    "population": 662218,  "coords": (-15.55, 14.11)},
    {"name": "Kaolack",     "capital": "Kaolack",     "population": 1080093, "coords": (-15.90, 14.00)},
    {"name": "Kédougou",    "capital": "Kédougou",    "population": 178711,  "coords": (-12.35, 12.85)},
    {"name": "Kolda",       "capital": "Kolda",       "population": 701019,  "coords": (-14.94, 13.09)},
    {"name": "Louga",       "capital": "Louga",       "population": 967578,  "coords": (-15.50, 15.40)},
    {"name": "Matam",       "capital": "Matam",       "population": 562539,  "coords": (-13.80, 15.10)},
    {"name": "Saint-Louis", "capital": "Saint-Louis", "population": 981418,  "coords": (-15.70, 16.25)},
    {"name": "Sédhiou",     "capital": "Sédhiou",     "population": 452682,  "coords": (-15.60, 12.70)},
    {"name": "Tambacounda", "capital": "Tambacounda", "population": 728140,  "coords": (-13.85, 13.85)},
    {"name": "Thiès",       "capital": "Thiès",       "population": 1793038, "coords": (-16.90, 14.90)},
    {"name": "Ziguinchor",  "capital": "Ziguinchor",  "population": 571434,  "coords": (-16.29, 12.57)},
]
