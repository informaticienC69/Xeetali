import os
import re
from pathlib import Path

BASE_DIR = Path(r"c:\Users\User\OneDrive\Documents\Mes Projets\XEETALI\backend\app")

def refactor_file(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Import modifications
    content = content.replace("from sqlalchemy.orm import Session", "from sqlalchemy.ext.asyncio import AsyncSession\nfrom sqlalchemy import select")
    content = content.replace("db: Session", "db: AsyncSession")
    content = content.replace("db: Session = Depends(get_db)", "db: AsyncSession = Depends(get_db)")

    # Router & Service definition modifications
    # This regex matches 'def <name>(' and replaces with 'async def <name>('
    # but skips inner functions if they don't have db as param (heuristic).
    # Since almost all functions in these files are endpoints or services, we make them all async.
    content = re.sub(r"^def ", "async def ", content, flags=re.MULTILINE)
    
    # DB calls
    content = re.sub(r"db\.query\((.*?)\)\.filter\((.*?)\)\.one_or_none\(\)", r"await db.scalar(select(\1).where(\2))", content)
    content = re.sub(r"db\.query\((.*?)\)\.filter\((.*?)\)\.all\(\)", r"(await db.scalars(select(\1).where(\2))).all()", content)
    content = re.sub(r"db\.query\((.*?)\)\.all\(\)", r"(await db.scalars(select(\1))).all()", content)
    
    content = content.replace("db.scalars(", "await db.scalars(")
    content = content.replace("db.scalar(", "await db.scalar(")
    content = content.replace("db.execute(", "await db.execute(")
    content = content.replace("db.commit()", "await db.commit()")
    content = content.replace("db.rollback()", "await db.rollback()")
    # db.refresh and db.get need await but have args
    content = re.sub(r"db\.refresh\((.*?)\)", r"await db.refresh(\1)", content)
    content = re.sub(r"db\.get\((.*?)\)", r"await db.get(\1)", content)

    # In routers, we must await the service calls.
    # We can heuristically add await to <module>_service.
    if "routers" in path.parts:
        content = re.sub(r"([a-z_]+_service\.[a-z_]+)\(", r"await \1(", content)
        # Auth dependency might be called:
        content = re.sub(r"require_role\((.*?)\)", r"require_role(\1)", content)

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

for root, _, files in os.walk(BASE_DIR):
    for f in files:
        if f.endswith(".py") and f != "__init__.py":
            if "services" in root or "routers" in root:
                refactor_file(Path(root) / f)

print("Refactoring done.")
