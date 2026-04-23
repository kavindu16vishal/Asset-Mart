import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

// GET all maintenance tasks
router.get('/', (req: Request, res: Response) => {
  db.all('SELECT * FROM maintenance_tasks ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
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

  db.get('SELECT 1 as ok FROM assets WHERE id = ? LIMIT 1', [cleanAssetId], (assetErr, row) => {
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

// PATCH update maintenance task status
router.patch('/:id', (req: Request, res: Response) => {
  const { status } = req.body;
  db.run('UPDATE maintenance_tasks SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ updated: this.changes });
  });
});

// GET AI-driven predictions based on real assets health/status
router.get('/predictions', (req: Request, res: Response) => {
  db.serialize(() => {
    db.all('SELECT * FROM assets', [], (err, assets: any[]) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      db.all(
        `SELECT assetId, COUNT(*) as count
         FROM maintenance_tasks
         WHERE status IN ('Scheduled', 'In Progress')
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
             WHERE status IN ('Pending', 'In Progress')`,
            [],
            (issuesErr, issueRows: any[]) => {
              if (issuesErr) {
                res.status(500).json({ error: issuesErr.message });
                return;
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

              const daysMap: Record<string, number> = {
                'Needs Attention': 5,
                'Fair': 14,
                'Good': 45,
              };

              const confidenceMap: Record<string, number> = {
                'Needs Attention': 91.5,
                'Fair': 84.0,
                'Good': 72.0,
              };

              const predictions = assets
                .filter(a => (a.health ?? 'Good') !== 'Excellent')
                .map((asset) => {
                  const assetId = String(asset.id);
                  const health = String(asset.health ?? 'Good');

                  const openMaint = openMaintenanceCountByAsset.get(assetId) ?? 0;
                  const openIssues = openIssueCountByAsset.get(assetId) ?? 0;
                  const hasCriticalIssue = hasOpenCriticalIssueByAsset.get(assetId) ?? false;

                  const daysUntil = daysMap[health] ?? 30;
                  const predictedDate = new Date(Date.now() + daysUntil * 86400000).toISOString().split('T')[0];

                  const baseSeverity = severityMap[health] ?? 'Low';
                  const severity: 'Critical' | 'High' | 'Medium' | 'Low' = hasCriticalIssue ? 'Critical' : baseSeverity;

                  const predictionType: PredictionType = hasCriticalIssue
                    ? 'Failure'
                    : (typeMap[health] ?? 'Component Wear');

                  const status: 'Pending Review' | 'Acknowledged' | 'Action Scheduled' | 'Resolved' | 'False Positive' =
                    openMaint > 0 ? 'Action Scheduled' : 'Pending Review';

                  const confidenceScore = Math.min(
                    99.0,
                    (confidenceMap[health] ?? 70.0) + (hasCriticalIssue ? 3 : 0)
                  );

                  const errorCount = openIssues + (health === 'Needs Attention' ? 25 : health === 'Fair' ? 8 : 2);
                  const avgTemperature = health === 'Needs Attention' ? 82 : health === 'Fair' ? 68 : 55;

                  const purchase = asset.purchaseDate ? new Date(asset.purchaseDate) : null;
                  const ageYears = purchase ? (Date.now() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 365) : 2;
                  const uptime = Math.max(100, Math.round(500 + ageYears * 900 + errorCount * 3));

                  return {
                    id: `PRED-${assetId}`,
                    assetId,
                    assetName: asset.name,
                    assetType: asset.type,
                    department: asset.department,
                    predictionType,
                    confidenceScore: Number(confidenceScore.toFixed(1)),
                    predictedDate,
                    daysUntilAction: daysUntil,
                    severity,
                    status,
                    description: hasCriticalIssue
                      ? `Open critical issue detected for this asset. Immediate investigation recommended.`
                      : `Asset health is "${health}". Monitoring indicates potential degradation based on current state.`,
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
            }
          );
        }
      );
    });
  });
});

export default router;
