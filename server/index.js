const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { parseRoadmap } = require('./parser');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'progress.json');

app.use(cors());
app.use(express.json());

function loadProgress() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error loading progress:', e.message);
  }
  return {};
}

function saveProgress(data) {
  try {
    // Keep only the last 5 backups
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
    const backupFile = path.join(backupDir, `progress_${Date.now()}.json`);
    if (fs.existsSync(DATA_FILE)) {
      fs.copyFileSync(DATA_FILE, backupFile);
      const backups = fs.readdirSync(backupDir).sort().reverse();
      if (backups.length > 5) {
        backups.slice(5).forEach(b => fs.unlinkSync(path.join(backupDir, b)));
      }
    }
  } catch (e) {
    // ignore backup failures
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function applyProgress(phases, progress) {
  return phases.map((phase, pi) => {
    const pData = progress[phase.id] || {};
    return {
      ...phase,
      completed: pData.completed || false,
      status: pData.status || '',
      topics: phase.topics.map((topic, ti) => {
        const tData = (pData.topics || [])[ti] || {};
        return { ...topic, completed: tData.completed || false, status: tData.status || '' };
      })
    };
  });
}

function extractProgress(phases) {
  const progress = {};
  for (const phase of phases) {
    progress[phase.id] = {
      completed: phase.completed,
      status: phase.status,
      topics: phase.topics.map(t => ({ completed: t.completed, status: t.status }))
    };
  }
  return progress;
}

app.get('/api/roadmap', (req, res) => {
  try {
    const { phases, mostImportantSection, bestStrategySection } = parseRoadmap();
    const progress = loadProgress();
    const phasesWithProgress = applyProgress(phases, progress);
    res.json({ phases: phasesWithProgress, mostImportantSection, bestStrategySection });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/roadmap/progress', (req, res) => {
  try {
    const { phases, mostImportantSection, bestStrategySection } = parseRoadmap();
    const incoming = req.body.phases || [];
    const progress = loadProgress();

    for (const incPhase of incoming) {
      const existingPhase = phases.find(p => p.id === incPhase.id);
      if (!existingPhase) continue;
      progress[incPhase.id] = {
        completed: incPhase.completed || false,
        status: incPhase.status || '',
        topics: incPhase.topics ? incPhase.topics.map(t => ({
          completed: t.completed || false,
          status: t.status || ''
        })) : existingPhase.topics.map(() => ({ completed: false, status: '' }))
      };
    }

    saveProgress(progress);
    const phasesWithProgress = applyProgress(phases, progress);
    res.json({ phases: phasesWithProgress, mostImportantSection, bestStrategySection });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
