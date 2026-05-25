import { PANEL_IDS } from '../config/constants.js';

const panelCallbacks = new Map();

export function onPanelActivate(panelId, callback) {
  panelCallbacks.set(panelId, callback);
}

export function initNavigation() {
  document.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => navigateToPanel(btn.dataset.nav));
  });

  document.querySelector('.logo')?.addEventListener('click', () => {
    navigateToPanel(PANEL_IDS.HOME);
  });

  // Restaurar panel desde hash al cargar
  const initialPanel = getPanelFromHash() || PANEL_IDS.HOME;
  showPanel(initialPanel);
  history.replaceState({ panel: initialPanel }, '', `#${initialPanel}`);

  // Manejar botón atrás/adelante
  window.addEventListener('popstate', (e) => {
    const panelId = e.state?.panel || getPanelFromHash() || PANEL_IDS.HOME;
    showPanel(panelId);
  });
}

function getPanelFromHash() {
  const hash = window.location.hash.slice(1);
  const validPanels = Object.values(PANEL_IDS);
  return validPanels.includes(hash) ? hash : null;
}

function showPanel(panelId) {
  document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));

  document.getElementById(`panel-${panelId}`)?.classList.add('active');

  const navBtn = document.querySelector(`.nav-btn[data-nav="${panelId}"]`);
  if (navBtn) navBtn.classList.add('active');

  const callback = panelCallbacks.get(panelId);
  if (callback) callback();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function navigateToPanel(panelId) {
  showPanel(panelId);
  history.pushState({ panel: panelId }, '', `#${panelId}`);
}

export { PANEL_IDS };
