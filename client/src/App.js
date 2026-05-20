import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './context/AuthContext';
import PhaseCard from './components/PhaseCard';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import './App.css';

const API = process.env.REACT_APP_API || '';

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

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/roadmap`)
      .then(r => r.json())
      .then(async d => {
        let progress = {};

        try {
          const local = localStorage.getItem('roadmap-progress');
          if (local) progress = JSON.parse(local);
        } catch {}

        if (user) {
          const { data: row } = await supabase
            .from('user_progress')
            .select('data')
            .eq('user_id', user.id)
            .maybeSingle();

          if (row?.data) {
            progress = row.data;
            localStorage.setItem('roadmap-progress', JSON.stringify(progress));
          }
        }

        d.phases = applyProgress(d.phases, progress);
        setData(d);
        setLoading(null);
      })
      .catch(e => { setError(e.message); setLoading(null); });
  }, [user]);

  const persist = useCallback(async (phases) => {
    const progress = extractProgress(phases);
    localStorage.setItem('roadmap-progress', JSON.stringify(progress));

    if (user) {
      await supabase.from('user_progress').upsert(
        { user_id: user.id, data: progress, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    }
  }, [user]);

  function withSave(updater) {
    setData(prev => {
      const newPhases = updater(prev.phases);
      persist(newPhases);
      return { ...prev, phases: newPhases };
    });
  }

  function handleTopicToggle(phaseId, topicIdx) {
    withSave(phases => phases.map(p => {
      if (p.id !== phaseId) return p;
      const newTopics = p.topics.map((t, i) =>
        i === topicIdx ? { ...t, completed: !t.completed } : t
      );
      return { ...p, topics: newTopics };
    }));
  }

  function handleTopicStatus(phaseId, topicIdx, status) {
    withSave(phases => phases.map(p => {
      if (p.id !== phaseId) return p;
      const newTopics = p.topics.map((t, i) =>
        i === topicIdx ? { ...t, status } : t
      );
      return { ...p, topics: newTopics };
    }));
  }

  function handlePhaseToggle(phaseId) {
    withSave(phases => phases.map(p => {
      if (p.id !== phaseId) return p;
      const newCompleted = !p.completed;
      return {
        ...p, completed: newCompleted,
        topics: p.topics.map(t => ({ ...t, completed: newCompleted }))
      };
    }));
  }

  function handlePhaseStatus(phaseId, status) {
    withSave(phases => phases.map(p =>
      p.id === phaseId ? { ...p, status } : p
    ));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  const completed = data?.phases?.filter(p =>
    p.topics.length > 0 && p.topics.every(t => t.completed)
  ).length || 0;
  const total = data?.phases?.length || 0;
  const allTopics = data?.phases?.flatMap(p => p.topics) || [];
  const topicsCompleted = allTopics.filter(t => t.completed).length;
  const topicsTotal = allTopics.length;

  if (loading) return <div className="app-container"><div className="loader">Loading roadmap...</div></div>;
  if (error) return <div className="app-container"><div className="error">Error: {error}</div></div>;

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-top">
          <h1>AI Engineer Roadmap 2026</h1>
          <div className="header-right">
            <span className="user-email">{user?.email}</span>
            <button className="signout-btn" onClick={handleSignOut}>Sign Out</button>
          </div>
        </div>
        <div className="stats">
          <span>Phases: {completed}/{total} complete</span>
          <span className="stat-divider">|</span>
          <span>Topics: {topicsCompleted}/{topicsTotal} done</span>
          <span className="stat-divider">|</span>
          <span>{total > 0 ? Math.round((completed / total) * 100) : 0}% overall</span>
        </div>
      </header>

      <div className="app-body">
        <div className="phases-grid">
          {data.phases.map(phase => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              onTopicToggle={(idx) => handleTopicToggle(phase.id, idx)}
              onTopicStatus={(idx, status) => handleTopicStatus(phase.id, idx, status)}
              onPhaseToggle={() => handlePhaseToggle(phase.id)}
              onPhaseStatus={(status) => handlePhaseStatus(phase.id, status)}
            />
          ))}
        </div>
        <Sidebar
          mostImportant={data.mostImportantSection}
          bestStrategy={data.bestStrategySection}
        />
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="app-container"><div className="loader">Loading...</div></div>;
  }

  if (!user) {
    return <AuthPage />;
  }

  return <Dashboard />;
}
