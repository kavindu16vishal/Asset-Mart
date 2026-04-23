import { Router, Request, Response } from 'express';
import { db } from '../db';
import { UPLOADS_DIR } from '../uploadsDir';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

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

// GET all issues or issues by userId
router.get('/', (req: Request, res: Response) => {
  const userId = req.query.userId;
  
  let sql = `
    SELECT i.*, u.name as reporterName, u.email as reporterEmail 
    FROM issues i 
    LEFT JOIN users u ON i.reportedBy = u.id 
    ORDER BY i.createdAt DESC
  `;
  let params: any[] = [];

  if (userId) {
    sql = `
      SELECT i.*, u.name as reporterName, u.email as reporterEmail 
      FROM issues i 
      LEFT JOIN users u ON i.reportedBy = u.id 
      WHERE i.reportedBy = ? 
      ORDER BY i.createdAt DESC
    `;
    params = [userId];
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const withAttachments = (rows || []).map((r: any) => {
      let files: string[] = [];
      try {
        files = r.attachments ? JSON.parse(String(r.attachments)) : [];
        if (!Array.isArray(files)) files = [];
      } catch {
        files = [];
      }
      return { ...r, files };
    });
    res.json(withAttachments);
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
      res.json({
        id: this.lastID,
        assetId,
        issueType,
        priority,
        description,
        status,
        reportedBy,
        files: uploaded,
      });
    });
  });
});

// DELETE an issue
router.delete('/:id', (req: Request, res: Response) => {
  db.run('DELETE FROM issues WHERE id = ?', [req.params.id], function(err) {
    if (err) { res.status(400).json({ error: err.message }); return; }
    res.json({ deleted: this.changes });
  });
});

// PATCH update issue status
router.patch('/:id', (req: Request, res: Response) => {
  const { status } = req.body;
  db.run('UPDATE issues SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
    if (err) { res.status(400).json({ error: err.message }); return; }
    if (this.changes === 0) { res.status(404).json({ error: 'Issue not found' }); return; }
    res.json({ updated: this.changes });
  });
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
