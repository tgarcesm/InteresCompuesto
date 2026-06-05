# CDT Pro

Calculadora financiera para certificados de depósito a término (CDT) en Colombia. Incluye cálculo con retefuente, análisis corto vs largo, comparador multi-inversión e interés compuesto.

## Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| **Calculadora CDT** | Interés bruto/neto, retefuente 4%, tasa neta E.A. y capital final |
| **Análisis corto/largo** | Guía educativa + comparador nominal → E.A. con veredicto automático |
| **Comparar inversiones** | Varios CDTs proyectados al mismo horizonte, tabla y gráfico apilado |
| **Interés compuesto** | Aportes periódicos, modo cajita + CDT y varianza de tasa opcional |

## Estructura del proyecto

```
InteresCompuesto/
├── index.html              # Punto de entrada (Vite)
├── vite.config.js          # Build y servidor de desarrollo
├── package.json
├── src/
│   ├── main.js             # Bootstrap de la aplicación
│   ├── styles/             # CSS modular (variables, layout, componentes…)
│   └── js/
│       ├── config/constants.js
│       ├── utils/          # format, inputs, toggles
│       ├── lib/finance.js  # Lógica financiera pura (sin DOM)
│       ├── services/charts.js
│       ├── components/navigation.js
│       └── panels/         # Controladores por sección
└── dist/                   # Build de producción (generado)
```

## Arquitectura

- **Vite**: servidor de desarrollo con recarga en caliente, empaquetado optimizado y `base` relativa para GitHub Pages.
- **Separación de capas**: `lib/finance.js` concentra la lógica de negocio; los archivos en `panels/` solo leen/escriben el DOM.
- **ES Modules**: cada feature es un módulo importable; facilita tests unitarios sobre `finance.js`.
- **CSS por responsabilidad**: variables → base → layout → componentes → paneles.
- **Chart.js** como dependencia npm (no CDN).

## Cómo ejecutar

```bash
npm install
npm run dev
```

Abre `http://localhost:8080`.

### Producción

```bash
npm run build
npm run preview
```

El resultado queda en `dist/`. Para GitHub Pages, publica el contenido de `dist/` (Actions o rama `gh-pages`).

## Dependencias

- [Vite](https://vitejs.dev/) — tooling y build
- [Chart.js](https://www.chartjs.org/) — gráficos
- Google Fonts: Inter, Plus Jakarta Sans
