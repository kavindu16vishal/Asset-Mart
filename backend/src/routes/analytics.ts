import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

// Helper to run SQLite queries with Promises
const runQueryAll = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const runQueryGet = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

router.get('/', async (req: Request, res: Response) => {
  try {
    // 1. Assets by Department
    const departmentAssetDataRaw = await runQueryAll(`
      SELECT department, COUNT(*) as count 
      FROM assets 
      WHERE department IS NOT NULL 
      GROUP BY department
    `);
    const departmentAssetData = departmentAssetDataRaw.map(row => ({
      department: row.department,
      count: row.count
    }));

    // 2. Asset Lifecycle Summary
    // Categorize based on purchaseDate: New (0-1 yr), Active (1-3 yrs), Aging (3-5 yrs), End of Life (5+ yrs)
    const lifecycleRaw = await runQueryAll(`
      SELECT purchaseDate FROM assets WHERE purchaseDate IS NOT NULL AND status != 'Retired'
    `);
    
    let newAssets = 0, activeAssets = 0, agingAssets = 0, eolAssets = 0;
    const now = new Date();
    
    lifecycleRaw.forEach(row => {
      if (row.purchaseDate) {
        const purchaseDate = new Date(row.purchaseDate);
        const ageInYears = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (ageInYears <= 1) newAssets++;
        else if (ageInYears <= 3) activeAssets++;
        else if (ageInYears <= 5) agingAssets++;
        else eolAssets++;
      }
    });

    const totalLifecycleAssets = newAssets + activeAssets + agingAssets + eolAssets;
    const calcPerc = (count: number) => totalLifecycleAssets > 0 ? ((count / totalLifecycleAssets) * 100).toFixed(1) + '%' : '0%';

    const lifecycleSummary = {
      new: { count: newAssets, percentage: calcPerc(newAssets) },
      active: { count: activeAssets, percentage: calcPerc(activeAssets) },
      aging: { count: agingAssets, percentage: calcPerc(agingAssets) },
      eol: { count: eolAssets, percentage: calcPerc(eolAssets) }
    };

    // 3. Issue Resolution Rate (Mocked by week, enriched with live total real-time data)
    // We'll calculate real 'Resolved' and 'Pending' from issues
    const issuesRaw = await runQueryAll(`SELECT status FROM issues`);
    let totalResolved = 0;
    let totalPending = 0;
    
    issuesRaw.forEach((issue) => {
        if (issue.status === 'Resolved') totalResolved++;
        else totalPending++;
    });

    // Mock weekly structure, but make the last week represent current DB state
    const issueResolutionData = [
      { week: 'Week 1', resolved: 45, pending: 12 },
      { week: 'Week 2', resolved: 52, pending: 8 },
      { week: 'Week 3', resolved: 38, pending: 15 },
      { week: 'Week 4 (Current)', resolved: totalResolved > 0 ? totalResolved : 61, pending: totalPending > 0 ? totalPending : 5 },
    ];

    // 4. AI Predictive Maintenance (from maintenance_tasks and issues)
    // Fetch upcoming maintenance
    const upcomingMaintenance = await runQueryAll(`
      SELECT assetId, type, description, scheduledDate 
      FROM maintenance_tasks 
      WHERE status IN ('Scheduled', 'In Progress')
      ORDER BY scheduledDate ASC 
      LIMIT 5
    `);

    // We can enrich with Asset name
    for (let task of upcomingMaintenance) {
      if (task.assetId) {
        const asset = await runQueryGet(`SELECT name FROM assets WHERE id = ?`, [task.assetId]);
        if (asset) task.assetName = asset.name;
      }
    }

    // 5. Mocked Data for charts that don't have DB support yet
    const assetPerformanceData = [
      { month: 'Jan', uptime: 98.5, issues: 12, maintenance: 5 },
      { month: 'Feb', uptime: 99.2, issues: 8, maintenance: 4 },
      { month: 'Mar', uptime: 97.8, issues: 15, maintenance: 7 },
      { month: 'Apr', uptime: 99.5, issues: 6, maintenance: 3 },
      { month: 'May', uptime: 98.9, issues: 10, maintenance: 5 },
      { month: 'Jun', uptime: 99.7, issues: 4, maintenance: 2 },
    ];

    const costAnalysisData = [
      { month: 'Jan', maintenance: 12500, replacement: 8000, new: 15000 },
      { month: 'Feb', maintenance: 11200, replacement: 5000, new: 12000 },
      { month: 'Mar', maintenance: 13800, replacement: 10000, new: 18000 },
      { month: 'Apr', maintenance: 9500, replacement: 3000, new: 10000 },
      { month: 'May', maintenance: 10800, replacement: 7000, new: 14000 },
      { month: 'Jun', maintenance: 8900, replacement: 4000, new: 9000 },
    ];

    const kpiData = [
      { label: 'Average Uptime', value: '99.2%', change: '+1.2%', trend: 'up', color: 'text-green-600' },
      { label: 'Mean Time to Repair', value: '2.3 hrs', change: '-0.5 hrs', trend: 'up', color: 'text-green-600' },
      { label: 'Asset Utilization', value: '87.4%', change: '+3.1%', trend: 'up', color: 'text-green-600' },
      { label: 'Maintenance Costs', value: '$8,900', change: '-$1,900', trend: 'up', color: 'text-green-600' },
    ];

    res.json({
      departmentAssetData,
      lifecycleSummary,
      issueResolutionData,
      upcomingMaintenance,
      assetPerformanceData,
      costAnalysisData,
      kpiData
    });

  } catch (error: any) {
    console.error('Analytics Fetch Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
