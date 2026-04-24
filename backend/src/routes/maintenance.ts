import { Router, Request, Response } from 'express';
import { db } from '../db';
import {
  buildFeatureRow,
  heuristicRiskProbability,
  predictRiskProbabilitiesSync,
} from '../mlRiskService';

const router = Router();

const activeMaintenanceWhere = 'WHERE deletedAt IS NULL';

// GET all active (non-deleted) maintenance tasks
router.get('/', (req: Request, res: Response) => {
  db.all(
    `SELECT * FROM maintenance_tasks ${activeMaintenanceWhere} ORDER BY createdAt DESC`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// GET soft-deleted maintenance tasks (history)
router.get('/history', (req: Request, res: Response) => {
  db.all(
    `SELECT * FROM maintenance_tasks WHERE deletedAt IS NOT NULL ORDER BY deletedAt DESC`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// POST restore a soft-deleted maintenance task back to the active schedule
router.post('/:id/restore', (req: Request, res: Response) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id) || id < 1) {
    res.status(400).json({ error: 'Invalid maintenance task id.' });
    return;
  }
  db.run(
    `UPDATE maintenance_tasks SET deletedAt = NULL WHERE id = ? AND deletedAt IS NOT NULL`,
    [id],
    function(err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Task not found or not in deleted history.' });
        return;
      }
      res.json({ restored: this.changes, id });
    }
  );
});

// POST a new maintenance task
router.post('/', (req: Request, res: Response) => {
  const { assetId, type, description, scheduledDate, priority, status, assignedTo } = req.body;
  const cleanAssetId = String(assetId ?? '').trim();
  const cleanType = String(type ?? '').trim();
  const cleanScheduledDate = String(scheduledDate ?? '').trim();
  const cleanPriority = String(priority ?? 'Medium').trim() || 'Medium';
  const cleanStatus = String(status ?? 'Scheduled').trim() || 'Scheduled';
  const cleanAssignedTo = String(assignedTo ?? 'Unassigned').trim() || 'Unassigned';
  const cleanDescription = String(description ?? '').trim();

  if (!cleanAssetId || !cleanType || !cleanScheduledDate) {
    res.status(400).json({ error: 'assetId, type, and scheduledDate are required.' });
    return;
  }

  // Expect ISO date from <input type="date">: YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanScheduledDate)) {
    res.status(400).json({ error: 'scheduledDate must be in YYYY-MM-DD format.' });
    return;
  }
  const parsed = new Date(`${cleanScheduledDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    res.status(400).json({ error: 'scheduledDate is invalid.' });
    return;
  }

  db.get(
    'SELECT 1 as ok FROM assets WHERE id = ? AND deletedAt IS NULL LIMIT 1',
    [cleanAssetId],
    (assetErr, row) => {
    if (assetErr) {
      res.status(500).json({ error: assetErr.message });
      return;
    }
    if (!row) {
      res.status(400).json({ error: `Unknown assetId: ${cleanAssetId}` });
      return;
    }

    const sql = 'INSERT INTO maintenance_tasks (assetId, type, description, scheduledDate, priority, status, assignedTo) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const params = [
      cleanAssetId,
      cleanType,
      cleanDescription,
      cleanScheduledDate,
      cleanPriority,
      cleanStatus,
      cleanAssignedTo
    ];

    db.run(sql, params, function(err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({
        id: this.lastID,
        assetId: cleanAssetId,
        type: cleanType,
        description: cleanDescription,
        scheduledDate: cleanScheduledDate,
        priority: cleanPriority,
        status: cleanStatus,
        assignedTo: cleanAssignedTo
      });
    });
  });
});

const MAINTENANCE_STATUSES = ['Scheduled', 'In Progress', 'Completed', 'Overdue'] as const;

// PATCH update maintenance task status
router.patch('/:id', (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Number.parseInt(String(rawId), 10);
  if (!Number.isFinite(id) || id < 1) {
    res.status(400).json({ error: 'Invalid maintenance task id.' });
    return;
  }

  const nextStatus = String(req.body?.status ?? '').trim();
  if (!MAINTENANCE_STATUSES.includes(nextStatus as (typeof MAINTENANCE_STATUSES)[number])) {
    res.status(400).json({
      error: `status must be one of: ${MAINTENANCE_STATUSES.join(', ')}.`,
    });
    return;
  }

  db.run(
    `UPDATE maintenance_tasks SET status = ? WHERE id = ? AND deletedAt IS NULL`,
    [nextStatus, id],
    function(err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Maintenance task not found.' });
        return;
      }
      res.json({ updated: this.changes, id, status: nextStatus });
    }
  );
});

// DELETE maintenance task (soft delete — row kept for history)
router.delete('/:id', (req: Request, res: Response) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id) || id < 1) {
    res.status(400).json({ error: 'Invalid maintenance task id.' });
    return;
  }
  db.run(
    `UPDATE maintenance_tasks SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL`,
    [id],
    function(err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Maintenance task not found or already removed.' });
        return;
      }
      res.json({ deleted: this.changes, id });
    }
  );
});

// GET AI-driven predictions based on real assets health/status
router.get('/predictions', (req: Request, res: Response) => {
  db.serialize(() => {
    db.all('SELECT * FROM assets WHERE deletedAt IS NULL', [], (err, assets: any[]) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      db.all(
        `SELECT assetId, COUNT(*) as count
         FROM maintenance_tasks
         WHERE deletedAt IS NULL AND status IN ('Scheduled', 'In Progress')
         GROUP BY assetId`,
        [],
        (maintErr, maintRows: any[]) => {
          if (maintErr) {
            res.status(500).json({ error: maintErr.message });
            return;
          }

          db.all(
            `SELECT assetId, priority, status
             FROM issues
             WHERE deletedAt IS NULL AND status IN ('Pending', 'In Progress')`,
            [],
            (issuesErr, issueRows: any[]) => {
              if (issuesErr) {
                res.status(500).json({ error: issuesErr.message });
                return;
              }

              db.all(
                'SELECT assetId, priority, status, createdAt FROM issues WHERE deletedAt IS NULL',
                [],
                (allIssErr, allIssues: any[]) => {
                  if (allIssErr) {
                    res.status(500).json({ error: allIssErr.message });
                    return;
                  }

                  db.all(
                    'SELECT assetId, status, createdAt FROM maintenance_tasks WHERE deletedAt IS NULL',
                    [],
                    (allMtErr, allMaint: any[]) => {
                    if (allMtErr) {
                      res.status(500).json({ error: allMtErr.message });
                      return;
                    }

                    const nowMs = Date.now();
                    const dayMs = 86400000;

                    type IssueStats = { open: number; critHigh: number; d90: number; d30: number };
                    const issueStats = new Map<string, IssueStats>();
                    const getIs = (aid: string): IssueStats => {
                      if (!issueStats.has(aid)) {
                        issueStats.set(aid, { open: 0, critHigh: 0, d90: 0, d30: 0 });
                      }
                      return issueStats.get(aid)!;
                    };

                    for (const r of allIssues) {
                      const assetId = String(r.assetId ?? '');
                      if (!assetId) continue;
                      const pr = String(r.priority ?? '').toLowerCase();
                      const st = String(r.status ?? '');
                      const isOpen = st === 'Pending' || st === 'In Progress';
                      const cTime = r.createdAt ? new Date(r.createdAt).getTime() : 0;
                      if (!cTime) continue;
                      const ageDays = (nowMs - cTime) / dayMs;
                      if (ageDays < 0) continue;
                      const s = getIs(assetId);
                      if (ageDays <= 90) s.d90 += 1;
                      if (ageDays <= 30) s.d30 += 1;
                      if (isOpen) {
                        s.open += 1;
                        if (pr === 'critical' || pr === 'high') s.critHigh += 1;
                      }
                    }

                    type MtStats = { openSched: number; c365: number; lastD: string | null };
                    const maintStats = new Map<string, MtStats>();
                    const getMs = (aid: string): MtStats => {
                      if (!maintStats.has(aid)) {
                        maintStats.set(aid, { openSched: 0, c365: 0, lastD: null });
                      }
                      return maintStats.get(aid)!;
                    };
                    for (const r of allMaint) {
                      const assetId = String(r.assetId ?? '');
                      if (!assetId) continue;
                      const st = String(r.status ?? '');
                      const ms = getMs(assetId);
                      if (st === 'Scheduled' || st === 'In Progress') ms.openSched += 1;
                      const cTime = r.createdAt ? new Date(r.createdAt).getTime() : 0;
                      if (cTime) {
                        const ageDays = (nowMs - cTime) / dayMs;
                        if (ageDays >= 0 && ageDays <= 365) ms.c365 += 1;
                        const dStr = String(r.createdAt);
                        if (!ms.lastD || dStr > ms.lastD) ms.lastD = dStr;
                      }
                    }

                    const openMaintenanceCountByAsset = new Map<string, number>();
                    maintRows.forEach((r: any) => {
                      if (r?.assetId) openMaintenanceCountByAsset.set(String(r.assetId), Number(r.count ?? 0));
                    });

                    const openIssueCountByAsset = new Map<string, number>();
                    const hasOpenCriticalIssueByAsset = new Map<string, boolean>();
                    issueRows.forEach((r: any) => {
                      const assetId = String(r.assetId ?? '');
                      if (!assetId) return;
                      openIssueCountByAsset.set(assetId, (openIssueCountByAsset.get(assetId) ?? 0) + 1);
                      if (String(r.priority).toLowerCase() === 'critical') {
                        hasOpenCriticalIssueByAsset.set(assetId, true);
                      }
                    });

              const severityMap: Record<string, 'Critical' | 'High' | 'Medium' | 'Low'> = {
                'Needs Attention': 'Critical',
                'Fair': 'High',
                'Good': 'Medium',
              };

              type PredictionType =
                | 'Failure'
                | 'Performance Degradation'
                | 'Component Wear'
                | 'Overheating'
                | 'Battery Issue';

              const typeMap: Record<string, PredictionType> = {
                'Needs Attention': 'Failure',
                'Fair': 'Performance Degradation',
                'Good': 'Component Wear',
              };

              const filtered = assets.filter((a) => (a.health ?? 'Good') !== 'Excellent');

                    const featureRows = filtered.map((asset) => {
                      const assetId = String(asset.id);
                      const is = getIs(assetId);
                      const ms = getMs(assetId);
                      const last = ms.lastD ? new Date(ms.lastD).getTime() : 0;
                      const daysSinceLastM = last
                        ? Math.max(0, Math.floor((nowMs - last) / dayMs))
                        : 999;
                      return buildFeatureRow(asset, {
                        openIssues: is.open,
                        openCriticalOrHigh: is.critHigh,
                        issuesOpened90d: is.d90,
                        issuesOpened30d: is.d30,
                        maintenanceOpenOrScheduled: openMaintenanceCountByAsset.get(assetId) ?? ms.openSched,
                        maintenanceCompleted365d: ms.c365,
                        daysSinceLastMaintenance: daysSinceLastM,
                      });
                    });

                    const mlProbs = predictRiskProbabilitiesSync(featureRows);

                    const predictions = filtered.map((asset, idx) => {
                      const assetId = String(asset.id);
                      const health = String(asset.health ?? 'Good');

                      const openMaint = openMaintenanceCountByAsset.get(assetId) ?? 0;
                      const openIssues = openIssueCountByAsset.get(assetId) ?? 0;
                      const hasCriticalIssue = hasOpenCriticalIssueByAsset.get(assetId) ?? false;

                      const p = mlProbs
                        ? mlProbs[idx]
                        : heuristicRiskProbability(health, hasCriticalIssue, openIssues);
                      const confidenceScore = Math.min(99, Math.max(0, Math.round(p * 1000) / 10));

                      const daysUntil = Math.max(
                        1,
                        Math.min(60, Math.round((1 - p) * 45 + (hasCriticalIssue ? 0 : 3)))
                      );

                      const predictedDate = new Date(Date.now() + daysUntil * 86400000)
                        .toISOString()
                        .split('T')[0];

                      const baseSeverity = severityMap[health] ?? 'Low';
                      const fromProb: 'Critical' | 'High' | 'Medium' | 'Low' =
                        p > 0.7 ? 'Critical' : p > 0.45 ? 'High' : p > 0.2 ? 'Medium' : 'Low';
                      const fromHealth: 'Critical' | 'High' | 'Medium' | 'Low' = hasCriticalIssue
                        ? 'Critical'
                        : baseSeverity;
                      const rank: Record<string, number> = {
                        Critical: 0,
                        High: 1,
                        Medium: 2,
                        Low: 3,
                      };
                      const severity =
                        (rank[fromHealth] < rank[fromProb] ? fromHealth : fromProb);

                      const predictionType: PredictionType = hasCriticalIssue
                        ? 'Failure'
                        : (typeMap[health] ?? 'Component Wear');

                      const status: 'Pending Review' | 'Acknowledged' | 'Action Scheduled' | 'Resolved' | 'False Positive' =
                        openMaint > 0 ? 'Action Scheduled' : 'Pending Review';

                      const errorCount = openIssues + (health === 'Needs Attention' ? 25 : health === 'Fair' ? 8 : 2);
                      const avgTemperature = health === 'Needs Attention' ? 82 : health === 'Fair' ? 68 : 55;

                      const purchase = asset.purchaseDate ? new Date(asset.purchaseDate) : null;
                      const ageYears = purchase
                        ? (Date.now() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 365)
                        : 2;
                      const uptime = Math.max(100, Math.round(500 + ageYears * 900 + errorCount * 3));

                      const riskLine = `ML 30d risk score: ${confidenceScore}%. `;

                      return {
                        id: `PRED-${assetId}`,
                        assetId,
                        assetName: asset.name,
                        assetType: asset.type,
                        department: asset.department,
                        mlPowered: Boolean(mlProbs),
                        predictionType,
                        confidenceScore: Number(confidenceScore.toFixed(1)),
                        predictedDate,
                        daysUntilAction: daysUntil,
                        severity,
                        status,
                        description: hasCriticalIssue
                          ? `${riskLine}Open critical issue detected. Immediate investigation recommended.`
                          : `${riskLine}Asset health is "${health}". Monitoring indicates potential degradation.`,
                        recommendedAction: openMaint > 0
                          ? 'Maintenance is already scheduled. Ensure parts and technician availability, then complete diagnostics.'
                          : health === 'Needs Attention'
                            ? 'Schedule immediate inspection and preventive maintenance.'
                            : health === 'Fair'
                              ? 'Schedule maintenance within 2 weeks. Monitor for further degradation.'
                              : 'Plan routine maintenance in next scheduled cycle.',
                        historicalData: {
                          uptime,
                          avgTemperature,
                          errorCount,
                          lastMaintenance: asset.purchaseDate || 'N/A',
                        },
                        createdAt: new Date().toISOString().split('T')[0],
                      };
                    });

                    predictions.sort((a, b) => {
                      const order: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
                      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
                    });

                    res.json(predictions);
                  });
                });
              });
          });
    });
  });
});

export default router;
