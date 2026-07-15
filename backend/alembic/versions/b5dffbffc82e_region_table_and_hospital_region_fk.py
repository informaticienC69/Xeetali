"""Region table and hospital region fk

Remplace ``hospitals.localisation`` (texte libre non validé) par une vraie
relation vers une table ``regions`` — les 14 régions administratives du
Sénégal, jusqu'ici une simple constante Python (``SENEGAL_REGIONS``). Les
valeurs de la constante sont dupliquées ici en dur (et non importées) : une
migration doit rester un instantané stable, indépendant de l'évolution future
du code applicatif.

Revision ID: b5dffbffc82e
Revises: 7540754927c6
Create Date: 2026-07-14 22:27:59.287314

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b5dffbffc82e'
down_revision: Union[str, None] = '7540754927c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Les 14 régions administratives officielles du Sénégal (ANSD). Doit rester en
# phase avec ``app.core.constants.SENEGAL_REGIONS`` (source pour seed.py) mais
# est indépendant : voir la note ci-dessus.
_REGIONS = [
    {"nom": "Dakar",       "capitale": "Dakar",       "population": 3732284, "longitude": -17.35, "latitude": 14.75},
    {"nom": "Diourbel",    "capitale": "Diourbel",    "population": 1527838, "longitude": -16.25, "latitude": 14.73},
    {"nom": "Fatick",      "capitale": "Fatick",      "population": 785455,  "longitude": -16.50, "latitude": 14.35},
    {"nom": "Kaffrine",    "capitale": "Kaffrine",    "population": 662218,  "longitude": -15.55, "latitude": 14.11},
    {"nom": "Kaolack",     "capitale": "Kaolack",     "population": 1080093, "longitude": -15.90, "latitude": 14.00},
    {"nom": "Kédougou",    "capitale": "Kédougou",    "population": 178711,  "longitude": -12.35, "latitude": 12.85},
    {"nom": "Kolda",       "capitale": "Kolda",       "population": 701019,  "longitude": -14.94, "latitude": 13.09},
    {"nom": "Louga",       "capitale": "Louga",       "population": 967578,  "longitude": -15.50, "latitude": 15.40},
    {"nom": "Matam",       "capitale": "Matam",       "population": 562539,  "longitude": -13.80, "latitude": 15.10},
    {"nom": "Saint-Louis", "capitale": "Saint-Louis", "population": 981418,  "longitude": -15.70, "latitude": 16.25},
    {"nom": "Sédhiou",     "capitale": "Sédhiou",     "population": 452682,  "longitude": -15.60, "latitude": 12.70},
    {"nom": "Tambacounda", "capitale": "Tambacounda", "population": 728140,  "longitude": -13.85, "latitude": 13.85},
    {"nom": "Thiès",       "capitale": "Thiès",       "population": 1793038, "longitude": -16.90, "latitude": 14.90},
    {"nom": "Ziguinchor",  "capitale": "Ziguinchor",  "population": 571434,  "longitude": -16.29, "latitude": 12.57},
]


def upgrade() -> None:
    regions_table = op.create_table(
        'regions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nom', sa.String(length=100), nullable=False),
        sa.Column('capitale', sa.String(length=100), nullable=False),
        sa.Column('population', sa.Integer(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nom'),
    )
    op.create_index(op.f('ix_regions_nom'), 'regions', ['nom'], unique=True)
    op.bulk_insert(regions_table, _REGIONS)

    # Colonne nullable le temps du backfill (existant ou base vierge : les deux
    # doivent passer), NOT NULL appliqué juste après.
    op.add_column('hospitals', sa.Column('region_id', sa.Integer(), nullable=True))
    op.execute(
        """
        UPDATE hospitals
        SET region_id = (SELECT id FROM regions WHERE regions.nom = hospitals.localisation)
        """
    )
    op.alter_column('hospitals', 'region_id', nullable=False)
    op.create_index(op.f('ix_hospitals_region_id'), 'hospitals', ['region_id'], unique=False)
    op.create_foreign_key(
        'fk_hospitals_region_id_regions', 'hospitals', 'regions', ['region_id'], ['id']
    )
    op.drop_column('hospitals', 'localisation')


def downgrade() -> None:
    op.add_column('hospitals', sa.Column('localisation', sa.String(length=200), nullable=True))
    op.execute(
        """
        UPDATE hospitals
        SET localisation = (SELECT nom FROM regions WHERE regions.id = hospitals.region_id)
        """
    )
    op.alter_column('hospitals', 'localisation', nullable=False)
    op.drop_constraint('fk_hospitals_region_id_regions', 'hospitals', type_='foreignkey')
    op.drop_index(op.f('ix_hospitals_region_id'), table_name='hospitals')
    op.drop_column('hospitals', 'region_id')
    op.drop_index(op.f('ix_regions_nom'), table_name='regions')
    op.drop_table('regions')
