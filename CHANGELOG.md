# Changelog

## 1.2.0 - 2026-09-01

- Se agregó `src/business/auditTrail.js` para resolver puntajes según trazabilidad.
- Se agregaron estados `VALIDADO`, `PENDIENTE` y `NO_CUMPLE`.
- Se agregaron riesgos `VERDE`, `AMARILLO` y `ROJO`.
- Se separó `SIMULACION` de `AUDITORIA`.
- Se bloquean en auditoría los puntajes sin evidencia validada.
- Se exige motivo para overrides manuales y se conserva el score automático.
- Se amplió el expediente CSV con campos de trazabilidad.
- Se agregaron pruebas unitarias de auditoría.

## 1.1.0 - 2026-09-01

- Se centralizaron las fórmulas M1 en `src/calculations/m1Calculations.js`.
- Se conectó `assets/app.js` al motor de cálculo sin cambiar la interfaz visual.
- Se agregaron pruebas unitarias para RRHH, capacidad financiera, experiencia, especialidad, economía, ranking, divisiones entre cero y precio objetivo.
- Se agregó `docs/CALCULATIONS.md` para documentar fórmulas, unidades, estados y reglas ambiguas.
- Se agregó `docs/ARCHITECTURE.md` como documento vivo de arquitectura.
- Se agregó `AGENTS.md` con reglas globales del proyecto.
