import json
from pathlib import Path

NOTES_FILE = Path("notes.json")
NOTEBOOKS_FILE = Path("notebooks.json")
FILES_META_FILE = Path("files.json")

def load_notes():
    if not NOTES_FILE.exists():
        return {}
    return json.loads(NOTES_FILE.read_text(encoding="utf8"))

def save_notes(notes):
    NOTES_FILE.write_text(json.dumps(notes, indent=2), encoding="utf8")

# --- Notebooks storage ---
def load_notebooks():
    if not NOTEBOOKS_FILE.exists():
        return {}
    return json.loads(NOTEBOOKS_FILE.read_text(encoding="utf8"))

def save_notebooks(data: dict):
    NOTEBOOKS_FILE.write_text(json.dumps(data, indent=2), encoding="utf8")

# --- Files metadata storage ---
def load_files_meta() -> dict:
    if not FILES_META_FILE.exists():
        return {}
    return json.loads(FILES_META_FILE.read_text(encoding="utf8"))

def save_files_meta(data: dict):
    FILES_META_FILE.write_text(json.dumps(data, indent=2), encoding="utf8")