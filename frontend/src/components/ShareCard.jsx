import { useState, useCallback } from 'react';
import { ACCENT_COLORS, STATE_LABELS } from '../constants';
import './ShareCard.css';

const CARD_W = 600;
const CARD_H = 800;

const CATEGORY_KEYS = ['AI/ML', 'Security', 'DevTools', 'Systems', 'Other'];
const CAT_COLORS = {
  'AI/ML': '#F97316',
  'Security': '#EF4444',
  'DevTools': '#10B981',
  'Systems': '#3B82F6',
  'Other': '#A8A29E',
};

function formatShareDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// Character-by-character wrap (works for CJK + Latin mixed)
function wrapText(ctx, text, cx, startY, maxWidth, lineH) {
  let y = startY;
  for (const para of text.split('\n')) {
    let line = '';
    for (const ch of [...para]) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, cx, y);
        y += lineH;
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) { ctx.fillText(line, cx, y); y += lineH; }
  }
  return y;
}

async function loadSvgAsImage(svgEl) {
  const clone = svgEl.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', '200');
  clone.setAttribute('height', '200');
  clone.removeAttribute('class');
  clone.removeAttribute('style');
  clone.querySelectorAll('[filter]').forEach(el => el.removeAttribute('filter'));
  const defs = clone.querySelector('defs');
  if (defs) defs.remove();

  const svgStr = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgStr], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise((resolve) => {
    img.onload = resolve;
    img.onerror = resolve; // fail silently
    img.src = url;
  });
  URL.revokeObjectURL(url);
  return img;
}

async function drawCard(catState, narrative, date, categories, catSvgRef) {
  const accentColor = ACCENT_COLORS[catState] || '#D97706';
  const stateLabel = STATE_LABELS[catState] || '满足舔爪';

  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');

  await document.fonts.ready;

  // Background
  ctx.fillStyle = '#FFFDF5';
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Top accent stripe
  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, CARD_W, 8);

  // Cat
  if (catSvgRef?.current) {
    try {
      const catImg = await loadSvgAsImage(catSvgRef.current);
      ctx.drawImage(catImg, 200, 36, 200, 200);
    } catch (_) { /* skip */ }
  }

  let y = 270;

  // Date
  ctx.fillStyle = '#A8A29E';
  ctx.font = '15px "Noto Sans SC", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(formatShareDate(date), CARD_W / 2, y);
  y += 44;

  // Title
  ctx.fillStyle = '#1C1917';
  ctx.font = 'bold 28px Nunito, "PingFang SC", sans-serif';
  ctx.fillText('今日技术圈猫评', CARD_W / 2, y);
  y += 38;

  // State badge
  ctx.font = '600 13px "Noto Sans SC", "PingFang SC", sans-serif';
  const badgeW = ctx.measureText(stateLabel).width + 32;
  const badgeH = 28;
  const badgeX = CARD_W / 2 - badgeW / 2;
  ctx.fillStyle = accentColor + '28';
  roundedRect(ctx, badgeX, y, badgeW, badgeH, 14);
  ctx.fill();
  ctx.fillStyle = accentColor;
  ctx.fillText(stateLabel, CARD_W / 2, y + 19);
  y += 52;

  // Narrative
  ctx.fillStyle = '#44403C';
  ctx.font = '17px "Noto Sans SC", "PingFang SC", sans-serif';
  const text = narrative || '今天的技术圈风平浪静，本猫正好补个觉。喵~';
  y = wrapText(ctx, text, CARD_W / 2, y, 460, 32);
  y += 24;

  // Category badges
  if (categories) {
    const items = CATEGORY_KEYS
      .map(k => ({ k, n: categories[k] || 0 }))
      .filter(c => c.n > 0);

    if (items.length > 0) {
      ctx.font = '600 12px "Noto Sans SC", "PingFang SC", sans-serif';
      const labels = items.map(c => `${c.k} · ${c.n}`);
      const widths = labels.map(l => ctx.measureText(l).width + 20);
      const gap = 8;
      const totalW = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
      let bx = CARD_W / 2 - totalW / 2;
      const bh = 22;

      items.forEach((c, i) => {
        const bw = widths[i];
        const color = CAT_COLORS[c.k];
        ctx.fillStyle = color + '20';
        roundedRect(ctx, bx, y, bw, bh, 11);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.fillText(labels[i], bx + 10, y + 15);
        bx += bw + gap;
      });
      ctx.textAlign = 'center';
      y += 40;
    }
  }

  // Footer
  ctx.fillStyle = '#C4B5A5';
  ctx.font = '12px "Noto Sans SC", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GitHub Trending Pet · 每日自动生成', CARD_W / 2, CARD_H - 28);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));
}

export default function ShareCard({ catState, narrative, date, categories, catSvgRef }) {
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const blob = await drawCard(catState, narrative, date, categories, catSvgRef);
      if (!blob) throw new Error('Canvas toBlob returned null');
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error('Share card generation failed:', err);
      setError('生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  }, [catState, narrative, date, categories, catSvgRef]);

  const handleDownload = useCallback(() => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `cat-review-${date || 'today'}.png`;
    a.click();
  }, [previewUrl, date]);

  const handleCopy = useCallback(async () => {
    if (!previewUrl) return;
    try {
      const resp = await fetch(previewUrl);
      const blob = await resp.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      window.open(previewUrl, '_blank');
    }
  }, [previewUrl]);

  const handleClose = useCallback(() => {
    setPreviewUrl(null);
    setCopied(false);
    setError(null);
  }, []);

  return (
    <>
      <button
        className="share-trigger"
        onClick={handleGenerate}
        disabled={generating}
        title={error || undefined}
      >
        <span className="share-trigger-icon">
          {generating ? '⏳' : error ? '⚠️' : '📤'}
        </span>
        <span className="share-trigger-label">
          {generating ? '生成中' : error ? '失败' : '分享'}
        </span>
      </button>

      {previewUrl && (
        <div className="share-modal-backdrop" onClick={handleClose}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h2 className="share-modal-title">分享卡片</h2>
              <button className="share-modal-close" onClick={handleClose}>✕</button>
            </div>

            <div className="share-preview-wrap">
              <img
                src={previewUrl}
                alt="今日技术圈猫评"
                className="share-preview-img"
              />
            </div>

            <div className="share-modal-actions">
              <button className="share-action-btn primary" onClick={handleCopy}>
                {copied ? '✓ 已复制' : '📋 复制'}
              </button>
              <button className="share-action-btn" onClick={handleDownload}>
                💾 下载
              </button>
              <button className="share-action-btn dismiss" onClick={handleClose}>
                ↩ 收起
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
