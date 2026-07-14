import os
import re
from pathlib import Path

BASE_DIR = Path(r"c:\Users\User\OneDrive\Documents\Mes Projets\XEETALI\backend\app\tests")

def refactor_test_file(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Change test functions to async
    content = re.sub(r"^def test_", "async def test_", content, flags=re.MULTILINE)
    
    # Change client calls to await client
    content = re.sub(r"client\.(get|post|put|delete|patch)\(", r"await client.\1(", content)
    
    # Change client parameter to async client type if annotated
    content = content.replace("client: TestClient", "client: AsyncClient")
    
    # Change db: Session to db: AsyncSession
    content = content.replace("db: Session", "db: AsyncSession")
    content = content.replace("db_session: Session", "db_session: AsyncSession")
    
    # Any sync DB methods to async (get, refresh, commit, add_all...)
    # In tests, DB setup is often sync. But we must await them now if we use AsyncSession.
    content = content.replace("db_session.add(", "db_session.add(") # add is sync
    content = content.replace("db_session.add_all(", "db_session.add_all(") # sync
    content = content.replace("db_session.commit()", "await db_session.commit()")
    content = content.replace("db_session.flush()", "await db_session.flush()")
    content = content.replace("db_session.refresh(", "await db_session.refresh(")
    content = content.replace("db_session.get(", "await db_session.get(")
    content = content.replace("db.commit()", "await db.commit()")
    content = content.replace("db.flush()", "await db.flush()")
    content = content.replace("db.refresh(", "await db.refresh(")
    
    # Replace queries
    content = re.sub(r"db_session\.query\((.*?)\)\.filter_by\((.*?)\)\.first\(\)", r"await db_session.scalar(select(\1).filter_by(\2))", content)
    content = re.sub(r"db_session\.query\((.*?)\)\.all\(\)", r"(await db_session.scalars(select(\1))).all()", content)
    content = re.sub(r"db\.query\((.*?)\)\.filter\((.*?)\)\.first\(\)", r"await db.scalar(select(\1).where(\2))", content)
    content = re.sub(r"db\.query\((.*?)\)\.filter\((.*?)\)\.all\(\)", r"(await db.scalars(select(\1).where(\2))).all()", content)
    
    # Auth fixture is now async
    content = content.replace("auth(", "await auth(")

    
    # Some imports
    if "import pytest" in content and "pytest.mark.asyncio" not in content:
        content = content.replace("import pytest", "import pytest\nfrom sqlalchemy.ext.asyncio import AsyncSession\nfrom sqlalchemy import select\nfrom httpx import AsyncClient")
        
    # Mark all tests with @pytest.mark.asyncio
    content = re.sub(r"^(async def test_)", r"@pytest.mark.asyncio\n\1", content, flags=re.MULTILINE)
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

for root, _, files in os.walk(BASE_DIR):
    for f in files:
        if f.startswith("test_") and f.endswith(".py"):
            refactor_test_file(Path(root) / f)

print("Test refactoring done.")
