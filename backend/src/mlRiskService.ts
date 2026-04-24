import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/** Feature row matching ml/train_risk_model.py (no labels). */
export type RiskFeatureRow = {
  asset_type: string;
  department: string;
  location: string;
  asset_status: string;
  health_at_snapshot: string;
  is_unassigned: number;
  age_years: number;
  warranty_days_remaining: number;
  open_issues_count: number;
  open_critical_or_high_issues: number;
  issues_opened_90d: number;
  maintenance_open_or_scheduled: number;
  maintenance_completed_365d: number;
  days_since_last_maintenance: number;
  rolling_error_count_30d: number;
  avg_cpu_temp_c: number;
  has_thermal_reading: number;
  reported_uptime_pct: number;
};

const CAT_DEFAULTS: Record<string, string> = {
  asset_type: 'Other',
  department: 'Unassigned',
  location: 'Unknown',
  asset_status: 'Active',
  health_at_snapshot: 'Good',
};

function isUnassignedName(s: string | null | undefined): boolean {
  const t = String(s ?? '').trim().toLowerCase();
  return t === '' || t === 'unassigned';
}

export function buildFeatureRow(
  asset: {
    type?: string;
    department?: string;
    location?: string;
    status?: string;
    health?: string;
    purchaseDate?: string;
    warrantyExpiry?: string;
    assignedTo?: string;
  },
  ctx: {
    openIssues: number;
    openCriticalOrHigh: number;
    issuesOpened90d: number;
    issuesOpened30d: number;
    maintenanceOpenOrScheduled: number;
    maintenanceCompleted365d: number;
    daysSinceLastMaintenance: number;
  }
): RiskFeatureRow {
  const t = String(asset.type ?? 'Other').trim() || 'Other';
  const isPrinter = t.toLowerCase() === 'printer';
  const health = String(asset.health ?? 'Good').trim() || 'Good';
  const purchase = asset.purchaseDate ? new Date(`${asset.purchaseDate}T00:00:00Z`) : null;
  const now = Date.now();
  const ageYears = purchase
    ? Math.max(0, (now - purchase.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : 1;

  let warrantyDays = -1;
  if (asset.warrantyExpiry) {
    const w = new Date(`${asset.warrantyExpiry}T00:00:00Z`);
    if (!Number.isNaN(w.getTime())) {
      warrantyDays = Math.round((w.getTime() - now) / (1000 * 60 * 60 * 24));
    }
  }

  const un = isUnassignedName(asset.assignedTo) ? 1 : 0;
  const openI = ctx.openIssues;
  let avgTemp: number;
  let hasThermal: number;
  if (isPrinter) {
    avgTemp = -1;
    hasThermal = 0;
  } else {
    hasThermal = 1;
    const bump = health === 'Needs Attention' ? 20 : health === 'Fair' ? 10 : 0;
    avgTemp = 55 + bump + Math.min(15, openI * 2.5);
  }

  const uptime = Math.max(
    90,
    Math.min(100, 100 - openI * 0.6 - (health === 'Needs Attention' ? 3 : health === 'Fair' ? 1.5 : 0))
  );

  return {
    asset_type: t,
    department: String(asset.department ?? CAT_DEFAULTS.department).trim() || CAT_DEFAULTS.department,
    location: String(asset.location ?? CAT_DEFAULTS.location).trim() || CAT_DEFAULTS.location,
    asset_status: String(asset.status ?? CAT_DEFAULTS.asset_status).trim() || CAT_DEFAULTS.asset_status,
    health_at_snapshot: health,
    is_unassigned: un,
    age_years: Math.round(ageYears * 10) / 10,
    warranty_days_remaining: warrantyDays,
    open_issues_count: openI,
    open_critical_or_high_issues: ctx.openCriticalOrHigh,
    issues_opened_90d: ctx.issuesOpened90d,
    maintenance_open_or_scheduled: ctx.maintenanceOpenOrScheduled,
    maintenance_completed_365d: ctx.maintenanceCompleted365d,
    days_since_last_maintenance: ctx.daysSinceLastMaintenance,
    rolling_error_count_30d: ctx.issuesOpened30d,
    avg_cpu_temp_c: Math.round(avgTemp * 10) / 10,
    has_thermal_reading: hasThermal,
    reported_uptime_pct: Math.round(uptime * 10) / 10,
  };
}

/**
 * Return probability[0,1] per row using ml/predict_risk.py, or null if ML unavailable.
 */
export function predictRiskProbabilitiesSync(rows: RiskFeatureRow[]): number[] | null {
  if (rows.length === 0) return [];
  const repoRoot = path.resolve(__dirname, '../..');
  const script = path.join(repoRoot, 'ml', 'predict_risk.py');
  const modelFile = path.join(repoRoot, 'ml', 'models', 'risk_30d.joblib');
  if (!fs.existsSync(modelFile) || !fs.existsSync(script)) {
    return null;
  }
  const input = JSON.stringify(rows);
  const py = process.env.PYTHON_PATH || 'python';
  const r = spawnSync(py, [script], {
    cwd: repoRoot,
    input,
    encoding: 'utf-8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (r.error || r.status !== 0) {
    if (r.stderr) console.error('[mlRiskService]', r.stderr);
    return null;
  }
  try {
    const j = JSON.parse(r.stdout) as { probabilities: number[] };
    if (!Array.isArray(j.probabilities) || j.probabilities.length !== rows.length) {
      return null;
    }
    return j.probabilities;
  } catch {
    return null;
  }
}

/**
 * Heuristic risk probability when ML is unavailable (matches old behavior, scaled 0-1).
 */
export function heuristicRiskProbability(
  health: string,
  hasCriticalIssue: boolean,
  openIssues: number
): number {
  const h = health;
  const base = h === 'Needs Attention' ? 0.91 : h === 'Fair' ? 0.78 : 0.68;
  const boost = hasCriticalIssue ? 0.05 : 0;
  const issueBoost = Math.min(0.08, openIssues * 0.01);
  return Math.min(0.99, base + boost + issueBoost);
}
