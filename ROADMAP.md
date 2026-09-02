# Roadmap

## Prioridad inmediata

- Validar contra fuente normativa las reglas marcadas como `REQUIERE_VALIDACION`.
- Separar exportaciones PDF/CSV/ZIP fuera de `assets/app.js`.
- Separar persistencia local en una capa `storage`.
- Corregir seguridad del panel de administración: no contraseña fija en frontend y no API keys en `localStorage`.

## Motor de auditoría

- Conectar el modo `AUDITORIA` con un repositorio documental real de expedientes.
- Ampliar overrides con usuario autenticado cuando exista backend.
- Crear bitácora inmutable de cambios de estado y score.
- Sustituir checks simples de experiencia/OEM por evidencia validada desde contratos y referencias.

## Datos

- Mover estado inicial a `data/default_state.json`.
- Convertir contratos en fuente real para experiencia, especialidad y cumplimiento.
- Crear base validable de referencias OEM.
- Preparar modelo para consorcios con varios integrantes financieros.

## Calidad

- Agregar pruebas de regresión con histórico GH, PROGONZA + INARVI y Consorcio X.
- Agregar validación de navegador para carga de la app estática.
- Definir política para retirar `node_modules` versionado del repositorio.
