export default function Metric({
  label,
  value,
  sub,
  valueClass = '',
  badge,
  hidden = false,
  style,
}) {
  if (hidden) return null;

  return (
    <div className="metric" style={style}>
      <div className="m-label">{label}</div>
      <div className={`m-val${valueClass ? ' ' + valueClass : ''}`}>{value}</div>
      {sub && <div className="m-sub">{sub}</div>}
      {badge}
    </div>
  );
}
