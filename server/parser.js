const fs = require('fs');
const path = require('path');

function parseRoadmap() {
  const candidates = [
    path.join(__dirname, '..', 'AI_Engineer_Preparation_Roadmap_2026.txt'),
    path.join(__dirname, '..', '..', 'AI_Engineer_Preparation_Roadmap_2026.txt'),
    path.join(process.cwd(), 'AI_Engineer_Preparation_Roadmap_2026.txt'),
  ];
  let txtPath = candidates.find(p => fs.existsSync(p));
  if (!txtPath) throw new Error('AI_Engineer_Preparation_Roadmap_2026.txt not found');
  const content = fs.readFileSync(txtPath, 'utf-8');
  const lines = content.split('\n');

  const phases = [];
  let currentPhase = null;
  let sectionBuffer = [];

  const sectionLabels = /^(topics:|add:|goals:|important:|build:|recommended:|learn:|choose|nlp topics:|cv topics:)/i;

  for (let line of lines) {
    const trimmed = line.trim();

    if (trimmed.includes('MOST IMPORTANT SKILLS')) break;

    const phaseMatch = trimmed.match(/^Phase\s+(\d+)\s*[—–-]?\s*(.+)/i);

    if (phaseMatch) {
      if (currentPhase) {
        currentPhase.topics = parseSectionItems(sectionBuffer);
        phases.push(currentPhase);
        sectionBuffer = [];
      }
      currentPhase = {
        id: parseInt(phaseMatch[1]),
        title: phaseMatch[2].trim(),
        topics: [],
        completed: false,
        status: ''
      };
      continue;
    }

    if (!currentPhase) continue;

    if (trimmed.startsWith('---') || trimmed === '') continue;

    if (sectionLabels.test(trimmed)) continue;

    if (/^or$/i.test(trimmed)) continue;

    sectionBuffer.push(trimmed);
  }

  if (currentPhase) {
    currentPhase.topics = parseSectionItems(sectionBuffer);
    phases.push(currentPhase);
  }

  const mostImportantSection = extractMostImportantSkills(lines);
  const bestStrategySection = extractBestStrategy(lines);

  return { phases, mostImportantSection, bestStrategySection };
}

function parseSectionItems(lines) {
  const items = [];

  for (const line of lines) {
    if (!line) continue;

    const text = line.replace(/^[-•*]\s*/, '').trim();
    if (!text) continue;

    items.push({
      id: `topic-${items.length + 1}`,
      text: text,
      completed: false,
      status: ''
    });
  }

  return items;
}

function extractMostImportantSkills(lines) {
  const startIdx = lines.findIndex(l => l.trim().includes('MOST IMPORTANT SKILLS'));
  if (startIdx === -1) return [];
  const sections = [];
  let currentTier = null;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l || l.startsWith('---')) continue;
    if (l.startsWith('BEST LEARNING STRATEGY')) break;
    const tierMatch = l.match(/^Tier\s+(\d+)\s*\((.+)\)/i);
    if (tierMatch) {
      currentTier = { tier: parseInt(tierMatch[1]), label: tierMatch[2], items: [] };
      sections.push(currentTier);
    } else if (currentTier && l.startsWith('-')) {
      currentTier.items.push(l.replace(/^-\s*/, ''));
    }
  }
  return sections;
}

function extractBestStrategy(lines) {
  const startIdx = lines.findIndex(l => l.trim().includes('BEST LEARNING STRATEGY'));
  if (startIdx === -1) return [];
  const items = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l || l.startsWith('---')) continue;
    items.push(l);
  }
  return items;
}

module.exports = { parseRoadmap };
