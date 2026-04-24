import { Router, Request, Response } from 'express';
import { db } from '../db';
import { UPLOADS_DIR } from '../uploadsDir';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { getExtraAdminNotifyEmails, sendIssueResolvedEmail, sendNewIssueAdminEmail } from '../mail';

const router = Router();

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const rawExt = path.extname(file.originalname || '');
    const ext = rawExt && /^\.[a-zA-Z0-9]{1,16}$/.test(rawExt) ? rawExt : '';
    const id = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `${id}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 400 * 1024 * 1024 },
});

function attachFilesToIssues(rows: any[] | null): any[] {
  return (rows || []).map((r: any) => {
    let files: string[] = [];
    try {
      files = r.attachments ? JSON.parse(String(r.attachments)) : [];
      if (!Array.isArray(files)) files = [];
    } catch {
      files = [];
    }
    return { ...r, files };
  });
}

// GET all active (non-deleted) issues or issues by userId
router.get('/', (req: Request, res: Response) => {
  const userId = req.query.userId;

  let sql = `
    SELECT i.*, u.name as reporterName, u.email as reporterEmail
    FROM issues i
    LEFT JOIN users u ON i.reportedBy = u.id
    WHERE i.deletedAt IS NULL
    ORDER BY i.createdAt DESC
  `;
  let params: any[] = [];

  if (userId) {
    sql = `
      SELECT i.*, u.name as reporterName, u.email as reporterEmail
      FROM issues i
      LEFT JOIN users u ON i.reportedBy = u.id
      WHERE i.reportedBy = ? AND i.deletedAt IS NULL
      ORDER BY i.createdAt DESC
    `;
    params = [userId];
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(attachFilesToIssues(rows));
  });
});

// GET soft-deleted issues (history)
router.get('/history', (req: Request, res: Response) => {
  const sql = `
    SELECT i.*, u.name as reporterName, u.email as reporterEmail
    FROM issues i
    LEFT JOIN users u ON i.reportedBy = u.id
    WHERE i.deletedAt IS NOT NULL
    ORDER BY i.deletedAt DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(attachFilesToIssues(rows));
  });
});

// POST a new issue (with optional file uploads)
router.post('/', (req: Request, res: Response) => {
  upload.array('files', 20)(req, res, (err) => {
    if (err) {
      console.error('Issue upload error:', err);
      const message = err instanceof Error ? err.message : 'File upload failed';
      res.status(400).json({ error: message });
      return;
    }

    const { assetId, issueType, priority, description, status, reportedBy } = req.body;
    const uploaded = (req.files as Express.Multer.File[] | undefined)?.map((f) => f.filename) || [];
    const attachments = JSON.stringify(uploaded);
    const sql =
      'INSERT INTO issues (assetId, issueType, priority, description, status, reportedBy, attachments) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const params = [
      assetId || null,
      issueType || 'Other',
      priority || 'Medium',
      description || '',
      status || 'Pending',
      reportedBy != null && String(reportedBy).trim() !== '' ? String(reportedBy).trim() : null,
      attachments,
    ];

    db.run(sql, params, function (runErr) {
      if (runErr) {
        for (const name of uploaded) {
          const fp = path.join(UPLOADS_DIR, name);
          fs.unlink(fp, () => {});
        }
        res.status(400).json({ error: runErr.message });
        return;
      }

      const newIssueId = this.lastID;
      res.json({
        id: newIssueId,
        assetId,
        issueType,
        priority,
        description,
        status,
        reportedBy,
        files: uploaded,
      });

      const reportedByStr =
        reportedBy != null && String(reportedBy).trim() !== '' ? String(reportedBy).trim() : '';

      const notifyAdmins = (reporter: { name?: string; email?: string } | null) => {
        db.all(
          `SELECT email FROM users WHERE lower(role) = 'admin' AND email IS NOT NULL AND trim(email) != ''`,
          [],
          (_e2, rows: any[]) => {
            const fromDb = (rows || []).map((r) => String(r.email).trim()).filter(Boolean);
            const merged = [...new Set([...fromDb, ...getExtraAdminNotifyEmails()])];
            if (merged.length === 0) return;
            void sendNewIssueAdminEmail({
              to: merged,
              issueId: newIssueId,
              assetId: assetId ? String(assetId) : null,
              issueType: String(issueType || 'Other'),
              priority: String(priority || 'Medium'),
              description: String(description || ''),
              reporterName: reporter?.name ? String(reporter.name) : null,
              reporterEmail: reporter?.email ? String(reporter.email) : null,
              reporterUserId: reportedByStr || null,
            }).catch((err) => console.error('[mail] new issue admin notify failed:', err));
          }
        );
      };

      if (reportedByStr) {
        db.get(
          'SELECT name, email FROM users WHERE id = ?',
          [reportedByStr],
          (_e3, u: any) => notifyAdmins(u || null)
        );
      } else {
        notifyAdmins(null);
      }
    });
  });
});

