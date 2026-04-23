import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../database.sqlite');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Initialize Tables
    db.serialize(() => {
      // Users Table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT,
        status TEXT,
        lastActive TEXT,
        recoveryCodes TEXT DEFAULT '[]',
        passwordResetRequired INTEGER DEFAULT 0
      )`);

      // Migration: Add password column if it doesn't exist
      db.all("PRAGMA table_info(users)", (err, columns: any[]) => {
        if (!err && columns) {
          const hasPassword = columns.some(c => c.name === 'password');
          if (!hasPassword) {
            console.log("Migrating database: Adding password column to users table...");
            db.run("ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT 'password123'");
          }

          const hasRecoveryCodes = columns.some(c => c.name === 'recoveryCodes');
          if (!hasRecoveryCodes) {
            console.log("Migrating database: Adding recoveryCodes column to users table...");
            db.run("ALTER TABLE users ADD COLUMN recoveryCodes TEXT DEFAULT '[]'");
          }

          const hasPasswordResetRequired = columns.some(c => c.name === 'passwordResetRequired');
          if (!hasPasswordResetRequired) {
            console.log("Migrating database: Adding passwordResetRequired column to users table...");
            db.run("ALTER TABLE users ADD COLUMN passwordResetRequired INTEGER DEFAULT 0");
          }
        }
      });

      // Assets Table
      db.run(`CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT,
        serialNumber TEXT,
        assignedTo TEXT,
        department TEXT,
        status TEXT,
        purchaseDate TEXT,
        warrantyExpiry TEXT,
        location TEXT,
        health TEXT,
        specifications TEXT,
        attachments TEXT DEFAULT '[]'
      )`);

      db.all('PRAGMA table_info(assets)', (migrateErr, columns: any[]) => {
        if (!migrateErr && columns) {
          const hasAttachments = columns.some((c) => c.name === 'attachments');
          if (!hasAttachments) {
            console.log('Migrating database: Adding attachments column to assets table...');
            db.run("ALTER TABLE assets ADD COLUMN attachments TEXT DEFAULT '[]'");
          }
        }
      });

      // Issues Table
      db.run(`CREATE TABLE IF NOT EXISTS issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assetId TEXT,
        issueType TEXT,
        priority TEXT,
        description TEXT,
        status TEXT DEFAULT 'Pending',
        reportedBy TEXT,
        attachments TEXT DEFAULT '[]',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Migration: Add reportedBy column to issues if it doesn't exist
      db.all("PRAGMA table_info(issues)", (err, columns: any[]) => {
        if (!err && columns) {
          const hasReportedBy = columns.some(c => c.name === 'reportedBy');
          if (!hasReportedBy) {
            console.log("Migrating database: Adding reportedBy column to issues table...");
            db.run("ALTER TABLE issues ADD COLUMN reportedBy TEXT");
          }

          const hasAttachments = columns.some(c => c.name === 'attachments');
          if (!hasAttachments) {
            console.log("Migrating database: Adding attachments column to issues table...");
            db.run("ALTER TABLE issues ADD COLUMN attachments TEXT DEFAULT '[]'");
          }
        }
      });

      // Force Demo Accounts to exist (compensate for old seeded databases)
      db.run("INSERT OR IGNORE INTO users (name, email, password, role, department, status, lastActive) VALUES ('Admin User', 'admin@assetmart.com', 'admin123', 'admin', 'IT', 'Active', 'Just now')");
      db.run("INSERT OR IGNORE INTO users (name, email, password, role, department, status, lastActive) VALUES ('Regular User', 'user@assetmart.com', 'user123', 'user', 'Operations', 'Active', 'Just now')");

      // Maintenance Tasks Table
      db.run(`CREATE TABLE IF NOT EXISTS maintenance_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assetId TEXT,
        type TEXT,
        description TEXT,
        scheduledDate TEXT,
        priority TEXT DEFAULT 'Medium',
        status TEXT DEFAULT 'Scheduled',
        assignedTo TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Seed Initial Data
      seedData();
    });
  }
});

function seedData() {
  db.get("SELECT count(*) as count FROM users", (err, row: any) => {
    if (err) return console.error(err);
    if (row.count === 0) {
      const users = [
        ['Admin User', 'admin@assetmart.com', 'admin123', 'admin', 'IT', 'Active', 'Just now'],
        ['Regular User', 'user@assetmart.com', 'user123', 'user', 'Operations', 'Active', 'Just now'],
        ['John Doe', 'john.doe@assetmart.com', 'password123', 'admin', 'IT', 'Active', '2 mins ago'],
        ['Sarah Johnson', 'sarah.j@assetmart.com', 'password123', 'Manager', 'Finance', 'Active', '1 hour ago'],
        ['Mark Wilson', 'mark.w@assetmart.com', 'password123', 'user', 'Sales', 'Active', '3 hours ago'],
        ['Emily Brown', 'emily.b@assetmart.com', 'password123', 'user', 'HR', 'Inactive', '2 days ago'],
      ];
      const stmt = db.prepare('INSERT INTO users (name, email, password, role, department, status, lastActive) VALUES (?, ?, ?, ?, ?, ?, ?)');
      users.forEach(u => stmt.run(u));
      stmt.finalize();
      console.log('Seeded Users Data.');
    }
  });

  db.get("SELECT count(*) as count FROM assets", (err, row: any) => {
    if (err) return console.error(err);
    if (row.count === 0) {
      const assets = [
        ['AST-001', 'MacBook Pro 16"', 'Laptop', 'MBP2023XY789', 'John Smith', 'IT', 'Active', '2023-01-15', '2026-01-15', 'Floor 3, Desk 42', 'Good', 'M2 Max, 32GB RAM, 1TB SSD'],
        ['AST-002', 'HP LaserJet Pro', 'Printer', 'HPP2022ABC456', 'Shared Resource', 'HR', 'Active', '2022-08-20', '2024-08-20', 'Floor 2, Print Room', 'Fair', 'Duplex, Network, Color'],
        ['AST-003', 'Dell Server R740', 'Server', 'DSR2021DEF123', 'Infrastructure Team', 'IT', 'Maintenance', '2021-03-10', '2024-03-10', 'Data Center', 'Needs Attention', 'Xeon Gold, 256GB RAM, 8TB Storage'],
        ['AST-004', 'Dell Optiplex 7080', 'Desktop', 'DOP2023GHI789', 'Sarah Johnson', 'Finance', 'Active', '2023-06-01', '2026-06-01', 'Floor 4, Desk 15', 'Excellent', 'i7-10700, 16GB RAM, 512GB SSD'],
        ['AST-005', 'iPad Pro 12.9"', 'Tablet', 'IPP2023JKL012', 'Mark Wilson', 'Sales', 'Active', '2023-09-12', '2024-09-12', 'Floor 1, Desk 8', 'Good', 'M2, 256GB, WiFi + Cellular'],
        ['AST-006', 'Lenovo ThinkPad X1', 'Laptop', 'LTP2023MNO345', 'Emily Davis', 'IT', 'Active', '2023-04-20', '2026-04-20', 'Floor 3, Desk 28', 'Excellent', 'i7-1165G7, 16GB RAM, 512GB SSD'],
        ['AST-007', 'Cisco Router 4000', 'Network Device', 'CRO2022PQR678', 'Network Team', 'IT', 'Active', '2022-11-05', '2025-11-05', 'Server Room A', 'Good', '1Gbps, 4 LAN Ports, VPN Ready'],
        ['AST-008', 'Samsung Monitor 32"', 'Monitor', 'SMO2023STU901', 'Design Team', 'Marketing', 'Active', '2023-07-15', '2026-07-15', 'Floor 2, Design Studio', 'Excellent', '4K UHD, 60Hz, HDR Support'],
      ];
      const stmt = db.prepare('INSERT INTO assets (id, name, type, serialNumber, assignedTo, department, status, purchaseDate, warrantyExpiry, location, health, specifications) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      assets.forEach(a => stmt.run(a));
      stmt.finalize();
      console.log('Seeded Assets Data.');
    }
  });

  db.get("SELECT count(*) as count FROM issues", (err, row: any) => {
    if (err) return console.error(err);
    if (row.count === 0) {
      const issues = [
        ['Laptop-HR-045', 'Hardware', 'High', 'Screen flickering', 'In Progress', '1'],
        ['Printer-IT-012', 'Hardware', 'Medium', 'Paper jam error', 'Pending', '1'],
        ['Server-DC-001', 'Performance', 'Critical', 'High CPU usage', 'Resolved', '2'],
        ['Desktop-FIN-023', 'Software', 'Low', 'Software update required', 'Pending', '2'],
      ];
      const stmt = db.prepare('INSERT INTO issues (assetId, issueType, priority, description, status, reportedBy) VALUES (?, ?, ?, ?, ?, ?)');
      issues.forEach(i => stmt.run(i));
      stmt.finalize();
      console.log('Seeded Issues Data.');
    }
  });

  db.get("SELECT count(*) as count FROM maintenance_tasks", (err, row: any) => {
    if (err) return console.error(err);
    if (row.count === 0) {
      const tasks = [
        ['AST-003', 'Preventive', 'Quarterly system health check', '2026-04-28', 'High', 'Scheduled', 'IT Team'],
        ['AST-002', 'Corrective', 'Paper jam fix and roller replacement', '2026-04-26', 'Critical', 'In Progress', 'John Smith'],
        ['AST-001', 'Routine', 'Battery health inspection', '2026-04-30', 'Medium', 'Scheduled', 'Sarah Johnson'],
        ['AST-004', 'Upgrade', 'RAM upgrade to 32GB', '2026-04-25', 'Low', 'Completed', 'Mark Wilson'],
      ];
      const stmt = db.prepare('INSERT INTO maintenance_tasks (assetId, type, description, scheduledDate, priority, status, assignedTo) VALUES (?, ?, ?, ?, ?, ?, ?)');
      tasks.forEach(t => stmt.run(t));
      stmt.finalize();
      console.log('Seeded Maintenance Tasks Data.');
    }
  });
}
