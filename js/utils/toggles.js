/**
 * Enlaza un toggle visual (.tog-row + .tog)
 * @returns {() => boolean} getter del estado actual
 */
export function bindToggle({ rowId, toggleId, defaultOn = false, onChange }) {
  let active = defaultOn;
  const row = document.getElementById(rowId);
  const tog = document.getElementById(toggleId);

  const sync = () => tog?.classList.toggle('on', active);

  row?.addEventListener('click', () => {
    active = !active;
    sync();
    row.setAttribute('aria-pressed', String(active));
    onChange?.(active);
  });

  row?.setAttribute('aria-pressed', String(active));
  sync();

  return () => active;
}
