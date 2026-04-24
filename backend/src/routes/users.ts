import { Router, Request, Response } from 'express';
import { db } from '../db';
import crypto from 'crypto';
import { sendLoginNotificationEmail } from '../mail';

const router = Router();

const generateRecoveryCodes = (count = 10): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const buf = crypto.randomBytes(8).toString('hex').toUpperCase();
    codes.push(`${buf.slice(0, 4)}-${buf.slice(4, 8)}-${buf.slice(8, 12)}`);
  }
  return codes;
};

const hashCode = (code: string) =>
  crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex');

// GET all users
router.get('/', (req: Request, res: Response) => {
  db.all('SELECT id, name, email, role, department, status, lastActive FROM users', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST a new user (Create admin or user manually from dashboard)
router.post('/', (req: Request, res: Response) => {
  const { name, email, password, role, department, status, lastActive } = req.body;
  const cleanPassword = String(password ?? '').trim();
  if (!cleanPassword || cleanPassword.length < 6) {
    res.status(400).json({ error: 'Password is required and must be at least 6 characters.' });
    return;
  }
  const recoveryCodes = generateRecoveryCodes(10);
  const recoveryCodesHash = JSON.stringify(recoveryCodes.map(hashCode));
  const sql = 'INSERT INTO users (name, email, password, role, department, status, lastActive, recoveryCodes, passwordResetRequired) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const params = [
    name,
    email,
    cleanPassword,
    role || 'user',
    department || 'Unassigned',
    status || 'Active',
    lastActive || 'Just now',
    recoveryCodesHash,
    0
  ];

  db.run(sql, params, function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({
      id: this.lastID,
      name,
      email,
      role: params[3],
      department: params[4],
      status: params[5],
      lastActive: params[6],
      recoveryCodes,
    });
  });
});

// PATCH update user role/status/password
router.patch('/:id', (req: Request, res: Response) => {
  const { role, status, department, password, passwordResetRequired } = req.body;
  const sql = `UPDATE users SET 
    role = COALESCE(?, role),
    status = COALESCE(?, status),
    department = COALESCE(?, department),
    password = COALESCE(?, password),
    passwordResetRequired = COALESCE(?, passwordResetRequired)
    WHERE id = ?`;
  db.run(sql, [role, status, department, password, passwordResetRequired, req.params.id], function(err) {
    if (err) { res.status(400).json({ error: err.message }); return; }
    res.json({ updated: this.changes });
  });
});

// POST /:id/admin-reset — new recovery codes only (login password unchanged)
router.post('/:id/admin-reset', (req: Request, res: Response) => {
  const userId = req.params.id;
  const recoveryCodes = generateRecoveryCodes(10);
  const recoveryCodesHash = JSON.stringify(recoveryCodes.map(hashCode));

  db.run(
    'UPDATE users SET recoveryCodes = ? WHERE id = ?',
    [recoveryCodesHash, userId],
    function(err) {
      if (err) { res.status(400).json({ error: err.message }); return; }
      if (this.changes === 0) { res.status(404).json({ error: 'User not found' }); return; }
      res.json({ recoveryCodes });
    }
  );
});

// POST /recovery/reset — reset password using recovery code
router.post('/recovery/reset', (req: Request, res: Response) => {
  const { email, recoveryCode, newPassword } = req.body;

  const cleanEmail = String(email ?? '').trim().toLowerCase();
  const cleanCode = String(recoveryCode ?? '').trim();
  const cleanPw = String(newPassword ?? '').trim();

  if (!cleanEmail || !cleanCode || !cleanPw) {
    res.status(400).json({ error: 'email, recoveryCode, and newPassword are required' });
    return;
  }
  if (cleanPw.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  db.get('SELECT id, recoveryCodes FROM users WHERE lower(email) = ?', [cleanEmail], (err, row: any) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    if (!row) { res.status(404).json({ error: 'User not found' }); return; }

    let hashes: string[] = [];
    try {
      hashes = row.recoveryCodes ? JSON.parse(String(row.recoveryCodes)) : [];
      if (!Array.isArray(hashes)) hashes = [];
    } catch {
      hashes = [];
    }

    const h = hashCode(cleanCode);
    if (!hashes.includes(h)) {
      res.status(400).json({ error: 'Invalid recovery code' });
      return;
    }

    const remaining = hashes.filter(x => x !== h);
    db.run(
      'UPDATE users SET password = ?, passwordResetRequired = 0, recoveryCodes = ? WHERE id = ?',
      [cleanPw, JSON.stringify(remaining), row.id],
      function(upErr) {
        if (upErr) { res.status(400).json({ error: upErr.message }); return; }
        res.json({ message: 'Password reset successful' });
      }
    );
  });
});

// DELETE a user
router.delete('/:id', (req: Request, res: Response) => {
  // Prevent deleting admin accounts
  db.get('SELECT role FROM users WHERE id = ?', [req.params.id], (err, user: any) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(delErr) {
      if (delErr) { res.status(400).json({ error: delErr.message }); return; }
      res.json({ deleted: this.changes });
    });
  });
});

// POST /register
router.post('/register', (req: Request, res: Response) => {
  const name = String(req.body?.name ?? '').trim();
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '').trim();
  
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }

  const role = 'user';
  const status = 'Active';
  const lastActive = 'Just now';
  const department = 'Unassigned';

  const recoveryCodes = generateRecoveryCodes(10);
  const recoveryCodesHash = JSON.stringify(recoveryCodes.map(hashCode));

  const sql = 'INSERT INTO users (name, email, password, role, department, status, lastActive, recoveryCodes, passwordResetRequired) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  
  db.run(sql, [name, email, password, role, department, status, lastActive, recoveryCodesHash, 0], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed: users.email')) {
        res.status(409).json({ error: 'Email already exists' });
      } else {
        res.status(400).json({ error: err.message });
      }
      return;
    }
    res.status(201).json({
      message: 'User registered successfully',
      user: { id: this.lastID, name, email, role },
      recoveryCodes
    });
  });
});

// POST /login
router.post('/login', (req: Request, res: Response) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '').trim();
  
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  db.get(
    'SELECT * FROM users WHERE LOWER(TRIM(email)) = ? AND password = ?',
    [email, password],
    (err, user: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const { password: _, recoveryCodes: __, ...userWithoutPassword } = user;
    db.run('UPDATE users SET lastActive = ? WHERE id = ?', ['Just now', user.id]);

    void sendLoginNotificationEmail({
      to: user.email,
      userName: String(user.name || user.email || 'User'),
    }).catch((e) => console.error('[mail] login notification failed:', e));

    res.json({
      message: 'Login successful',
      user: userWithoutPassword
    });
  });
});

export default router;
