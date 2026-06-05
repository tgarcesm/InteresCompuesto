import { copyFileSync } from 'node:fs';

/** GitHub Pages: 404.html permite rutas limpias en SPA (History API). */
copyFileSync('dist/index.html', 'dist/404.html');
