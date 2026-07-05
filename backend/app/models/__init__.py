"""Modèles ORM. Importés ici pour que ``Base.metadata`` les connaisse tous."""
from app.models.alert import Alert, AlertResponse
from app.models.appointment import Appointment
from app.models.collection_point import CollectionPoint
from app.models.donation import Donation
from app.models.donor_profile import DonorProfile
from app.models.hospital import Hospital
from app.models.pouch import BloodPouch
from app.models.request import BloodRequest
from app.models.transfer import TransferOrder
from app.models.user import User

__all__ = [
    "Alert",
    "AlertResponse",
    "Appointment",
    "BloodPouch",
    "BloodRequest",
    "CollectionPoint",
    "Donation",
    "DonorProfile",
    "Hospital",
    "TransferOrder",
    "User",
]
