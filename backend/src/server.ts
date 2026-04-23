import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import assetsRouter from './routes/assets';
import usersRouter from './routes/users';
import issuesRouter from './routes/issues';
import chatRouter from './routes/chat';
import maintenanceRouter from './routes/maintenance';
import analyticsRouter from './routes/analytics';
import dashboardRouter from './routes/dashboard';
import { UPLOADS_DIR, ensureUploadsDir } from './uploadsDir';
import './db'; // Initialize Database

ensureUploadsDir();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded issues attachments)
app.use('/uploads', express.static(UPLOADS_DIR));

// Routes
app.use('/api/assets', assetsRouter);
app.use('/api/users', usersRouter);
app.use('/api/issues', issuesRouter);
app.use('/api/chat', chatRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/dashboard', dashboardRouter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Asset Mart Backend is running' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
