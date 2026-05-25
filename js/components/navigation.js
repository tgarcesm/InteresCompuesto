import { PANEL_IDS } from '../config/constants.js';

const panelCallbacks = new Map();
const validPanels = Object.values(PANEL_IDS);
let currentPanel = null;

export function onPanelActivate(panelId, callback) {
  panelCallbacks.set(panelId, callback);
}

export function initNavigation() {
  document.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToPanel(btn.dataset.nav);
    });
  });

  document.querySelector('.logo')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigateToPanel(PANEL_IDS.HOME);
  });

  // Panel inicial desde hash o HOME por defecto
  const initialPanel = getPanelFromHash() || PANEL_IDS.HOME;
  showPanel(initialPanel);
  history.replaceState({ panel: initialPanel }, '', buildHash(initialPanel));

  // Botón atrás/adelante
  window.addEventListener('popstate', (e) => {
    const panelId = e.state?.panel || getPanelFromHash() || PANEL_IDS.HOME;
    showPanel(panelId);
  });
}

function buildHash(panelId) {
  const base = window.location.pathname + window.location.search;
  return base + '#' + panelId;
}

function getPanelFromHash() {
  const hash = window.location.hash.slice(1);
  return validPanels.includes(hash) ? hash : null;
}

function showPanel(panelId) {
  if (!validPanels.includes(panelId)) panelId = PANEL_IDS.HOME;
  if (panelId === currentPanel) return;
  currentPanel = panelId;

  document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));

  const panel = document.getElementById(`panel-${panelId}`);
  if (panel) {
    panel.classList.add('active');
  }

  const navBtn = document.querySelector(`.nav-btn[data-nav="${panelId}"]`);
  if (navBtn) navBtn.classList.add('active');

  const callback = panelCallbacks.get(panelId);
  if (callback) callback();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function navigateToPanel(panelId) {
  if (!validPanels.includes(panelId)) return;
  showPanel(panelId);
  history.pushState({ panel: panelId }, '', buildHash(panelId));
}

export { PANEL_IDS };
