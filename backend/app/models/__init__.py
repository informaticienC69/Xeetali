"""Modèles ORM. Importés ici pour que ``Base.metadata`` les connaisse tous."""
from app.models.hospital import Hospital
from app.models.inventory import BloodInventory
from app.models.transfer import TransferOrder

__all__ = ["Hospital", "BloodInventory", "TransferOrder"]
