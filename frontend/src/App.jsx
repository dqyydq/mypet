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

const INTENSITY_FLOOR = 0.3;
const INTENSITY_CEILING = 1.5;
const INTENSITY_DEFAULT = 0.7;
const AI_THRESHOLD = 0.4;
const SECURITY_THRESHOLD = 0.2;
const DEVTOOLS_THRESHOLD = 0.3;
const STAR_OVERWHELMED = 50000;
const STAR_SHOCK = 10000;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function calculateIntensity(catState, categories, repos) {
  if (!categories) return 1.0;
  const total = Object.values(categories).reduce((s, c) => s + c, 0);
  if (total === 0) return 1.0;

  switch (catState) {
    case 'excited_bouncing': {
      const aiPct = (categories['AI/ML'] || 0) / total;
      return clamp(aiPct / AI_THRESHOLD, INTENSITY_FLOOR, INTENSITY_CEILING);
    }
    case 'alert_ears_up': {
      const secPct = (categories['Security'] || 0) / total;
      return clamp(secPct / SECURITY_THRESHOLD, INTENSITY_FLOOR, INTENSITY_CEILING);
    }
    case 'focused_working': {
      const devPct = (categories['DevTools'] || 0) / total;
      return clamp(devPct / DEVTOOLS_THRESHOLD, INTENSITY_FLOOR, INTENSITY_CEILING);
    }
    case 'overwhelmed_dizzy': {
      if (repos && repos.length > 0) {
        const totalStars = repos.reduce((s, r) => s + (r.stars_today || 0), 0);
        return clamp(totalStars / STAR_OVERWHELMED, INTENSITY_FLOOR, INTENSITY_CEILING);
      }
      return 0.8;
    }
    case 'shocked_puffed': {
      if (repos && repos.length > 0) {
        const maxStars = Math.max(...repos.map(r => r.stars_today || 0));
        return clamp(maxStars / STAR_SHOCK, INTENSITY_FLOOR, INTENSITY_CEILING);
      }
      return 1.0;
    }
    default:
      return INTENSITY_DEFAULT;
  }
}

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

  const intensity = calculateIntensity(
    catState,
    data?.categories,
    data?.repos,
  );

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
          <Cat state={catState} intensity={intensity} />
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
