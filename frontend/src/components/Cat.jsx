import './Cat.css';

const STATE_EYE_MAP = {
  excited_bouncing: 'eye-star',
  alert_ears_up: 'eye-wide',
  focused_working: 'eye-narrow',
  sleepy_yawning: 'eye-half',
  curious_tilting: 'eye-normal',
  overwhelmed_dizzy: 'eye-spiral',
  content_grooming: 'eye-happy',
  shocked_puffed: 'eye-shocked',
};

function Cat({ state = 'content_grooming' }) {
  const eyeClass = STATE_EYE_MAP[state] || 'eye-normal';

  return (
    <div className={`cat-container cat-state-${state}`}>
      <svg viewBox="0 0 200 200" className="cat-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="cat-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#00000015" />
          </filter>
        </defs>

        <g filter="url(#cat-shadow)">
          {/* 身体 — 椭圆 */}
          <ellipse
            cx="100" cy="125" rx="50" ry="38"
            fill="#FFFDF5" stroke="#2D2D2D" strokeWidth="3"
            className="cat-body"
          />

          {/* 尾巴 — 弯曲路径 */}
          <path
            d="M145 120 Q165 110 168 90 Q170 75 160 70"
            fill="none" stroke="#2D2D2D" strokeWidth="5"
            strokeLinecap="round"
            className="cat-tail"
          />

          {/* 左边耳朵 */}
          <polygon
            points="72,55 65,20 90,48"
            fill="#FFFDF5" stroke="#2D2D2D" strokeWidth="3"
            strokeLinejoin="round"
            className="cat-ear"
          />
          {/* 左耳内部 */}
          <polygon
            points="74,52 69,27 86,48"
            fill="var(--accent-soft)" stroke="none"
            className="cat-ear-inner"
          />

          {/* 右边耳朵 */}
          <polygon
            points="128,55 135,20 110,48"
            fill="#FFFDF5" stroke="#2D2D2D" strokeWidth="3"
            strokeLinejoin="round"
            className="cat-ear"
          />
          {/* 右耳内部 */}
          <polygon
            points="126,52 131,27 114,48"
            fill="var(--accent-soft)" stroke="none"
            className="cat-ear-inner"
          />

          {/* 头部 — 圆形 */}
          <circle
            cx="100" cy="72" r="32"
            fill="#FFFDF5" stroke="#2D2D2D" strokeWidth="3"
            className="cat-head"
          />

          {/* 眼睛 — 根据状态变化 */}
          <g className={`cat-eyes ${eyeClass}`}>
            {/* 左眼 */}
            <ellipse cx="88" cy="70" rx="7" ry="8" fill="#2D2D2D" />
            <ellipse cx="90" cy="68" rx="2.5" ry="3" fill="#FFFFFF" />

            {/* 右眼 */}
            <ellipse cx="112" cy="70" rx="7" ry="8" fill="#2D2D2D" />
            <ellipse cx="114" cy="68" rx="2.5" ry="3" fill="#FFFFFF" />
          </g>

          {/* 鼻子 */}
          <polygon
            points="100,79 96,83 104,83"
            fill="#FF6B6B" stroke="none"
          />

          {/* 嘴巴 */}
          <path
            d="M96 83 Q100 88 100 83 Q100 88 104 83"
            fill="none" stroke="#2D2D2D" strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* 胡须 — 左边 */}
          <line x1="72" y1="78" x2="50" y2="74" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="72" y1="82" x2="50" y2="83" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />

          {/* 胡须 — 右边 */}
          <line x1="128" y1="78" x2="150" y2="74" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="128" y1="82" x2="150" y2="83" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />

          {/* 前爪 */}
          <ellipse cx="82" cy="145" rx="14" ry="10" fill="#FFFDF5" stroke="#2D2D2D" strokeWidth="3" />
          <ellipse cx="118" cy="145" rx="14" ry="10" fill="#FFFDF5" stroke="#2D2D2D" strokeWidth="3" />

          {/* 爪爪线 */}
          <line x1="76" y1="143" x2="76" y2="148" stroke="#2D2D2D" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="82" y1="142" x2="82" y2="148" stroke="#2D2D2D" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="88" y1="143" x2="88" y2="148" stroke="#2D2D2D" strokeWidth="1.2" strokeLinecap="round" />

          <line x1="112" y1="143" x2="112" y2="148" stroke="#2D2D2D" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="118" y1="142" x2="118" y2="148" stroke="#2D2D2D" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="124" y1="143" x2="124" y2="148" stroke="#2D2D2D" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

export default Cat;
