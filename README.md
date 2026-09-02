# M1 PRECALIFICACIÓN ENGINE 4.0

Motor editable para Antigravity.

## Arranque
1. Descomprime el ZIP.
2. Abre la carpeta `M1_PRECALIFICACION_ENGINE` en Antigravity.
3. Ejecuta `index.html` o, si tienes Node.js:
   `npx serve .`

## Pruebas

```bash
npm test
```

Ejecuta la suite unitaria del motor de cálculo.

## Qué hace
- Reproduce el histórico de GH (48/50) y PROGONZA + INARVI (35.4/50).
- Calcula Consorcio X desde microcriterios.
- Detecta si supera el mínimo técnico de 37.50.
- Calcula económico /50 sólo para solventes.
- Ranking total /100.
- Motor RRHH (6 pts).
- Motor financiero (6 pts).
- Motor experiencia (6 pts).
- Motor especialidad/OEM (6 pts).
- Cartas MIPYME, OEM y CDR.
- Personal con discapacidad.
- Cumplimiento de contratos.
- Banco editable de contratos/referencias.
- Checklist de expediente/evidencias.
- Semáforo de riesgos y brechas.
- Escenarios guardados.
- Autosave.
- Exportar/importar JSON.
- Exportar expediente CSV.
- PDF ejecutivo.
- Modo claro/oscuro.

## Archivos
- `index.html`
- `assets/styles.css`
- `assets/app.js`
- `src/calculations/m1Calculations.js`
- `src/business/auditTrail.js`
- `tests/calculations/m1Calculations.test.js`
- `tests/business/auditTrail.test.js`
- `data/m1_scoring_model.json`
- `docs/ARCHITECTURE.md`
- `docs/CALCULATIONS.md`
- `docs/AUDIT_TRAIL.md`
- `docs/NOTAS_DE_IMPLEMENTACION.md`

## Importante
El programa distingue entre:
1. Puntajes y reglas directamente soportadas por los documentos M1.
2. Reglas internas de precalificación que requieren una interpretación operativa para poder automatizarse.

Las reglas internas están documentadas y siempre existe override manual en la matriz técnica.

## Arquitectura de cálculo

Las fórmulas M1 viven en `src/calculations/m1Calculations.js`. La interfaz consume ese módulo y no debe duplicar fórmulas en HTML.

Cada cálculo devuelve fórmula, entradas, resultado, unidades, fuente/regla, confianza, estado y advertencias. Las reglas ambiguas se marcan como `REQUIERE_VALIDACION`.

## Auditoría

El sistema distingue `SIMULACION` de `AUDITORIA`.

En `AUDITORIA`, un puntaje sólo cuenta si tiene evidencia, origen, responsable, fecha y estado `VALIDADO`. Los overrides manuales conservan el score automático y exigen motivo.
