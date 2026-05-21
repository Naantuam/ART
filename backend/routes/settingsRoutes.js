import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_FILE = path.join(__dirname, '../settings.json');

// Default setting
let timerActive = true;

// Helper: load settings
const loadSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed.timerActive === 'boolean') {
        timerActive = parsed.timerActive;
      }
    }
  } catch (err) {
    console.error('Failed to load settings file:', err.message);
  }
};

// Initial load
loadSettings();

// Get settings
router.get('/', (req, res) => {
  res.json({ timerActive });
});

// Update settings
router.post('/', (req, res) => {
  const { timerActive: newStatus } = req.body;
  if (typeof newStatus !== 'boolean') {
    return res.status(400).json({ message: 'Invalid timerActive state' });
  }

  timerActive = newStatus;

  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ timerActive }), 'utf8');
  } catch (err) {
    console.error('Failed to save settings file:', err.message);
  }

  res.json({ success: true, timerActive });
});

export default router;
