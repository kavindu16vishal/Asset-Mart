import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

const dbAll = (sql: string, params: any[] = []): Promise<any[]> =>
  new Promise((resolve, reject) => db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));

const dbGet = (sql: string, params: any[] = []): Promise<any> =>
  new Promise((resolve, reject) => db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));

// GET /api/dashboard/stats — all live aggregated data for Dashboard charts
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Asset type distribution (for pie chart)
    const assetTypes = await dbAll(`SELECT type, COUNT(*) as count FROM assets GROUP BY type`);

    // Maintenance status (for bar chart)
    const maintenanceRows = await dbAll(`SELECT status, COUNT(*) as count FROM maintenance_tasks GROUP BY status`);
    const maintenanceData = [
      { status: 'Scheduled', count: 0 },
      { status: 'In Progress', count: 0 },
      { status: 'Completed', count: 0 },
      { status: 'Overdue', count: 0 },
    ];
    maintenanceRows.forEach((row: any) => {
      const idx = maintenanceData.findIndex(m => m.status === row.status);
      if (idx !== -1) maintenanceData[idx].count = row.count;
      else maintenanceData.push({ status: row.status, count: row.count });
    });

    // Live asset count for trend chart (using actual DB count instead of mock)
    const totalAssetsRow = await dbGet(`SELECT COUNT(*) as total FROM assets`);
    const totalAssets = totalAssetsRow?.total || 0;

    // Issue count per month (using createdAt)
    const issuesByMonth = await dbAll(`
      SELECT strftime('%m', createdAt) as month_num, COUNT(*) as issues
      FROM issues
      GROUP BY month_num
    `);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const issueMap: Record<string, number> = {};
    issuesByMonth.forEach((r: any) => {
      const idx = parseInt(r.month_num, 10) - 1;
      issueMap[monthNames[idx]] = r.issues;
    });

    // Build trend data for last 6 months dynamically 
    const now = new Date();
    const assetTrendData = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const label = monthNames[d.getMonth()];
      return {
        month: label,
        assets: totalAssets,
        issues: issueMap[label] || 0,
      };
    });

    // Top upcoming predictive maintenance alert from DB
    const upcomingAlert = await dbGet(`
      SELECT mt.*, a.name as assetName 
      FROM maintenance_tasks mt
      LEFT JOIN assets a ON mt.assetId = a.id
      WHERE mt.status IN ('Scheduled', 'In Progress') 
      ORDER BY mt.scheduledDate ASC 
      LIMIT 1
    `);

    // COLORS for pie slices (stable by index)
    const pieColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#14b8a6', '#f97316'];
    const assetTypeData = assetTypes.map((row: any, i: number) => ({
      name: row.type || 'Other',
      value: row.count,
      color: pieColors[i % pieColors.length],
    }));

    res.json({
      assetTrendData,
      assetTypeData,
      maintenanceData,
      upcomingAlert,
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
