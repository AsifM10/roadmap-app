import React, { useState } from 'react';

function PhaseCard({ phase, onTopicToggle, onTopicStatus, onPhaseToggle, onPhaseStatus }) {
  const [expanded, setExpanded] = useState(true);
  const topicCount = phase.topics.length;
  const doneCount = phase.topics.filter(t => t.completed).length;

  return (
    <div className={`phase-card ${phase.completed ? 'phase-complete' : ''}`}>
      <div className="phase-header" onClick={() => setExpanded(!expanded)}>
        <div className="phase-title-row">
          <span className="phase-toggle">{expanded ? '▼' : '▶'}</span>
          <h2 className="phase-title">Phase {phase.id}: {phase.title}</h2>
          <span className="phase-progress">{doneCount}/{topicCount}</span>
          <label className="phase-check" onClick={e => e.stopPropagation()}>
            <input type="checkbox" checked={phase.completed} onChange={onPhaseToggle} />
            <span className="check-label">Phase Complete</span>
          </label>
        </div>
        <div className="phase-status-row">
          <input
            className="status-input"
            placeholder="Overall phase status / notes..."
            value={phase.status}
            onChange={e => onPhaseStatus(e.target.value)}
            onClick={e => e.stopPropagation()}
          />
        </div>
      </div>

      {expanded && (
        <div className="phase-body">
          <table className="topics-table">
            <thead>
              <tr>
                <th className="col-status">Done</th>
                <th className="col-topic">Topic</th>
                <th className="col-notes">Status / Notes</th>
              </tr>
            </thead>
            <tbody>
              {phase.topics.map((topic, idx) => (
                <tr key={topic.id || idx} className={topic.completed ? 'topic-complete' : ''}>
                  <td className="col-status">
                    <input
                      type="checkbox"
                      checked={topic.completed}
                      onChange={() => onTopicToggle(idx)}
                    />
                  </td>
                  <td className="col-topic">
                    <span className={`topic-text ${topic.completed ? 'done' : ''}`}>
                      {topic.text}
                    </span>
                  </td>
                  <td className="col-notes">
                    <input
                      className="status-input topic-status"
                      placeholder="Add notes..."
                      value={topic.status}
                      onChange={e => onTopicStatus(idx, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PhaseCard;
