# Arquitectura del proyecto

## Estado actual

M1 Precalificación Engine es una aplicación web estática con HTML, CSS y JavaScript modularizado de forma incremental.

Estructura principal:

- `index.html`: estructura de interfaz y carga de scripts.
- `assets/styles.css`: estilos visuales.
- `assets/app.js`: orquestación de UI, estado local, eventos, renderizado y exportaciones.
- `src/calculations/m1Calculations.js`: motor centralizado de cálculo M1.
- `src/business/auditTrail.js`: motor de auditoría y trazabilidad.
- `data/m1_scoring_model.json`: datos base del modelo de scoring.
- `tests/calculations/m1Calculations.test.js`: pruebas unitarias del motor de cálculo.
- `tests/business/auditTrail.test.js`: pruebas unitarias del motor de auditoría.
- `docs/`: documentación técnica.

## Separación de responsabilidades

La arquitectura objetivo mantiene límites claros:

- UI: `index.html`, renderizado y eventos en `assets/app.js`.
- estilos: `assets/styles.css`.
- calculations: `src/calculations/m1Calculations.js`.
- business logic: `src/business/auditTrail.js`.
- datos: `data/`.
- documentación: `docs/`.
- pruebas: `tests/`.
- conectores: pendientes de separar cuando existan integraciones reales.
- storage: actualmente `localStorage`; debe evolucionar a una capa aislada si crece.
- exports: actualmente en `assets/app.js`; debe separarse a `src/exports/` cuando se amplíen PDF, CSV y ZIP.
- configuration: pendiente de formalizar para valores de entorno y flags.

## Motor de cálculo

El motor de cálculo no depende de HTML, DOM, CSS, eventos de UI ni `localStorage`.

Cada cálculo devuelve:

- fórmula usada;
- entradas;
- resultado;
- unidades;
- fuente/regla;
- nivel de confianza;
- estado;
- advertencias;
- desglose cuando aplica.

Cuando una regla es ambigua, el motor marca `REQUIERE_VALIDACION`.

## Motor de auditoría

La capa de auditoría vive en `src/business/auditTrail.js`.

Principio rector:

```text
DATO -> EVIDENCIA -> VALIDACION -> REQUISITO -> PUNTAJE
```

El sistema distingue `SIMULACION` de `AUDITORIA`.

En `SIMULACION` se conservan escenarios y edición manual para análisis competitivo.

En `AUDITORIA` ningún puntaje automático se otorga sin:

- evidencia;
- origen;
- responsable;
- fecha;
- estado `VALIDADO`.

Los overrides manuales conservan `automaticScore`, guardan `manualScore`, exigen motivo y requieren evidencia validada.

## Fórmulas localizadas

Se centralizaron en `src/calculations/m1Calculations.js`:

- solvencia técnica;
- suma técnica;
- subtotales por grupo;
- menor precio solvente;
- puntaje económico;
- puntaje total;
- recursos humanos;
- capacidad financiera;
- experiencia;
- especialidad;
- precio máximo para objetivo competitivo;
- margen de seguridad.

## Compatibilidad

La UI conserva el modelo de estado existente y sigue llamando funciones como `autoScores`, `tech`, `gscore` y `report`, pero esas funciones ahora delegan en el motor centralizado.

No se cambiaron reglas visuales ni flujos de usuario.

## Riesgos detectados

- `node_modules` aparece versionado en el repositorio. Debe retirarse en una tarea separada y con revisión, porque afecta muchos archivos.
- El panel de administración contiene una contraseña fija en frontend y almacenamiento de API key en `localStorage`. Debe corregirse en una tarea de seguridad dedicada.
- `assets/app.js` todavía concentra UI, persistencia y exportaciones; el refactor debe continuar por capas pequeñas.
- El modo `AUDITORIA` ya bloquea puntajes sin evidencia, pero la captura documental todavía debe evolucionar a repositorio real de expedientes.
- Experiencia, especialidad, cumplimiento y reglas académicas siguen marcadas como `REQUIERE_VALIDACION` hasta validar fuente normativa/evidencia.

## Validación

Comando actual:

```bash
npm test
```

Ejecuta pruebas unitarias del motor de cálculo con `node --test`.
