import os 
import faiss 
import numpy as np
from pathlib import Path
from .config import settings

Dir = Path(settings.VECTOR_STORE_DIR)
Dir.mkdir(parents=True, exist_ok=True)

def build_index(embeddings:list[list[float]]) -> faiss.IndexFlatIP:
    dim = len(embeddings[0])
    index = faiss.IndexFlatIP(dim)
    index.add(np.array(embeddings, dtype=np.float32))
    return index

def save_index(index, file_id:str):
    idx_path = Dir / f"{file_id}.faiss"
    faiss.write_index(index, str(idx_path))

def load_index(file_id: str):
    idx_path = Dir / f"{file_id}.faiss"
    if not idx_path.exists():
        raise FileNotFoundError(f"No index for {file_id}")
    return faiss.read_index(str(idx_path))

def search(index, query_vec, k=3):
    D, I = index.search(np.array([query_vec], dtype=np.float32), k)
    return I[0], D[0]