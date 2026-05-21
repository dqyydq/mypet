import { useState, useEffect } from 'react';
import Cat from './components/Cat';
import StatusPanel from './components/StatusPanel';
import { useTrendingData } from './hooks/useTrendingData';

const ACCENT_COLORS = {
  excited_bouncing: '#F97316',
  alert_ears_up: '#8B5CF6',
  focused_working: '#10B981',
  sleepy_yawning: '#A8A29E',
  curious_tilting: '#3B82F6',
  overwhelmed_dizzy: '#F59E0B',
  content_grooming: '#D97706',
  shocked_puffed: '#EF4444',
};

const ALL_STATES = Object.keys(ACCENT_COLORS);

function DebugStateSwitcher({ current, onChange }) {
  const isDebug = window.location.search.includes('debug=1');
  if (!isDebug) return null;
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center',
      padding: 10, margin: '0 auto 20px', maxWidth: 600,
      background: '#FFF', borderRadius: 12, border: '1px solid #E7E5E4',
    }}>
      {ALL_STATES.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          style={{
            padding: '4px 10px', borderRadius: 99,
            border: s === current ? '2px solid #1C1917' : '1px solid #E7E5E4',
            background: s === current ? ACCENT_COLORS[s] : '#FFF',
            color: s === current ? '#FFF' : '#78716C',
            fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {s.replace(/_/g, ' ')}
        </button>
      ))}
    </div>
  );
}

function App() {
  const { data, loading, error } = useTrendingData();
  const [debugState, setDebugState] = useState(null);
  const isDebug = window.location.search.includes('debug=1');

  const catState = isDebug && debugState
    ? debugState
    : (data?.cat_state || 'content_grooming');

  useEffect(() => {
    const color = ACCENT_COLORS[catState] || '#D97706';
    document.documentElement.style.setProperty('--accent', color);
  }, [catState]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">GitHub Trending</h1>
        <p className="app-subtitle">一只猫的每日技术观察</p>
      </header>

      <DebugStateSwitcher current={catState} onChange={setDebugState} />

      <main className="app-main">
        <div className="cat-area">
          <Cat state={catState} />
        </div>
        <StatusPanel data={data} loading={loading} error={error} />
      </main>

      <footer className="app-footer">
        <p>数据来源 GitHub Trending · AI 分析 by DeepSeek</p>
      </footer>
    </div>
  );
}

export default App;
