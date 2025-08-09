from openai import OpenAI
from .config import settings

def embed_texts(texts: list[str]) -> list[list[float]]:
    if not settings.OPENAI_API_KEY:
        raise RuntimeError("Missing OPENAI_API_KEY. Set it in .env or environment.")
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    resp = client.embeddings.create(
        model=settings.EMBEDDING_MODEL,
        input=texts,
    )
    return [d.embedding for d in resp.data]
