#!/bin/bash
# Script de démarrage pour Render (car le shell n'est pas dispo en Free Tier)

echo "Lancement des migrations de la base de données..."
alembic upgrade head

echo "Insertion des données initiales (seed)..."
python seed.py

echo "Démarrage du serveur FastAPI..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
