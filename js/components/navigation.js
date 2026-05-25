import { PANEL_IDS } from '../config/constants.js';


const panelCallbacks = new Map();

/**
 * Registra un callback al activar un panel (ej. refrescar comparador)
 */
export function onPanelActivate(panelId, callback) {
  panelCallbacks.set(panelId, callback);
}

export function initNavigation() {
  document.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.nav === PANEL_IDS.COMPARAR) {
        navigateToPanel(PANEL_IDS.COMPARAR);
      } else {
        switchTab(btn.dataset.nav, btn);
      }
    });
  });
}

export function switchTab(panelId, activeBtn) {
  document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));

  document.getElementById(`panel-${panelId}`)?.classList.add('active');
  activeBtn?.classList.add('active');

  const callback = panelCallbacks.get(panelId);
  if (callback) callback();
}

/** Navega a un panel desde botones fuera del nav (ej. Comparar CDTs) */
export function navigateToPanel(panelId) {
  document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));

  document.getElementById(`panel-${panelId}`)?.classList.add('active');

  const navBtn = document.querySelector(`.nav-btn[data-nav="${panelId}"]`);
  if (navBtn) {
    navBtn.classList.add('active');
  } else if (panelId === PANEL_IDS.COMPARAR) {
    document.getElementById('btn-go-comparar-nav')?.classList.add('active');
  }

  const callback = panelCallbacks.get(panelId);
  if (callback) callback();

  document.getElementById(`panel-${panelId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export { PANEL_IDS };
