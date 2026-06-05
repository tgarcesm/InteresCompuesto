import { NavLink, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/constants.js';
import { useMenu } from '../../context/MenuContext.jsx';

const NAV_ITEMS = [
  { path: ROUTES.HOME, label: 'Inicio', end: true },
  { path: ROUTES.CDT, label: 'Calculadora CDT' },
  { path: ROUTES.COMPUESTO, label: 'Interés compuesto' },
  { path: ROUTES.COMPARAR, label: 'Comparar CDTs' },
];

export default function Topbar() {
  const navigate = useNavigate();
  const { menuOpen, toggleMenu, closeMenu } = useMenu();

  return (
    <header className="topbar">
      <div
        className="logo"
        role="button"
        tabIndex={0}
        title="Volver al inicio"
        onClick={() => navigate(ROUTES.HOME)}
        onKeyDown={(e) => e.key === 'Enter' && navigate(ROUTES.HOME)}
      >
        <div className="logo-icon" aria-hidden="true">
          $
        </div>
        CDT<em>Pro</em>
      </div>

      <button
        className={`nav-hamburger${menuOpen ? ' open' : ''}`}
        type="button"
        aria-label="Abrir menú"
        onClick={toggleMenu}
      >
        <span />
        <span />
        <span />
      </button>

      <nav
        className={`nav${menuOpen ? ' open' : ''}`}
        id="main-nav"
        aria-label="Secciones principales"
        onClick={closeMenu}
      >
        {NAV_ITEMS.map(({ path, label, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
