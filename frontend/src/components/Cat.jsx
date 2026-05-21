import { useState, useEffect, useRef } from 'react';
import './Cat.css';

function Cat({ state = 'content_grooming' }) {
  const prevState = useRef(state);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (state !== prevState.current) {
      setTransitioning(true);
      const timer = setTimeout(() => {
        prevState.current = state;
        setTransitioning(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const displayState = transitioning ? prevState.current : state;
  const animClass = transitioning ? 'cat-prepare' : `cat-anim-${displayState}`;

  return (
    <div className={`cat-container ${animClass}`}>
      <svg viewBox="0 0 200 200" className="cat-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="cat-shadow" x="-30%" y="-20%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#00000015" />
          </filter>
        </defs>

        <g filter="url(#cat-shadow)">
          {/* ===== 尾巴 ===== */}
          <g className="cat-tail-group">
            <path
              d="M145 120 Q165 110 168 90 Q170 75 160 70"
              fill="none" stroke="#2D2D2D" strokeWidth="5"
              strokeLinecap="round"
              className="cat-tail"
            />
          </g>

          {/* ===== 身体 ===== */}
          <ellipse
            cx="100" cy="125" rx="50" ry="38"
            fill="#FFFDF5" stroke="#2D2D2D" strokeWidth="3"
            className="cat-body"
          />

          {/* ===== 耳朵组 ===== */}
          <g className="cat-ears-group">
            <polygon
              points="72,55 65,20 90,48"
              fill="#FFFDF5" stroke="#2D2D2D" strokeWidth="3"
              strokeLinejoin="round"
              className="cat-ear cat-ear-left"
            />
            <polygon
              points="74,52 69,27 86,48"
              fill="var(--accent-soft)" stroke="none"
              className="cat-ear-inner cat-ear-inner-left"
            />
            <polygon
              points="128,55 135,20 110,48"
              fill="#FFFDF5" stroke="#2D2D2D" strokeWidth="3"
              strokeLinejoin="round"
              className="cat-ear cat-ear-right"
            />
            <polygon
              points="126,52 131,27 114,48"
              fill="var(--accent-soft)" stroke="none"
              className="cat-ear-inner cat-ear-inner-right"
            />
          </g>

          {/* ===== 头部组 ===== */}
          <g className="cat-head-group">
            <circle
              cx="100" cy="72" r="32"
              fill="#FFFDF5" stroke="#2D2D2D" strokeWidth="3"
              className="cat-head"
            />

            {/* 右眼 */}
            <g className="cat-eye-right">
              <ellipse cx="112" cy="70" rx="7" ry="8" fill="#2D2D2D" />
              <ellipse cx="114" cy="68" rx="2.5" ry="3" fill="#FFFFFF" />
            </g>

            {/* 左眼 */}
            <g className="cat-eye-left">
              <ellipse cx="88" cy="70" rx="7" ry="8" fill="#2D2D2D" />
              <ellipse cx="90" cy="68" rx="2.5" ry="3" fill="#FFFFFF" />
            </g>

            {/* 鼻子 */}
            <polygon
              points="100,79 96,83 104,83"
              fill="#FF6B6B" stroke="none"
              className="cat-nose"
            />

            {/* 嘴巴 */}
            <path
              d="M96 83 Q100 88 100 83 Q100 88 104 83"
              fill="none" stroke="#2D2D2D" strokeWidth="1.5"
              strokeLinecap="round"
              className="cat-mouth"
            />

            {/* 胡须 */}
            <g className="cat-whiskers">
              <line x1="72" y1="78" x2="50" y2="74" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="72" y1="82" x2="50" y2="83" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="128" y1="78" x2="150" y2="74" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="128" y1="82" x2="150" y2="83" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
            </g>
          </g>

          {/* ===== 前爪 ===== */}
          <g className="cat-paws-group">
            <g className="cat-paw-left">
              <ellipse cx="82" cy="145" rx="14" ry="10" fill="#FFFDF5" stroke="#2D2D2D" strokeWidth="3" />
              <line x1="76" y1="143" x2="76" y2="148" stroke="#2D2D2D" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="82" y1="142" x2="82" y2="148" stroke="#2D2D2D" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="88" y1="143" x2="88" y2="148" stroke="#2D2D2D" strokeWidth="1.2" strokeLinecap="round" />
            </g>
            <g className="cat-paw-right">
              <ellipse cx="118" cy="145" rx="14" ry="10" fill="#FFFDF5" stroke="#2D2D2D" strokeWidth="3" />
              <line x1="112" y1="143" x2="112" y2="148" stroke="#2D2D2D" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="118" y1="142" x2="118" y2="148" stroke="#2D2D2D" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="124" y1="143" x2="124" y2="148" stroke="#2D2D2D" strokeWidth="1.2" strokeLinecap="round" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

export default Cat;
