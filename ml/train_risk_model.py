"""
Train a 30-day risk classifier from data/training_snapshots_5000_VALIDATED.csv
Outputs ml/models/risk_30d.joblib (sklearn Pipeline).
Run from repo root: python ml/train_risk_model.py
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = REPO_ROOT / "data" / "training_snapshots_5000_VALIDATED.csv"
MODEL_DIR = Path(__file__).resolve().parent / "models"
MODEL_PATH = MODEL_DIR / "risk_30d.joblib"
META_PATH = MODEL_DIR / "risk_30d_meta.json"

DROP_COLS = {
    "snapshot_id",
    "asset_id",
    "as_of_date",
    "assigned_to",
    "risk_event_30d",
    "risk_event_90d",
    "label_horizon_days",
}

CAT_COLS = [
    "asset_type",
    "department",
    "location",
    "asset_status",
    "health_at_snapshot",
]

NUM_COLS = [
    "is_unassigned",
    "age_years",
    "warranty_days_remaining",
    "open_issues_count",
    "open_critical_or_high_issues",
    "issues_opened_90d",
    "maintenance_open_or_scheduled",
    "maintenance_completed_365d",
    "days_since_last_maintenance",
    "rolling_error_count_30d",
    "avg_cpu_temp_c",
    "has_thermal_reading",
    "reported_uptime_pct",
]


def main() -> None:
    if not DATA_PATH.is_file():
        raise SystemExit(f"Missing training file: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    y = df["risk_event_30d"].astype(int)
    X = df.drop(columns=[c for c in DROP_COLS if c in df.columns], errors="ignore")

    # Ensure we only use defined feature columns
    feature_cols = [c for c in CAT_COLS + NUM_COLS if c in X.columns]
    X = X[feature_cols].copy()

    for c in NUM_COLS:
        if c in X.columns:
            X[c] = pd.to_numeric(X[c], errors="coerce").fillna(0.0)
    for c in CAT_COLS:
        if c in X.columns:
            X[c] = X[c].fillna("Unknown").astype(str)

    x_train, x_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    preprocessor = ColumnTransformer(
        [
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False, max_categories=32),
                [c for c in CAT_COLS if c in X.columns],
            ),
            ("num", "passthrough", [c for c in NUM_COLS if c in X.columns]),
        ]
    )

    clf = RandomForestClassifier(
        n_estimators=200,
        class_weight="balanced",
        max_depth=24,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    pipeline = Pipeline([("preprocess", preprocessor), ("model", clf)])
    pipeline.fit(x_train, y_train)

    prob_test = pipeline.predict_proba(x_test)[:, 1]
    y_hat = (prob_test >= 0.5).astype(int)
    try:
        auc = roc_auc_score(y_test, prob_test)
    except Exception:
        auc = None
    print(classification_report(y_test, y_hat, digits=3))
    if auc is not None:
        print(f"ROC AUC: {auc:.4f}")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"Saved model: {MODEL_PATH}")

    meta = {
        "feature_columns": feature_cols,
        "categorical": [c for c in CAT_COLS if c in feature_cols],
        "numeric": [c for c in NUM_COLS if c in feature_cols],
        "target": "risk_event_30d",
        "model_path": str(MODEL_PATH),
    }
    META_PATH.write_text(json.dumps(meta, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
