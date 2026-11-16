"""
Lightweight email classifier — scikit-learn LogisticRegression + TF-IDF.
Trains on your actual email history; inference is sub-millisecond on any CPU.

Endpoints:
  GET  /health    → {"ready": bool}
  POST /classify  → {"category": str|null, "urgency": int|null, "confidence": float, "ready": bool, "categories": list}
  POST /train     → {"trained": bool, "examples": int, "classes": int, "distribution": {...}}
"""

import html
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

# Weights: Gold (user-validated) data gets highest weight, Silver (unvalidated AI) gets lower weight
GOLD_DATA_WEIGHT = 6.0
SILVER_DATA_WEIGHT = 1.5
BASE_DATA_WEIGHT = 1.0

# Precompiled regex patterns for intent cues
RE_PROMO = re.compile(
    r"\b(\d+\s*%\s*off|\$\d+\s*off|sale|deals?|save\b|discount|fares?\s+from|bonus\s+miles|"
    r"special\s+offer|limited\s+time|credit\s+card\s+offer|earn\b|rewards?\s+points?|"
    r"exclusive\s+deal|clearance|promo\s+code|coupon|cashback|cash\s+back)\b",
    re.IGNORECASE,
)

RE_BOOKING = re.compile(
    r"\b(confirmation|itinerary|boarding\s+pass|e-?ticket|check-?in|reservation\b|"
    r"booking\s+ref|flight\s+status|gate\s+change|delayed|seat\s+assignment|trip\s+details)\b",
    re.IGNORECASE,
)

RE_RECEIPT = re.compile(
    r"\b(receipt|invoice|order\s+(?:placed|confirmed|details)|tracking\s+number|"
    r"shipped|delivered|out\s+for\s+delivery|payment\s+received|billing\s+statement)\b",
    re.IGNORECASE,
)

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
    isGold: bool = False

class TrainRequest(BaseModel):
    examples: list[Example]


# ── Helpers ───────────────────────────────────────────────────────────────────

def parse_sender(sender: str) -> tuple[str, str, str, str]:
    """
    Extract (display_name, local_part, domain, root_domain) from sender header.
    e.g. "Alaska Airlines <deals@e.alaskaair.com>" -> ("Alaska Airlines", "deals", "e.alaskaair.com", "alaskaair.com")
    """
    display_name = ""
    m_name = re.match(r"^([^<]+)<", sender)
    if m_name:
        display_name = m_name.group(1).strip().strip("\"'")

    m_email = re.search(r"<([^>]+)>", sender)
    email_str = m_email.group(1).strip().lower() if m_email else sender.strip().lower()

    local_part = ""
    domain = ""
    root_domain = ""

    if "@" in email_str:
        local_part, domain = email_str.split("@", 1)
        parts = domain.split(".")
        if len(parts) >= 2:
            root_domain = ".".join(parts[-2:])
        else:
            root_domain = domain
    else:
        domain = email_str
        root_domain = email_str

    return display_name, local_part, domain, root_domain

def build_text(subject: str, snippet: str, sender: str) -> str:
    """
    Combine all signals into a single string for TF-IDF.
    Extracts display names, local-parts, domains, root domains, and intent signals.
    Subject is double-weighted to prioritize user intent over boilerplate snippets.
    """
    subject_clean = html.unescape(subject or "")
    snippet_clean = html.unescape(snippet or "")

    display_name, local_part, domain, root_domain = parse_sender(sender or "")

    sender_tokens = []
    if domain:
        sender_tokens.append(f"from:{domain}")
    if root_domain and root_domain != domain:
        sender_tokens.append(f"from:{root_domain}")
    if local_part:
        clean_local = re.sub(r"[._\-+].*", "", local_part)
        if clean_local:
            sender_tokens.append(f"sender_role:{clean_local}")
    if display_name:
        # Clean display name for tokens
        clean_name = re.sub(r"[^a-zA-Z0-9\s]", "", display_name).strip().lower()
        if clean_name:
            sender_tokens.append(f"name:{clean_name}")

    intent_tokens = []
    full_text = f"{subject_clean} {snippet_clean}"
    if RE_PROMO.search(full_text):
        intent_tokens.append("signal:promo")
    if RE_BOOKING.search(full_text):
        intent_tokens.append("signal:booking")
    if RE_RECEIPT.search(full_text):
        intent_tokens.append("signal:receipt")

    sender_str = " ".join(sender_tokens)
    intent_str = " ".join(intent_tokens)
    return f"{sender_str} {intent_str} {subject_clean} {subject_clean} {snippet_clean}"

