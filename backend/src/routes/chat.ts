import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { db } from '../db';

const router = Router();

// Optional initialization, depending on what keys are available
let geminiAi: GoogleGenAI | null = null;
let openAi: OpenAI | null = null;

// Initialize clients if keys exist
if (process.env.GEMINI_API_KEY) {
  geminiAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

if (process.env.OPENAI_API_KEY) {
  openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Helper to query the database and return a promise
function queryAll(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { history, message, userRole } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Fetch compact live database context for admin users
    let dbContext = '';
    if (userRole === 'admin') {
      try {
        const [assets, issues, users] = await Promise.all([
          queryAll(
            'SELECT id, name, type, assignedTo, department, status, health FROM assets WHERE deletedAt IS NULL'
          ),
          queryAll(
            'SELECT id, assetId, issueType, priority, status FROM issues WHERE deletedAt IS NULL ORDER BY id DESC LIMIT 10'
          ),
          queryAll('SELECT id, name, role, department, status FROM users'),
        ]);

        const activeAssets = assets.filter((a: any) => a.status === 'Active').length;
        const maintenanceAssets = assets.filter((a: any) => a.status === 'Maintenance').length;
        const healthIssues = assets.filter((a: any) => a.health === 'Needs Attention' || a.health === 'Fair')
          .map((a: any) => `${a.name} (${a.health})`).join(', ');
        const openIssues = issues.filter((i: any) => i.status === 'Pending' || i.status === 'In Progress');
        const activeUsers = users.filter((u: any) => u.status === 'Active').length;
        const adminCount = users.filter((u: any) => u.role === 'admin').length;

        dbContext = `
LIVE DATA SNAPSHOT:
- Assets: ${assets.length} total, ${activeAssets} active, ${maintenanceAssets} in maintenance. Health problems: ${healthIssues || 'none'}.
- Issues (recent 10): ${issues.length} shown, ${openIssues.length} open. Open: ${openIssues.map((i: any) => `#${i.id} ${i.assetId} [${i.priority}/${i.issueType}]`).join(', ') || 'none'}.
- Users: ${users.length} total, ${activeUsers} active, ${adminCount} admins.
- Assets needing attention: ${assets.filter((a: any) => a.health === 'Needs Attention').map((a: any) => `${a.name} (${a.id})`).join(', ') || 'none'}.
- Maintenance assets: ${assets.filter((a: any) => a.status === 'Maintenance').map((a: any) => `${a.name}`).join(', ') || 'none'}.`;
      } catch (dbErr) {
        console.error('Failed to fetch DB context:', dbErr);
      }
    }

    const systemInstruction = userRole === 'admin'
      ? `You are an AI Assistant for "Asset Mart" (IT Asset Management). You assist the ADMIN with real-time system data.
Use the data snapshot below to give specific, accurate answers about assets, issues, and users.
Be concise and proactive about highlighting problems.
${dbContext}`
      : `You are a helpful AI Assistant for "Asset Mart", an IT Asset Management tool. Help users with their devices, issues, and maintenance questions. Be concise and polite.`;

    // Prioritize OpenAI if configured, otherwise fallback to Gemini
    if (openAi) {
      const formattedHistory = Array.isArray(history) 
        ? history.map((msg: any) => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          }))
        : [];
      
      const response = await openAi.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemInstruction },
          ...formattedHistory as any,
          { role: 'user', content: message }
        ]
      });

      res.json({ reply: response.choices[0].message.content });

    } else if (geminiAi) {
      const formattedHistory = Array.isArray(history) 
        ? history.map((msg: any) => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          }))
        : [];

      const response = await geminiAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          ...formattedHistory,
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: systemInstruction,
        }
      });

      res.json({ reply: response.text });
      
    } else {
      res.status(500).json({ error: 'No AI API keys configured. Please add OPENAI_API_KEY or GEMINI_API_KEY to backend/.env.' });
    }

  } catch (error: any) {
    console.error('Error with AI API:', error);
    res.status(500).json({ error: 'Failed to communicate with AI service.', details: error.message });
  }
});

export default router;
