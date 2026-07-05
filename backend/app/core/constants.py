"""Constantes métier — matrice de compatibilité sanguine ABO/Rh.

``DONOR_COMPATIBILITY[receveur]`` = ensemble des groupes **donneurs** dont les
globules rouges peuvent être transfusés à un receveur de ce groupe.

Règles standard (globules rouges) :
- Rh- ne peut recevoir que du Rh- ; Rh+ peut recevoir Rh- et Rh+.
- O est donneur universel (érythrocytaire) ; AB est receveur universel.
"""
from __future__ import annotations

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
