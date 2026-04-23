import path from 'path';
import fs from 'fs';

/** Absolute path to backend/uploads — must match multer destination and express.static */
export const UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads');

export function ensureUploadsDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}
