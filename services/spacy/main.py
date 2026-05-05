from fastapi import FastAPI
from pydantic import BaseModel
import spacy
from sentence_transformers import SentenceTransformer

app = FastAPI(title="Veil NER + Embedding Service")

nlp = spacy.load("en_core_web_md")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

DEFAULT_LABEL_MAP: dict[str, str] = {
    "PERSON": "person",
    "ORG": "organization",
    "FAC": "organization",
    "GPE": "place",
    "LOC": "place",
    "DATE": "date",
    "CARDINAL": "id_number",
    "MONEY": "id_number",
    "QUANTITY": "id_number",
    "NORP": "organization",
    "PRODUCT": "custom",
    "EVENT": "custom",
    "WORK_OF_ART": "custom",
    "LAW": "custom",
    "LANGUAGE": "custom",
    "TIME": "date",
    "PERCENT": "custom",
    "ORDINAL": "custom",
}

label_map: dict[str, str] = dict(DEFAULT_LABEL_MAP)


class ExtractRequest(BaseModel):
    text: str
    label_overrides: dict[str, str] | None = None


class Entity(BaseModel):
    value: str
    type: str
    start: int
    end: int


class ExtractResponse(BaseModel):
    entities: list[Entity]


class EmbedRequest(BaseModel):
    texts: list[str]


class EmbedResponse(BaseModel):
    embeddings: list[list[float]]
    dimensions: int


@app.get("/health")
def health():
    return {"status": "ok"}


class LabelMapRequest(BaseModel):
    mappings: dict[str, str]


@app.post("/label-map")
def update_label_map(req: LabelMapRequest):
    label_map.update(req.mappings)
    return {"label_map": label_map}


@app.get("/label-map")
def get_label_map():
    return {"label_map": label_map}


@app.post("/extract", response_model=ExtractResponse)
def extract(req: ExtractRequest):
    active_map = {**label_map, **(req.label_overrides or {})}
    doc = nlp(req.text)
    entities: list[Entity] = []

    for ent in doc.ents:
        entity_type = active_map.get(ent.label_, "custom")
        entities.append(
            Entity(
                value=ent.text,
                type=entity_type,
                start=ent.start_char,
                end=ent.end_char,
            )
        )

    return ExtractResponse(entities=entities)


@app.post("/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest):
    vectors = embedder.encode(req.texts).tolist()
    dim = embedder.get_sentence_embedding_dimension()
    return EmbedResponse(embeddings=vectors, dimensions=dim)
