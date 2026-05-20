function StatusPanel({ data }) {
  if (!data) {
    return <div className="status-panel">加载中...</div>;
  }

  return (
    <div className="status-panel">
      <p>{data.narrative || '等待数据...'}</p>
    </div>
  );
}

export default StatusPanel;
