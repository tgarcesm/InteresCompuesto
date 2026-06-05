import { createContext, useCallback, useContext, useState } from 'react';

const MenuContext = createContext(null);

export function MenuProvider({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => setMenuOpen((o) => !o), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <MenuContext.Provider value={{ menuOpen, toggleMenu, closeMenu }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu debe usarse dentro de MenuProvider');
  return ctx;
}
