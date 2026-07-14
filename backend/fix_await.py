import os
import re

backend_dir = r"c:\Users\User\OneDrive\Documents\Mes Projets\XEETALI\backend\app"

# We want to replace `await db.scalars(ANYTHING).all()`
# with `(await db.scalars(ANYTHING)).all()`
# and `await db.scalars(ANYTHING).one_or_none()`
# with `(await db.scalars(ANYTHING)).one_or_none()`

for root, _, files in os.walk(backend_dir):
    for f in files:
        if f.endswith(".py"):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()
            
            new_content = re.sub(
                r'await\s+db\.scalars\((.*)\)\.all\(\)',
                r'(await db.scalars(\1)).all()',
                content
            )
            new_content = re.sub(
                r'await\s+db\.scalars\((.*)\)\.one_or_none\(\)',
                r'(await db.scalars(\1)).one_or_none()',
                new_content
            )
            
            # also fix `admin_service.py` missing awaits
            if f == "admin_service.py":
                new_content = re.sub(
                    r'(stock_groupe|statut_counts|donors_groupe|urgence_counts)\s*=\s*_grouped_counts',
                    r'\1 = await _grouped_counts',
                    new_content
                )
                
            if content != new_content:
                with open(path, "w", encoding="utf-8") as file:
                    file.write(new_content)
                print(f"Fixed {path}")
