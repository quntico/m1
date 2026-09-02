# Roadmap

## Prioridad inmediata

- Validar contra fuente normativa las reglas marcadas como `REQUIERE_VALIDACION`.
- Separar exportaciones PDF/CSV/ZIP fuera de `assets/app.js`.
- Separar persistencia local en una capa `storage`.
- Corregir seguridad del panel de administración: no contraseña fija en frontend y no API keys en `localStorage`.

## Motor de auditoría

- Implementar modo `AUDITORIA` vs `SIMULACION`.
- Hacer que cada punto técnico dependa de evidencia validada en modo auditoría.
- Registrar overrides con score automático, score manual, motivo, revisor y fecha.

## Datos

- Mover estado inicial a `data/default_state.json`.
- Convertir contratos en fuente real para experiencia, especialidad y cumplimiento.
- Crear base validable de referencias OEM.
- Preparar modelo para consorcios con varios integrantes financieros.

## Calidad

- Agregar pruebas de regresión con histórico GH, PROGONZA + INARVI y Consorcio X.
- Agregar validación de navegador para carga de la app estática.
- Definir política para retirar `node_modules` versionado del repositorio.
