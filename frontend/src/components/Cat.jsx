function Cat({ state = 'content_grooming' }) {
  return (
    <div className="cat-container">
      <svg viewBox="0 0 200 200" width="200" height="200">
        {/* Placeholder: 猫的 SVG 将在 Phase 4 完整绘制 */}
        <circle cx="100" cy="100" r="60" fill="#FFFDF5" stroke="#2D2D2D" strokeWidth="3" />
        <text x="100" y="105" textAnchor="middle" fontSize="12" fill="#9CA3AF">
          喵～
        </text>
      </svg>
    </div>
  );
}

export default Cat;
