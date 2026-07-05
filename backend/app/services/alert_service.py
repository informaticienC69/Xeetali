"""Logique métier UC-17 — mock d'alerte donneurs USSD/SMS.

Confidentialité stricte : **aucun envoi réel**, et **aucun numéro de téléphone en
clair** n'est journalisé ni renvoyé. Les numéros sont masqués (ex. ``77****89``).
"""
from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.schemas.alert import AlertResponse
from app.schemas.enums import BloodGroup

logger = logging.getLogger("xeetali.alert")

# Répertoire de donneurs simulé (aucune source réelle). Sert uniquement à produire
# une réponse structurée réaliste pour la démo. En clair ici pour le mock, mais
# JAMAIS exposé ni journalisé sans masquage.
_MOCK_DONORS: dict[BloodGroup, list[str]] = {
    BloodGroup.O_NEG: ["771234589", "770001199", "776543210"],
    BloodGroup.O_POS: ["771112233", "770998877"],
    BloodGroup.A_POS: ["775554433", "778889900", "771010101", "772020202"],
    BloodGroup.A_NEG: ["773334455"],
    BloodGroup.B_POS: ["776667788", "774443322"],
    BloodGroup.B_NEG: ["779990011"],
    BloodGroup.AB_POS: ["770707070"],
    BloodGroup.AB_NEG: [],
}


def _mask_number(number: str) -> str:
    """Masque un numéro : conserve 2 chiffres de tête et 2 de fin (``77****89``)."""
    digits = "".join(ch for ch in number if ch.isdigit())
    if len(digits) <= 4:
        return "*" * len(digits)
    return f"{digits[:2]}{'*' * (len(digits) - 4)}{digits[-2:]}"


def build_ussd_alert(db: Session, groupe: BloodGroup) -> AlertResponse:
    """Construit la réponse simulée d'une alerte USSD/SMS pour un groupe sanguin.

    Ne réalise **aucun** envoi. Journalise uniquement des numéros masqués.
    Le paramètre ``db`` est accepté pour homogénéité de la couche services et
    évolutivité (répertoire donneurs en base ultérieurement).
    """
    donors = _MOCK_DONORS.get(groupe, [])
    numeros_masques = [_mask_number(n) for n in donors]
    message = (
        f"CNTS Xéétali : besoin urgent de sang {groupe.value}. "
        f"Si vous êtes éligible, présentez-vous au centre de don le plus proche. Merci."
    )

    logger.info(
        "Alerte USSD/SMS simulée pour groupe %s : %d donneur(s) notifié(s) %s "
        "(aucun envoi réel).",
        groupe.value, len(donors), numeros_masques,
    )

    return AlertResponse(
        groupe_sanguin=groupe,
        donneurs_notifies=len(donors),
        numeros_masques=numeros_masques,
        message=message,
        canal="USSD/SMS (simulé)",
        envoi_reel=False,
    )
