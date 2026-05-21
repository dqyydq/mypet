import { useState, useEffect, useCallback } from 'react';
import Cat from './components/Cat';
import StatusPanel from './components/StatusPanel';
import { useTrendingData } from './hooks/useTrendingData';

const ALL_STATES = [
  'excited_bouncing',
  'alert_ears_up',
  'focused_working',
  'sleepy_yawning',
  'curious_tilting',
  'overwhelmed_dizzy',
  'content_grooming',
  'shocked_puffed',
];

const ACCENT_COLORS = {
  excited_bouncing: '#FF6B6B',
  alert_ears_up: '#A78BFA',
  focused_working: '#34D399',
  sleepy_yawning: '#9CA3AF',
  curious_tilting: '#60A5FA',
  overwhelmed_dizzy: '#F59E0B',
  content_grooming: '#FBBF24',
  shocked_puffed: '#EF4444',
};

/** 仅开发调试用：URL 带 ?debug=1 时显示状态切换按钮 */
function DebugStateSwitcher({ current, onChange }) {
  const isDebug = window.location.search.includes('debug=1');
  if (!isDebug) return null;
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center',
      padding: 12, margin: '0 auto 16px', maxWidth: 600,
      background: '#FFF', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      {ALL_STATES.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          style={{
            padding: '4px 12px', borderRadius: 99, border: s === current ? '2px solid #2D2D2D' : '1px solid #E5E7EB',
            background: s === current ? ACCENT_COLORS[s] : '#FFF',
            color: s === current ? '#FFF' : '#6B7280',
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
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
    const color = ACCENT_COLORS[catState] || '#60A5FA';
    document.documentElement.style.setProperty('--accent', color);
  }, [catState]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">🐱 GitHub Trending</h1>
        <p className="app-subtitle">喵星人日报</p>
      </header>

      <DebugStateSwitcher
        current={catState}
        onChange={setDebugState}
      />

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
