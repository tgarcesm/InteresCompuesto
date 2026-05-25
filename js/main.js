import {
  initNavigation,
  navigateToPanel,
  onPanelActivate,
  PANEL_IDS,
} from './components/navigation.js';
import { initCdtCalculator } from './panels/cdt-calculator.js';
import { initCdtTermAnalysis } from './panels/cdt-term-analysis.js';
import { initInvestmentsComparator, renderComparator } from './panels/investments-comparator.js';
import { initCompoundInterest } from './panels/compound-interest.js';
import { initFormattedInputs } from './utils/inputs.js';

function bootstrap() {
  initFormattedInputs();
  initNavigation();
  initCdtCalculator();
  initCdtTermAnalysis();
  initInvestmentsComparator();
  initCompoundInterest();

  onPanelActivate(PANEL_IDS.COMPARAR, renderComparator);

  document.getElementById('btn-go-comparar')?.addEventListener('click', () => {
    navigateToPanel(PANEL_IDS.COMPARAR);
  });
}

document.addEventListener('DOMContentLoaded', bootstrap);
