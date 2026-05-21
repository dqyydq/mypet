import { useState } from 'react';
import { useTrendHistory } from '../hooks/useTrendHistory';
import './TrendPanel.css';

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

const CATEGORY_COLORS = {
  'AI/ML': '#F97316',
  'Security': '#EF4444',
  'DevTools': '#10B981',
  'Systems': '#3B82F6',
  'Other': '#A8A29E',
};

const STATE_LABELS = {
  excited_bouncing: '兴奋',
  alert_ears_up: '警觉',
  focused_working: '专注',
  sleepy_yawning: '困倦',
  curious_tilting: '好奇',
  overwhelmed_dizzy: '头晕',
  content_grooming: '满足',
  shocked_puffed: '炸毛',
};

const RANGES = [7, 14, 30];

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatStars(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

/* ===== 迷你猫头 ===== */
function MiniCatHead({ state }) {
  const color = ACCENT_COLORS[state] || '#A8A29E';
  return (
    <svg viewBox="0 0 32 28" className="mini-cat-svg">
      <polygon points="10,6 6,0 16,4" fill={color} />
      <polygon points="22,6 26,0 16,4" fill={color} />
      <circle cx="16" cy="13" r="9" fill={color} />
      <circle cx="13" cy="12" r="1.2" fill="#FFF" />
      <circle cx="19" cy="12" r="1.2" fill="#FFF" />
    </svg>
  );
}

/* ===== 分类堆叠柱状图 ===== */
function CategoryChart({ records }) {
  if (!records.length) return null;

  const barW = 16;
  const gap = 6;
  const chartW = Math.max(records.length * (barW + gap) + 40, 240);
  const chartH = 150;
  const topPad = 42;

  const categories = ['AI/ML', 'Security', 'DevTools', 'Systems', 'Other'];

  return (
    <div className="chart-wrapper">
      <h4 className="chart-title">分类分布</h4>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="chart-svg">
        {/* 图例（紧凑双行） */}
        <g transform="translate(20, 12)">
          {categories.map((cat, i) => (
            <g key={cat} transform={`translate(${i * 58}, 0)`}>
              <rect width={8} height={8} rx={2} fill={CATEGORY_COLORS[cat]} />
              <text x={12} y={8} className="chart-legend-text">{cat}</text>
            </g>
          ))}
        </g>

        {/* 柱子 */}
        {records.map((day, i) => {
          const total = Object.values(day.categories || {}).reduce((s, c) => s + c, 0) || 1;
          const barBottom = chartH - 16;
          const barTop = topPad + 4;
          const areaH = barBottom - barTop;
          let y = barBottom;
          const x = 20 + i * (barW + gap);

          return (
            <g key={day.date}>
              {categories.map((cat) => {
                const count = day.categories?.[cat] || 0;
                const h = Math.max(0, (count / total) * areaH);
                y -= h;
                return <rect key={cat} x={x} y={y} width={barW} height={h} fill={CATEGORY_COLORS[cat]} rx={2} />;
              })}
              <text x={x + barW / 2} y={chartH - 4} className="chart-label">{formatDate(day.date)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ===== 星数趋势折线 ===== */
function StarTrend({ records }) {
  if (!records.length) return null;

  const padX = 30;
  const padBottom = 24;
  const padTop = 16;
  const chartW = 560;
  const chartH = 140;
  const plotW = chartW - padX - 20;
  const plotH = chartH - padTop - padBottom;

  const stars = records.map((r) => r.total_stars_today || 0);
  const maxStars = Math.max(...stars, 1);
  const minStars = Math.min(...stars, 0);
  const range = maxStars - minStars || 1;

  const points = records
    .map((r, i) => {
      const x = padX + (i / Math.max(records.length - 1, 1)) * plotW;
      const y = padTop + plotH - ((r.total_stars_today || 0) - minStars) / range * plotH;
      return `${x},${y}`;
    })
    .join(' ');

  const areaD = records.length > 1
    ? `M${points} L${padX + plotW},${padTop + plotH} L${padX},${padTop + plotH} Z`
    : '';

  return (
    <div className="chart-wrapper">
      <h4 className="chart-title">热度趋势</h4>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="chart-svg">
        {/* 面积填充 */}
        {areaD && <path d={areaD} fill="var(--accent-soft)" />}
        {/* 折线 */}
        <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* 数据点 */}
        {records.map((r, i) => {
          const x = padX + (i / Math.max(records.length - 1, 1)) * plotW;
          const y = padTop + plotH - ((r.total_stars_today || 0) - minStars) / range * plotH;
          return <circle key={r.date} cx={x} cy={y} r="3" fill="var(--accent)" />;
        })}
        {/* X 轴标签 */}
        {records.map((r, i) => {
          const x = padX + (i / Math.max(records.length - 1, 1)) * plotW;
          return <text key={r.date} x={x} y={chartH - 6} className="chart-label">{formatDate(r.date)}</text>;
        })}
        {/* Y 轴标线 */}
        <line x1={padX} y1={padTop} x2={padX} y2={padTop + plotH} stroke="#E7E5E4" strokeWidth="1" />
        <text x={padX - 4} y={padTop + 4} className="chart-label" textAnchor="end">{formatStars(maxStars)}</text>
        <text x={padX - 4} y={padTop + plotH + 4} className="chart-label" textAnchor="end">{formatStars(minStars)}</text>
      </svg>
    </div>
  );
}

/* ===== 日详情展开卡片 ===== */
function DayDetail({ day, onClose }) {
  if (!day) return null;
  const color = ACCENT_COLORS[day.cat_state] || '#A8A29E';

  return (
    <div className="day-detail card">
      <div className="day-detail-header">
        <div className="day-detail-mood">
          <MiniCatHead state={day.cat_state} />
          <div>
            <span className="day-detail-date">{day.date}</span>
            <span className="day-detail-state" style={{ color }}>
              {STATE_LABELS[day.cat_state] || day.cat_state}
            </span>
          </div>
        </div>
        <button className="day-detail-close" onClick={onClose}>×</button>
      </div>
      <p className="day-detail-narrative">{day.narrative}</p>
      {day.categories && (
        <div className="day-detail-cats">
          {Object.entries(day.categories).map(([cat, count]) => (
            <span key={cat} className="day-cat-chip" style={{ background: CATEGORY_COLORS[cat] + '18', color: CATEGORY_COLORS[cat] }}>
              {cat} · {count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== 主组件 ===== */
export default function TrendPanel() {
  const [days, setDays] = useState(7);
  const [selectedDay, setSelectedDay] = useState(null);
  const { records, loading } = useTrendHistory(days);

  if (loading) {
    return (
      <div className="trend-panel">
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>正在加载历史数据...</p>
        </div>
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="trend-panel">
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>数据还不够多，明天再来看看吧 🐾</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trend-panel">
      <div className="trend-header">
        <h3 className="trend-title">历史趋势</h3>
        <div className="trend-range-row">
          {RANGES.map((n) => (
            <button
              key={n}
              className={`range-btn${days === n ? ' active' : ''}`}
              onClick={() => { setDays(n); setSelectedDay(null); }}
            >
              {n}天
            </button>
          ))}
        </div>
      </div>

      {/* 猫心情时间轴 */}
      <div className="card">
        <div className="mood-timeline">
          {records.map((day) => (
            <button
              key={day.date}
              className={`mood-day${selectedDay?.date === day.date ? ' selected' : ''}`}
              onClick={() => setSelectedDay(selectedDay?.date === day.date ? null : day)}
            >
              <MiniCatHead state={day.cat_state} />
              <span className="mood-date">{formatDate(day.date)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 日详情展开 */}
      {selectedDay && (
        <DayDetail day={selectedDay} onClose={() => setSelectedDay(null)} />
      )}

      {/* 分类堆叠柱状图 */}
      <div className="card trend-chart-card">
        <CategoryChart records={records} />
      </div>

      {/* 星数趋势折线 */}
      {records.some((r) => r.total_stars_today > 0) && (
        <div className="card trend-chart-card">
          <StarTrend records={records} />
        </div>
      )}
    </div>
  );
}
