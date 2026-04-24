import { Router, Request, Response } from 'express';
import { db } from '../db';
import { UPLOADS_DIR } from '../uploadsDir';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = Router();

function rowWithFiles(r: any) {
  let files: string[] = [];
  try {
    files = r.attachments ? JSON.parse(String(r.attachments)) : [];
    if (!Array.isArray(files)) files = [];
  } catch {
    files = [];
  }
  return { ...r, files };
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (_req, file, cb) {
    const rawExt = path.extname(file.originalname || '');
    const ext = rawExt && /^\.[a-zA-Z0-9]{1,16}$/.test(rawExt) ? rawExt : '';
    const id = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `${id}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 400 * 1024 * 1024 },
});

// GET all active assets or filter by assignedTo
router.get('/', (req: Request, res: Response) => {
  const assignedTo = req.query.assignedTo;

  let sql = 'SELECT * FROM assets WHERE deletedAt IS NULL';
  let params: any[] = [];

  if (assignedTo) {
    sql = 'SELECT * FROM assets WHERE assignedTo = ? AND deletedAt IS NULL';
    params = [assignedTo as string];
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json((rows || []).map(rowWithFiles));
  });
});

// GET soft-deleted assets (history) — register before GET /:id
router.get('/history', (req: Request, res: Response) => {
  db.all(
    'SELECT * FROM assets WHERE deletedAt IS NOT NULL ORDER BY deletedAt DESC',
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json((rows || []).map(rowWithFiles));
    }
  );
});

// GET a single active asset by ID
router.get('/:id', (req: Request, res: Response) => {
  db.get('SELECT * FROM assets WHERE id = ? AND deletedAt IS NULL', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    res.json(rowWithFiles(row));
  });
});

// POST a new asset (multipart: fields + optional assetImage file)
router.post('/', (req: Request, res: Response) => {
  upload.single('assetImage')(req, res, (multerErr) => {
    if (multerErr) {
      console.error('Asset image upload error:', multerErr);
      const message = multerErr instanceof Error ? multerErr.message : 'Upload failed';
      res.status(400).json({ error: message });
      return;
    }

    const b = req.body;
    const cleanId = String(b.id ?? '').trim();
    const cleanName = String(b.name ?? '').trim();
    const cleanType = String(b.type ?? '').trim();
    const cleanSerialNumber = String(b.serialNumber ?? '').trim();
    const cleanAssignedTo = String(b.assignedTo ?? 'Unassigned').trim() || 'Unassigned';
    const cleanDepartment = String(b.department ?? '').trim();
    const cleanStatus = String(b.status ?? 'Active').trim() || 'Active';
    const cleanPurchaseDate = String(b.purchaseDate ?? '').trim();
    const cleanWarrantyExpiry = String(b.warrantyExpiry ?? '').trim();
    const cleanLocation = String(b.location ?? '').trim();
    const cleanHealth = String(b.health ?? 'Excellent').trim() || 'Excellent';
    const cleanSpecifications = String(b.specifications ?? '').trim();

    const uploadedNames: string[] = [];
    const f = req.file as Express.Multer.File | undefined;
    if (f?.filename) uploadedNames.push(f.filename);
    const attachments = JSON.stringify(uploadedNames);

    if (!cleanId || !cleanName || !cleanType) {
      for (const name of uploadedNames) {
        fs.unlink(path.join(UPLOADS_DIR, name), () => {});
      }
      res.status(400).json({ error: 'id, name, and type are required.' });
      return;
    }

    if (cleanPurchaseDate && !/^\d{4}-\d{2}-\d{2}$/.test(cleanPurchaseDate)) {
      for (const name of uploadedNames) {
        fs.unlink(path.join(UPLOADS_DIR, name), () => {});
      }
      res.status(400).json({ error: 'purchaseDate must be in YYYY-MM-DD format.' });
      return;
    }
    if (cleanWarrantyExpiry && !/^\d{4}-\d{2}-\d{2}$/.test(cleanWarrantyExpiry)) {
      for (const name of uploadedNames) {
        fs.unlink(path.join(UPLOADS_DIR, name), () => {});
      }
      res.status(400).json({ error: 'warrantyExpiry must be in YYYY-MM-DD format.' });
      return;
    }

    const sql =
      'INSERT INTO assets (id, name, type, serialNumber, assignedTo, department, status, purchaseDate, warrantyExpiry, location, health, specifications, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const params = [
      cleanId,
      cleanName,
      cleanType,
      cleanSerialNumber,
      cleanAssignedTo,
      cleanDepartment,
      cleanStatus,
      cleanPurchaseDate,
      cleanWarrantyExpiry,
      cleanLocation,
      cleanHealth,
      cleanSpecifications,
      attachments,
    ];

    db.run(sql, params, function (runErr) {
      if (runErr) {
        for (const name of uploadedNames) {
          fs.unlink(path.join(UPLOADS_DIR, name), () => {});
        }
        res.status(400).json({ error: runErr.message });
        return;
      }
      res.json({
        id: cleanId,
        name: cleanName,
        type: cleanType,
        serialNumber: cleanSerialNumber,
        assignedTo: cleanAssignedTo,
        department: cleanDepartment,
        status: cleanStatus,
        purchaseDate: cleanPurchaseDate,
        warrantyExpiry: cleanWarrantyExpiry,
        location: cleanLocation,
        health: cleanHealth,
        specifications: cleanSpecifications,
        attachments,
        files: uploadedNames,
      });
    });
  });
});

// PATCH update an asset
router.patch('/:id', (req: Request, res: Response) => {
  const {
    name,
    type,
    serialNumber,
    assignedTo,
    department,
    status,
    purchaseDate,
    warrantyExpiry,
    location,
    health,
    specifications,
  } = req.body;
  const sql = `UPDATE assets SET 
    name = COALESCE(?, name),
    type = COALESCE(?, type),
    serialNumber = COALESCE(?, serialNumber),
    assignedTo = COALESCE(?, assignedTo),
    department = COALESCE(?, department),
    status = COALESCE(?, status),
    purchaseDate = COALESCE(?, purchaseDate),
    warrantyExpiry = COALESCE(?, warrantyExpiry),
    location = COALESCE(?, location),
    health = COALESCE(?, health),
    specifications = COALESCE(?, specifications)
    WHERE id = ? AND deletedAt IS NULL`;
  db.run(
    sql,
    [
      name,
      type,
      serialNumber,
      assignedTo,
      department,
      status,
      purchaseDate,
      warrantyExpiry,
      location,
      health,
      specifications,
      req.params.id,
    ],
    function (err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ updated: this.changes });
    }
  );
});

// POST restore a soft-deleted asset
router.post('/:id/restore', (req: Request, res: Response) => {
  const id = String(req.params.id ?? '').trim();
  if (!id) {
    res.status(400).json({ error: 'Invalid asset id.' });
    return;
  }
  db.run(
    `UPDATE assets SET deletedAt = NULL WHERE id = ? AND deletedAt IS NOT NULL`,
    [id],
    function(err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Asset not found or not in deleted history.' });
        return;
      }
      res.json({ restored: this.changes, id });
    }
  );
});

// DELETE an asset (soft delete — attachments kept for restore)
router.delete('/:id', (req: Request, res: Response) => {
  const id = String(req.params.id ?? '').trim();
  if (!id) {
    res.status(400).json({ error: 'Invalid asset id.' });
    return;
  }
  db.run(
    `UPDATE assets SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL`,
    [id],
    function(delErr) {
      if (delErr) {
        res.status(400).json({ error: delErr.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Asset not found or already removed.' });
        return;
      }
      res.json({ deleted: this.changes, id });
    }
  );
});

export default router;
