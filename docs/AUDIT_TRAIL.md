# Auditoría y trazabilidad

## Principio

El sistema no debe aceptar puntos. Debe probar puntos.

Toda puntuación debe poder rastrearse así:

```text
DATO -> EVIDENCIA -> VALIDACION -> REQUISITO -> PUNTAJE
```

## Modos

### SIMULACION

Permite escenarios, cambios manuales y exploración de puntajes.

Es el modo por defecto para conservar compatibilidad con la versión previa.

### AUDITORIA

Exige evidencia validada antes de otorgar puntos.

En este modo:

- un puntaje automático sin soporte baja a 0;
- un criterio `NO_CUMPLE` baja a 0;
- un override manual sin motivo baja a 0;
- un override manual sin evidencia validada baja a 0;
- se conserva siempre el `automaticScore`.

## Estados

- `VALIDADO`: existe evidencia, origen, responsable, fecha y validación.
- `PENDIENTE`: falta soporte suficiente o validación.
- `NO_CUMPLE`: el requisito no se acredita.

## Riesgo

- `VERDE`: soporte completo o riesgo bajo.
- `AMARILLO`: requiere seguimiento.
- `ROJO`: bloqueo, falta crítica o no cumplimiento.

## Campos por criterio

Cada criterio y participante almacena:

- `automaticScore`;
- `finalScore`;
- `evidence`;
- `origin`;
- `responsible`;
- `date`;
- `status`;
- `notes`;
- `override`;
- `overrideReason`;
- `manualScore`;
- `risk`;
- `warnings`.

## Overrides

Si existe override manual:

- se conserva `automaticScore`;
- se guarda `manualScore`;
- se exige `overrideReason`;
- se registra `date`;
- se exige evidencia validada en modo `AUDITORIA`.

## Implementación

El motor vive en `src/business/auditTrail.js`.

La UI sólo captura datos y muestra estados; la decisión de otorgar o bloquear puntos vive en el motor de auditoría.
