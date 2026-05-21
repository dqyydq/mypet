import { useState, useEffect } from 'react';
import Cat from './components/Cat';
import StatusPanel from './components/StatusPanel';
import { useTrendingData } from './hooks/useTrendingData';

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

function App() {
  const { data, loading, error } = useTrendingData();
  const [accent, setAccent] = useState('#60A5FA');

  useEffect(() => {
    if (data?.cat_state) {
      const color = ACCENT_COLORS[data.cat_state] || '#60A5FA';
      setAccent(color);
      document.documentElement.style.setProperty('--accent', color);
    }
  }, [data?.cat_state]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">🐱 GitHub Trending</h1>
        <p className="app-subtitle">喵星人日报</p>
      </header>

      <main className="app-main">
        <div className="cat-area">
          <Cat state={data?.cat_state || 'content_grooming'} />
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
