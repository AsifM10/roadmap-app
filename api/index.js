const express = require('express');
const { parseRoadmap } = require('../server/parser');

const app = express();
app.use(express.json());

app.get('/api/roadmap', (req, res) => {
  try {
    const data = parseRoadmap();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/roadmap/progress', (req, res) => {
  res.json({ ok: true });
});

module.exports = app;
