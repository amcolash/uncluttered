"""
Lightweight email classifier — scikit-learn LogisticRegression + TF-IDF.
Trains on your actual email history; inference is sub-millisecond on any CPU.

Endpoints:
  GET  /health    → {"ready": bool}
  POST /classify  → {"category": str|null, "urgency": int|null, "confidence": float, "ready": bool}
  POST /train     → {"trained": bool, "examples": int, "classes": int, "distribution": {...}}
"""

import json
import os
import re
import time
from collections import Counter

import joblib
from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

MODEL_PATH = "/data/classifier.joblib"
# Require at least this many examples per class before that class is included.
MIN_PER_CLASS = 10

# Adjust this to control how much "louder" your custom data is compared to the base data.
CUSTOM_DATA_WEIGHT = 6.0
BASE_DATA_WEIGHT = 1.0

app = FastAPI()
cat_model:  Pipeline | None = None
urg_model:  Pipeline | None = None


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

class TrainRequest(BaseModel):
    examples: list[Example]


# ── Helpers ───────────────────────────────────────────────────────────────────

def extract_domain(sender: str) -> str:
    """Extract the bare domain from a From: header value."""
    m = re.search(r"@([\w.\-]+)", sender)
    return m.group(1).lower() if m else "unknown"

def build_text(subject: str, snippet: str, sender: str) -> str:
    """
    Combine all signals into a single string for TF-IDF.
    Prefix the domain with 'from:' so the vectorizer treats it as a distinct token.
    """
    domain = extract_domain(sender)
    return f"from:{domain} {subject} {snippet}"

def load_base_data(directory: str = "training/") -> list[Example]:
    """Loads base examples from JSON files in the specified directory."""
    base_examples = []
    if not os.path.exists(directory):
        print(f"[Classifier] Base data directory '{directory}' not found. Skipping.")
        return base_examples

    for filename in os.listdir(directory):
        if filename.endswith(".json"):
            filepath = os.path.join(directory, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    # Assumes the JSON file contains a list of objects matching the Example schema
                    if isinstance(data, list):
                        for item in data:
                            base_examples.append(Example(**item))
            except Exception as e:
                print(f"[Classifier] Error loading base data from {filepath}: {e}")

    print(f"[Classifier] Loaded {len(base_examples)} base examples from '{directory}'.")
    return base_examples


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
            cat_model = saved
            urg_model = None
        print(f"[Classifier] Loaded model (categories: {cat_model.classes_.tolist() if cat_model else 'none'})")
    else:
        print("[Classifier] No saved model — call POST /train to bootstrap.")


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health() -> dict:
    return {"ready": cat_model is not None}


@app.post("/classify")
def classify(req: ClassifyRequest) -> dict:
    if cat_model is None:
        return {"category": None, "confidence": 0.0, "ready": False}

    text = build_text(req.subject, req.snippet, req.sender)
    proba = cat_model.predict_proba([text])[0]
    idx = int(proba.argmax())
    return {
        "category":   cat_model.classes_[idx],
        "confidence": round(float(proba[idx]), 4),
        "ready":      True,
    }


@app.post("/train")
def train(req: TrainRequest) -> dict:
    start = time.time()
    print("[Classifier] Phase 1/4: Loading and combining datasets...")

    custom_examples = req.examples
    base_examples = load_base_data()

    # 1. Combine datasets
    all_examples = base_examples + custom_examples

    # 2. Assign weights (base data gets weight 1.0, custom gets 5.0)
    print("[Classifier] Phase 2/4: Applying weights and filtering sparse classes...")
    all_weights = ([BASE_DATA_WEIGHT] * len(base_examples)) + ([CUSTOM_DATA_WEIGHT] * len(custom_examples))

    # 3. Filter sparse classes
    counts = Counter(e.category for e in all_examples)
    sparse = {cat for cat, n in counts.items() if n < MIN_PER_CLASS}

    filtered_examples = []
    filtered_weights = []

    if sparse:
        print(f"[Classifier] Skipping sparse classes (< {MIN_PER_CLASS} examples): {sorted(sparse)}")
        for e, w in zip(all_examples, all_weights):
            if e.category not in sparse:
                filtered_examples.append(e)
                filtered_weights.append(w)
    else:
        filtered_examples = all_examples
        filtered_weights = all_weights

    if len(filtered_examples) < 10:
        return {
            "trained": False,
            "error": f"Need at least 10 examples after filtering; got {len(filtered_examples)}",
            "examples": len(filtered_examples),
        }

    print("[Classifier] Phase 3/4: Building TF-IDF texts...")
    texts      = [build_text(e.subject, e.snippet, e.sender) for e in filtered_examples]
    cat_labels = [e.category for e in filtered_examples]

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
                verbose=1,
                **clf_kwargs,
            )),
        ])

    cat_pipeline = make_pipeline({"C": 5.0})

    # 4. Pass the custom weights dynamically to the classifier step inside the pipeline
    print(f"[Classifier] Phase 4/4: Fitting model on {len(texts)} texts.")
    cat_pipeline.fit(texts, cat_labels, clf__sample_weight=filtered_weights)

    joblib.dump({"cat": cat_pipeline}, MODEL_PATH)

    global cat_model, urg_model
    cat_model = cat_pipeline
    urg_model = None

    dist = dict(Counter(cat_labels))
    print(f"[Classifier] Trained on {len(texts)} examples across {len(dist)} classes. (Base: {len(base_examples)}, Custom: {len(custom_examples)})")
    print(f"[Classifier] Training complete in {round(time.time() - start, 2)} seconds.")

    return {
        "trained":      True,
        "examples":     len(texts),
        "base_data":    len(base_examples),
        "custom_data":  len(custom_examples),
        "classes":      len(dist),
        "distribution": dist,
        "duration":     round(time.time() - start, 2),
    }