"""
Lightweight email classifier — scikit-learn LogisticRegression + TF-IDF.
Trains on your actual email history; inference is sub-millisecond on any CPU.

Endpoints:
  GET  /health    → {"ready": bool}
  POST /classify  → {"category": str|null, "urgency": int|null, "confidence": float, "ready": bool}
  POST /train     → {"trained": bool, "examples": int, "classes": int, "distribution": {...}}
"""

import os
import re
from collections import Counter

import joblib
from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

MODEL_PATH = "/data/classifier.joblib"
# Require at least this many examples per class before that class is included.
# Classes below this threshold are excluded from training and handled by the
# rule-based fallback on the Node side.
MIN_PER_CLASS = 10

app = FastAPI()
cat_model:  Pipeline | None = None
urg_model:  Pipeline | None = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def extract_domain(sender: str) -> str:
    """Extract the bare domain from a From: header value."""
    m = re.search(r"@([\w.\-]+)", sender)
    return m.group(1).lower() if m else "unknown"


def build_text(subject: str, snippet: str, sender: str) -> str:
    """
    Combine all signals into a single string for TF-IDF.
    Prefix the domain with 'from:' so the vectorizer treats it as a distinct
    token — the model will quickly learn domain → category associations from
    training data without any hardcoded domain lists.
    """
    domain = extract_domain(sender)
    return f"from:{domain} {subject} {snippet}"


# ── Lifecycle ─────────────────────────────────────────────────────────────────

@app.on_event("startup")
def load_model() -> None:
    global cat_model, urg_model
    if os.path.exists(MODEL_PATH):
        saved = joblib.load(MODEL_PATH)
        if isinstance(saved, dict):
            cat_model = saved.get("cat")
            urg_model = saved.get("urg")
        else:
            # Legacy: single pipeline (category only)
            cat_model = saved
            urg_model = None
        print(f"[Classifier] Loaded model (categories: {cat_model.classes_.tolist() if cat_model else 'none'})")
    else:
        print("[Classifier] No saved model — call POST /train to bootstrap.")


# ── Schemas ───────────────────────────────────────────────────────────────────

class ClassifyRequest(BaseModel):
    subject: str
    snippet: str
    sender: str


class Example(BaseModel):
    subject: str
    snippet: str
    sender: str
    category: str
    urgency: int


class TrainRequest(BaseModel):
    examples: list[Example]


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health() -> dict:
    return {"ready": cat_model is not None}


@app.post("/classify")
def classify(req: ClassifyRequest) -> dict:
    if cat_model is None:
        return {"category": None, "urgency": None, "confidence": 0.0, "ready": False}

    text = build_text(req.subject, req.snippet, req.sender)
    proba = cat_model.predict_proba([text])[0]
    idx = int(proba.argmax())
    category = cat_model.classes_[idx]

    urgency: int | None = None
    if urg_model is not None:
        urgency = int(urg_model.predict([text])[0])

    return {
        "category":   category,
        "urgency":    urgency,
        "confidence": round(float(proba[idx]), 4),
        "ready":      True,
    }


@app.post("/train")
def train(req: TrainRequest) -> dict:
    examples = req.examples
    counts = Counter(e.category for e in examples)

    # Drop classes with too few examples so they don't skew the model.
    sparse = {cat for cat, n in counts.items() if n < MIN_PER_CLASS}
    if sparse:
        print(f"[Classifier] Skipping sparse classes (< {MIN_PER_CLASS} examples): {sorted(sparse)}")
        examples = [e for e in examples if e.category not in sparse]

    if len(examples) < 10:
        return {
            "trained": False,
            "error": f"Need at least 10 examples after filtering; got {len(examples)}",
            "examples": len(examples),
        }

    texts          = [build_text(e.subject, e.snippet, e.sender) for e in examples]
    cat_labels     = [e.category for e in examples]
    urgency_labels = [e.urgency  for e in examples]

    def make_pipeline(clf_kwargs: dict) -> Pipeline:
        return Pipeline([
            ("tfidf", TfidfVectorizer(
                min_df=1,
                ngram_range=(1, 2),
                sublinear_tf=True,
            )),
            ("clf", LogisticRegression(
                max_iter=1000,
                class_weight="balanced",
                **clf_kwargs,
            )),
        ])

    cat_pipeline = make_pipeline({"C": 5.0})
    cat_pipeline.fit(texts, cat_labels)

    urg_pipeline = make_pipeline({"C": 0.5})
    urg_pipeline.fit(texts, urgency_labels)

    joblib.dump({"cat": cat_pipeline, "urg": urg_pipeline}, MODEL_PATH)

    global cat_model, urg_model
    cat_model = cat_pipeline
    urg_model = urg_pipeline

    dist = dict(Counter(cat_labels))
    print(f"[Classifier] Trained on {len(texts)} examples across {len(dist)} classes.")
    return {
        "trained":      True,
        "examples":     len(texts),
        "classes":      len(dist),
        "distribution": dist,
    }
