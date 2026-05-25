/**
 * Formatea un número con separador de miles (punto) al estilo colombiano.
 */
function formatWithThousands(value) {
  if (!Number.isFinite(value)) return '';
  const rounded = Math.round(value);
  return '$ ' + rounded.toLocaleString('es-CO');
}

/**
 * Inicializa los hints de formato debajo de inputs de dinero (data-fmt="money").
 * Muestra el valor formateado en tiempo real en un <span> hermano con clase .fmt-hint.
 */
export function initFormattedInputs() {
  document.querySelectorAll('input[data-fmt="money"]').forEach((input) => {
    const hint = input.parentElement?.querySelector('.fmt-hint');
    if (!hint) return;

    const update = () => {
      const val = parseFloat(input.value);
      hint.textContent = Number.isFinite(val) && val > 0 ? formatWithThousands(val) : '';
    };

    input.addEventListener('input', update);
    input.addEventListener('change', update);
  });
}

/** Lee un número; si el campo está vacío devuelve null */
export function readOptionalNumber(element) {
  if (!element || element.value.trim() === '') return null;
  const n = parseFloat(element.value);
  return Number.isFinite(n) ? n : null;
}

/** Lee un número con valor por defecto si está vacío */
export function readNumber(element, defaultValue = 0) {
  const v = readOptionalNumber(element);
  return v === null ? defaultValue : v;
}
