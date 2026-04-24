"""
Read JSON list of feature dicts from stdin, output {"probabilities": [..]} for risk_event_30d.
Same schema as training (without labels). Run: echo '[{...}]' | python predict_risk.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import pandas as pd

REPO_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = Path(__file__).resolve().parent / "models" / "risk_30d.joblib"


def main() -> None:
    if not MODEL_PATH.is_file():
        err = json.dumps({"error": f"Model not found: {MODEL_PATH}"})
        print(err, file=sys.stderr)
        sys.exit(1)
    raw = sys.stdin.read()
    if not raw.strip():
        print(json.dumps({"probabilities": []}))
        return
    rows = json.loads(raw)
    if not isinstance(rows, list):
        rows = [rows]
    if len(rows) == 0:
        print(json.dumps({"probabilities": []}))
        return

    model = joblib.load(MODEL_PATH)
    cat = [
        "asset_type",
        "department",
        "location",
        "asset_status",
        "health_at_snapshot",
    ]
    num = [
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

    df = pd.DataFrame(rows)
    for c in num:
        if c not in df.columns:
            df[c] = 0.0
    for c in cat:
        if c not in df.columns:
            df[c] = "Unknown"
    use_cols = [c for c in cat + num if c in df.columns]
    for c in num:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0.0)
    for c in cat:
        if c in df.columns:
            df[c] = df[c].fillna("Unknown").astype(str)

    X = df[use_cols]
    proba = model.predict_proba(X)[:, 1]
    print(
        json.dumps(
            {
                "probabilities": [float(p) for p in proba],
            }
        )
    )


if __name__ == "__main__":
    main()
