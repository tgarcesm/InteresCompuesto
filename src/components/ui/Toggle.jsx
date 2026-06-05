export default function Toggle({ on, onChange, title, subtitle }) {
  return (
    <div
      className="tog-row"
      role="button"
      tabIndex={0}
      onClick={() => onChange(!on)}
      onKeyDown={(e) => e.key === 'Enter' && onChange(!on)}
    >
      <div className={`tog${on ? ' on' : ''}`} aria-hidden="true" />
      <div>
        <div className="tog-text">{title}</div>
        {subtitle && <div className="tog-sub">{subtitle}</div>}
      </div>
    </div>
  );
}
