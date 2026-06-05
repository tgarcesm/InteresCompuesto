function formatMoneyHint(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n) || n <= 0) return '';
  return '$ ' + Math.round(n).toLocaleString('es-CO');
}

export function Field({ label, hint, children, optional }) {
  return (
    <div className={`field${optional ? ' field--optional' : ''}`}>
      {label && <label>{label}</label>}
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function MoneyInput({ id, label, value, onChange, placeholder, min = 0 }) {
  const hint = formatMoneyHint(value);
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <input
        type="number"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        inputMode="numeric"
      />
      {hint && <span className="hint fmt-hint">{hint}</span>}
    </div>
  );
}

export function NumberInput({ id, label, value, onChange, placeholder, min, max, step, hint, optional }) {
  return (
    <div className={`field${optional ? ' field--optional' : ''}`}>
      {label && <label htmlFor={id}>{label}</label>}
      <input
        type="number"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        inputMode={step ? 'decimal' : 'numeric'}
      />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function TextInput({ id, label, value, onChange, placeholder }) {
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <input
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function parseOptionalNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export function parseNumber(value, defaultValue = 0) {
  const v = parseOptionalNumber(value);
  return v === null ? defaultValue : v;
}
