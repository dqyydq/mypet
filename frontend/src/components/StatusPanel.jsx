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

function formatStars(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function StatusPanel({ data, loading, error }) {
  if (loading) {
    return (
      <div className="status-panel">
        <div className="card loading-card">
          <p className="loading-text">🐾 正在窥探 GitHub...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-panel">
        <div className="card loading-card">
          <p className="loading-text">😿 网络出了点问题，猫猫正在重试...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.cat_state) return null;

  return (
    <div className="status-panel">
      {/* 猫咪叙述卡片 */}
      <div className="card narrative-card">
        <span className="state-badge">
          {STATE_LABELS[data.cat_state] || data.cat_state}
        </span>
        <p className="narrative">{data.narrative}</p>
      </div>

      {/* 分类统计 */}
      <div className="section-label">今日分类</div>
      <div className="categories-row">
        {Object.entries(data.categories || {}).map(([cat, count]) => (
          <div key={cat} className="category-chip">
            <span className="chip-icon">{CATEGORY_ICONS[cat] || '📌'}</span>
            <span className="chip-label">{CATEGORY_LABELS[cat] || cat}</span>
            <span className="chip-count">{count}</span>
          </div>
        ))}
      </div>

      {/* 热门项目列表 */}
      {data.repos && data.repos.length > 0 && (
        <>
          <div className="section-label">
            今日热门项目 · {data.repos.length} 个
          </div>
          <div className="repo-cards">
            {data.repos.map((repo) => (
              <a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="repo-card"
              >
                <div className="repo-card-top">
                  <span className="repo-lang">{repo.language}</span>
                  <span className="repo-today-stars">
                    +{formatStars(repo.stars_today)} ⭐ today
                  </span>
                </div>
                <h4 className="repo-name">{repo.name}</h4>
                {repo.description && (
                  <p className="repo-desc">{repo.description}</p>
                )}
                <div className="repo-card-meta">
                  <span className="repo-total-stars">
                    ⭐ {formatStars(repo.total_stars)} total
                  </span>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default StatusPanel;
