import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { MenuProvider } from './context/MenuContext.jsx';
import Topbar from './components/layout/Topbar.jsx';
import Footer from './components/layout/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import CdtPage from './pages/CdtPage.jsx';
import CompoundPage from './pages/CompoundPage.jsx';
import ComparePage from './pages/ComparePage.jsx';
import { ROUTES } from './config/constants.js';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

function AppLayout() {
  return (
    <>
      <ScrollToTop />
      <Topbar />
      <main className="wrap">
        <Routes>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.CDT} element={<CdtPage />} />
          <Route path={ROUTES.COMPUESTO} element={<CompoundPage />} />
          <Route path={ROUTES.COMPARAR} element={<ComparePage />} />
          <Route path="/home" element={<Navigate to={ROUTES.HOME} replace />} />
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <MenuProvider>
        <AppLayout />
      </MenuProvider>
    </BrowserRouter>
  );
}
