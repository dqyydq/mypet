import './StatusPanel.css';

const CATEGORY_LABELS = {
  'AI/ML': 'AI/ML',
  'Security': '安全',
  'DevTools': '开发工具',
  'Systems': '基础设施',
  'Other': '其他',
};

const CATEGORY_ICONS = {
  'AI/ML': '🤖',
  'Security': '🔒',
  'DevTools': '🛠️',
  'Systems': '⚙️',
  'Other': '📦',
};

const STATE_LABELS = {
  excited_bouncing: '兴奋蹦跳中',
  alert_ears_up: '警觉竖耳',
  focused_working: '专注工作中',
  sleepy_yawning: '困倦打哈欠',
  curious_tilting: '好奇歪头',
  overwhelmed_dizzy: '头晕眼花',
  content_grooming: '满足舔爪',
  shocked_puffed: '震惊炸毛',
};

function StatusPanel({ data, loading, error }) {
  if (loading) {
    return (
      <div className="status-panel loading">
        <div className="panel-card">
          <p className="loading-text">🐾 正在窥探 GitHub...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-panel error">
        <div className="panel-card">
          <p>😿 网络出了点问题，猫猫正在重试...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.cat_state) {
    return null;
  }

  const totalRepos = Object.values(data.categories || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="status-panel">
      <div className="panel-card main-card">
        <div className="state-badge">
          {STATE_LABELS[data.cat_state] || data.cat_state}
        </div>
        <p className="narrative">{data.narrative}</p>
      </div>

      <div className="categories-grid">
        {Object.entries(data.categories || {}).map(([cat, count]) => (
          <div key={cat} className="category-card">
            <span className="cat-icon">{CATEGORY_ICONS[cat] || '📌'}</span>
            <span className="cat-label">{CATEGORY_LABELS[cat] || cat}</span>
            <span className="cat-count">{count}</span>
          </div>
        ))}
      </div>

      {data.repos && data.repos.length > 0 && (
        <div className="repos-list">
          <h3 className="repos-title">🔥 今日热门项目</h3>
          {data.repos.slice(0, 8).map((repo) => (
            <a
              key={repo.name}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="repo-item"
            >
              <span className="repo-lang">{repo.language}</span>
              <span className="repo-name">{repo.name}</span>
              <span className="repo-stars">⭐ {repo.stars_today}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default StatusPanel;