// POST restore a soft-deleted issue
router.post('/:id/restore', (req: Request, res: Response) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id) || id < 1) {
    res.status(400).json({ error: 'Invalid issue id.' });
    return;
  }
  db.run(
    `UPDATE issues SET deletedAt = NULL WHERE id = ? AND deletedAt IS NOT NULL`,
    [id],
    function(err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Issue not found or not in deleted history.' });
        return;
      }
      res.json({ restored: this.changes, id });
    }
  );
});

// DELETE an issue (soft delete — kept for history)
router.delete('/:id', (req: Request, res: Response) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id) || id < 1) {
    res.status(400).json({ error: 'Invalid issue id.' });
    return;
  }
  db.run(
    `UPDATE issues SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL`,
    [id],
    function(err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Issue not found or already removed.' });
        return;
      }
      res.json({ deleted: this.changes, id });
    }
  );
});

// PATCH update issue status
router.patch('/:id', (req: Request, res: Response) => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id) || id < 1) {
    res.status(400).json({ error: 'Invalid issue id.' });
    return;
  }
  const newStatus = String(req.body?.status ?? '').trim();
  if (!newStatus) {
    res.status(400).json({ error: 'status is required' });
    return;
  }

  db.get(
    `SELECT i.id, i.status, i.assetId, i.issueType, i.priority, i.description, i.reportedBy,
            u.name as reporterName, u.email as reporterEmail
     FROM issues i
     LEFT JOIN users u ON i.reportedBy = u.id
     WHERE i.id = ? AND i.deletedAt IS NULL`,
    [id],
    (err, row: any) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(404).json({ error: 'Issue not found' });
        return;
      }

      const prevStatus = String(row.status ?? '');

      db.run(
        'UPDATE issues SET status = ? WHERE id = ? AND deletedAt IS NULL',
        [newStatus, id],
        function(updateErr) {
          if (updateErr) {
            res.status(400).json({ error: updateErr.message });
            return;
          }
          if (this.changes === 0) {
            res.status(404).json({ error: 'Issue not found' });
            return;
          }
          res.json({ updated: this.changes });

          const becameResolved = newStatus === 'Resolved' && prevStatus !== 'Resolved';
          const reporterEmail = row.reporterEmail ? String(row.reporterEmail).trim() : '';
          if (becameResolved && reporterEmail) {
            void sendIssueResolvedEmail({
              to: reporterEmail,
              userName: row.reporterName ? String(row.reporterName) : null,
              issueId: id,
              assetId: row.assetId ? String(row.assetId) : null,
              issueType: String(row.issueType || ''),
              priority: String(row.priority || ''),
              description: String(row.description || ''),
            }).catch((e) => console.error('[mail] issue resolved notify failed:', e));
          }
        }
      );
    }
  );
});

let geminiAi: GoogleGenAI | null = null;
let openAi: OpenAI | null = null;

if (process.env.GEMINI_API_KEY) {
  geminiAi = new GoogleGenAI({});
}

if (process.env.OPENAI_API_KEY) {
  openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// POST analyze an issue
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { description, issueType, assetId } = req.body;

    if (!description) {
      res.status(400).json({ error: 'Issue description is required for analysis' });
      return;
    }

    const systemInstruction = `You are an expert IT diagnostician. Analyze the following issue report. 
Given the description, provide:
1. A brief likely cause of the issue.
2. 2-3 step-by-step troubleshooting steps or a suggested solution.
Keep the overall response concise, friendly, and formatted in Markdown.`;

    const message = `Asset ID: ${assetId || 'Unknown'}\nIssue Type: ${issueType || 'Unknown'}\nDescription: ${description}`;

    if (openAi) {
      const response = await openAi.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: message }
        ]
      });
      res.json({ analysis: response.choices[0].message.content });
    } else if (geminiAi) {
      const response = await geminiAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: systemInstruction,
        }
      });
      res.json({ analysis: response.text });
    } else {
      res.status(500).json({ error: 'No AI API keys configured. Please setup OPENAI_API_KEY or GEMINI_API_KEY' });
    }

  } catch (error: any) {
    console.error('Error with AI analysis API:', error);
    res.status(500).json({ error: 'Failed to analyze issue.', details: error.message });
  }
});

export default router;
