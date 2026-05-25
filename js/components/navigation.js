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
}

export function navigateToPanel(panelId) {
  document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));

  document.getElementById(`panel-${panelId}`)?.classList.add('active');

  const navBtn = document.querySelector(`.nav-btn[data-nav="${panelId}"]`);
  if (navBtn) navBtn.classList.add('active');

  const callback = panelCallbacks.get(panelId);
  if (callback) callback();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export { PANEL_IDS };
