import { useState, useMemo } from 'react';
import { STATE_LABELS } from '../constants';
import { formatStars } from '../utils/format';
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

const ERROR_MESSAGES = {
  network: '😿 猫窝信号不好，连不上服务器...待会再试试吧',
  server: '😿 服务器出故障了，本猫先打个盹...稍等片刻',
  timeout: '😿 猫今天思考太久...数据没及时回来，刷新试试',
  http: '😿 数据接口不太对劲，猫猫正在疑惑中',
  unknown: '😿 出了点意外状况，不过应该不是大问题',
};

function SkeletonCat() {
  return (
    <div className="skeleton-card card">
      <div className="skeleton-shimmer">
        <svg viewBox="0 0 200 200" className="skeleton-svg">
          <ellipse cx="100" cy="125" rx="50" ry="38" fill="#E5E7EB" />
          <circle cx="100" cy="72" r="32" fill="#E5E7EB" />
          <polygon points="72,55 65,20 90,48" fill="#E5E7EB" />
          <polygon points="128,55 135,20 110,48" fill="#E5E7EB" />
          <path d="M145 120 Q165 110 168 90 Q170 75 160 70" fill="none" stroke="#E5E7EB" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="82" cy="145" rx="14" ry="10" fill="#E5E7EB" />
          <ellipse cx="118" cy="145" rx="14" ry="10" fill="#E5E7EB" />
        </svg>
      </div>
      <p className="skeleton-label">正在窥探 GitHub...</p>
    </div>
  );
}

function ErrorCard({ error }) {
  const msg = ERROR_MESSAGES[error] || ERROR_MESSAGES.unknown;
  return (
    <div className="card error-card">
      <p className="error-text">{msg}</p>
    </div>
  );
}

function CategoryBars({ categories }) {
  const total = Object.values(categories).reduce((s, v) => s + v, 0);
  if (!total) return null;
  return (
    <div className="category-bars">
      {Object.entries(categories).map(([cat, count]) => {
        const pct = Math.round((count / total) * 100);
        return (
          <div key={cat} className="cat-bar-row">
            <div className="cat-bar-meta">
              <span className="cat-bar-icon">{CATEGORY_ICONS[cat] || '📌'}</span>
              <span className="cat-bar-label">{CATEGORY_LABELS[cat] || cat}</span>
              <span className="cat-bar-pct">{pct}%</span>
              <span className="cat-bar-count">{count}</span>
            </div>
            <div className="cat-bar-track">
              <div className="cat-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LanguageFilter({ repos, selected, onSelect }) {
  const languages = useMemo(() => {
    const counts = new Map();
    repos.forEach((r) => {
      if (r.language) counts.set(r.language, (counts.get(r.language) || 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1]);
  }, [repos]);

  if (languages.length <= 1) return null;

  return (
    <>
      <div className="section-label">按语言筛选</div>
      <div className="lang-filter-row">
        <button
          className={`lang-chip${selected === null ? ' active' : ''}`}
          onClick={() => onSelect(null)}
        >
          全部
        </button>
        {languages.map(([lang, count]) => (
          <button
            key={lang}
            className={`lang-chip${selected === lang ? ' active' : ''}`}
            onClick={() => onSelect(selected === lang ? null : lang)}
          >
            {lang}
            <span className="lang-chip-count">{count}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function StatusPanel({ data, loading, error }) {
  const [selectedLang, setSelectedLang] = useState(null);

  if (loading) {
    return (
      <div className="status-panel">
        <SkeletonCat />
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-panel">
        <ErrorCard error={error} />
      </div>
    );
  }

  if (!data || !data.cat_state) return null;

  const filteredRepos = selectedLang
    ? (data.repos || []).filter((r) => r.language === selectedLang)
    : (data.repos || []);

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
      <CategoryBars categories={data.categories || {}} />

      {/* 热门项目列表 */}
      {data.repos && data.repos.length > 0 && (
        <>
          <div className="section-label">
            今日热门项目 · {data.repos.length} 个
          </div>

          <LanguageFilter
            repos={data.repos}
            selected={selectedLang}
            onSelect={setSelectedLang}
          />

          <div className="repo-cards">
            {filteredRepos.map((repo) => (
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

          {filteredRepos.length === 0 && (
            <div className="card empty-filter">
              <p className="empty-filter-text">
                没有 {selectedLang} 项目
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default StatusPanel;
