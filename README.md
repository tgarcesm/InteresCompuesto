# CDT Pro

Calculadora financiera para certificados de depósito a término (CDT) en Colombia. Incluye cálculo con retefuente, análisis corto vs largo, comparador multi-inversión e interés compuesto.

## Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| **Calculadora CDT** | Interés bruto/neto, retefuente 4%, tasa neta E.A. y capital final |
| **Análisis corto/largo** | Guía educativa + comparador nominal → E.A. con veredicto automático |
| **Comparar inversiones** | Varios CDTs proyectados al mismo horizonte, tabla y gráfico apilado |
| **Interés compuesto** | Dentro de Calculadora CDT; aportes periódicos y varianza de tasa opcional (± %) |

## Estructura del proyecto

```
InteresCompuesto/
├── index.html                 # Punto de entrada de la aplicación
├── css/
│   ├── variables.css          # Design tokens (colores, radios, sombras)
│   ├── base.css               # Reset y tipografía base
│   ├── layout.css             # Topbar, wrap, paneles, grids de página
│   ├── components.css         # Cards, botones, métricas, tablas, charts
│   ├── panels.css             # Estilos del análisis corto/largo
│   └── main.css               # Importa todas las hojas
├── js/
│   ├── main.js                # Bootstrap de la aplicación
│   ├── config/constants.js    # Tasas, umbrales, IDs de paneles
│   ├── utils/format.js        # fmt(), pct(), eje de gráficos
│   ├── lib/finance.js         # Fórmulas puras (sin DOM)
│   ├── services/charts.js     # Factory Chart.js reutilizable
│   ├── components/navigation.js
│   └── panels/
│       ├── cdt-calculator.js
│       ├── cdt-term-analysis.js
│       ├── investments-comparator.js
│       └── compound-interest.js
└── README.md
```

## Arquitectura

- **Separación de capas**: `lib/finance.js` concentra la lógica de negocio; los archivos en `panels/` solo leen/escriben el DOM.
- **ES Modules**: cada feature es un módulo importable; facilita tests unitarios futuros sobre `finance.js`.
- **CSS por responsabilidad**: variables → base → layout → componentes → paneles específicos.
- **Sin build step**: HTML/CSS/JS vanilla; Chart.js y fuentes vía CDN.

## Fórmulas

**CDT (interés):**

```
Interés bruto = Capital × [(1 + TEA)^(días/365) − 1]
Retefuente    = 4% × interés bruto (si aplica)
Capital final = Capital + interés neto
```

**Nominal → E.A. (plazo N días):**

```
E.A. = (1 + r × N/365)^(365/N) − 1
```

## Cómo ejecutar

Los módulos ES requieren servir el proyecto por HTTP (no abrir `index.html` directamente con `file://` en todos los navegadores).

```bash
npm run dev
```

Abre `http://localhost:8080`. Los campos numéricos usan `placeholder` como ejemplo (no vienen precargados).

## Dependencias externas

- [Chart.js 4.4.1](https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js)
- Google Fonts: Inter, Plus Jakarta Sans

## Próximos pasos sugeridos

- Tests unitarios en `finance.js` (Vitest o similar)
- Persistencia local (`localStorage`) para la lista de CDTs del comparador
- Empaquetado opcional con Vite si se añaden más dependencias