def load_base_data(directory: str = "training/") -> list[Example]:
    """Loads base examples from JSON files in the specified directory."""
    base_examples = []
    if not os.path.exists(directory):
        print(f"[Classifier] Base data directory '{directory}' not found. Skipping.")
        return base_examples

    for filename in os.listdir(directory):
        if filename.endswith(".json") and filename != "UNKNOWN.json":
            filepath = os.path.join(directory, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    # Assumes the JSON file contains a list of objects matching the Example schema
                    if isinstance(data, list):
                        for item in data:
                            if item.get("category") != "UNKNOWN":
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
        return {"category": None, "confidence": 0.0, "ready": False, "categories": []}

    text = build_text(req.subject, req.snippet, req.sender)
    proba = cat_model.predict_proba([text])[0]
    idx = int(proba.argmax())

    categories = [
        {"category": str(cat_name), "confidence": round(float(prob), 4)}
        for cat_name, prob in sorted(
            zip(cat_model.classes_, proba),
            key=lambda item: item[1],
            reverse=True,
        )
    ]

    return {
        "category":   str(cat_model.classes_[idx]),
        "confidence": round(float(proba[idx]), 4),
        "ready":      True,
        "categories": categories,
    }


@app.post("/train")
def train(req: TrainRequest) -> dict:
    start = time.time()
    print("[Classifier] Phase 1/4: Loading and combining datasets...")

    custom_examples = [e for e in req.examples if e.category != "UNKNOWN"]
    base_examples = load_base_data()

    # 1. Combine datasets
    all_examples = base_examples + custom_examples

    # 2. Assign weights (base data 1.0, gold user-validated 6.0, silver unvalidated AI 1.5)
    print("[Classifier] Phase 2/4: Applying weights and filtering sparse classes...")
    custom_weights = [
        GOLD_DATA_WEIGHT if getattr(e, "isGold", False) else SILVER_DATA_WEIGHT
        for e in custom_examples
    ]
    all_weights = ([BASE_DATA_WEIGHT] * len(base_examples)) + custom_weights

    # 3. Filter sparse classes
    counts = Counter(e.category for e in all_examples)
    sparse = {cat for cat, n in counts.items() if n < MIN_PER_CLASS or cat == "UNKNOWN"}

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
                min_df=2,
                max_features=15000,
                ngram_range=(1, 2),
                sublinear_tf=True,
            )),
            ("clf", LogisticRegression(
                max_iter=500,
                class_weight="balanced",
                verbose=1,
                **clf_kwargs,
            )),
        ])

    cat_pipeline = make_pipeline({"C": 2.0})

    # 4. Pass the custom weights dynamically to the classifier step inside the pipeline
    print(f"[Classifier] Phase 4/4: Fitting model on {len(texts)} texts.")
    cat_pipeline.fit(texts, cat_labels, clf__sample_weight=filtered_weights)

    joblib.dump({"cat": cat_pipeline}, MODEL_PATH)

    global cat_model, urg_model
    cat_model = cat_pipeline
    urg_model = None

    dist = dict(Counter(cat_labels))
    gold_count = sum(1 for e in custom_examples if getattr(e, "isGold", False))
    silver_count = len(custom_examples) - gold_count
    print(f"[Classifier] Trained on {len(texts)} examples across {len(dist)} classes. (Base: {len(base_examples)}, Gold: {gold_count}, Silver: {silver_count})")
    print(f"[Classifier] Training complete in {round(time.time() - start, 2)} seconds.")

    return {
        "trained":      True,
        "examples":     len(texts),
        "base_data":    len(base_examples),
        "custom_data":  len(custom_examples),
        "gold_data":    gold_count,
        "silver_data":  silver_count,
        "classes":      len(dist),
        "distribution": dist,
        "duration":     round(time.time() - start, 2),
    }