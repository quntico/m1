# Motor de cálculo M1

## Objetivo

Centralizar las fórmulas del sistema en `src/calculations/m1Calculations.js` para que la interfaz no sea dueña de los cálculos.

El motor no depende de HTML, DOM, CSS, eventos de UI ni `localStorage`.

## Contrato de cada cálculo

Cada función devuelve metadatos trazables:

```js
{
  id,
  formula,
  inputs,
  result,
  units,
  sourceRule,
  confidence,
  status,
  warnings,
  breakdown
}
```

## Estados

- `OK`: regla suficiente y entradas procesables.
- `ENTRADA_INVALIDA`: datos incompatibles.
- `REQUIERE_VALIDACION`: regla ambigua, evidencia faltante, supuesto operativo o división entre cero.

## Fórmulas centralizadas

### Técnica

```text
total_tecnico = suma(puntajes_criterios)
solvente = total_tecnico >= 37.50
```

Máximo técnico: 50 puntos.

### Económica

```text
PSPMB = min(precio de proposiciones solventes)
PPAj = 50 * (PSPMB / PPj)
PTj = TPT + TPE
```

Sólo las propuestas solventes entran a la evaluación económica.

### Capacidad financiera

```text
capacidad_financiera = capital_trabajo>=necesidad_3_meses(0|4)
                     + liquidez>=1(0|1)
                     + endeudamiento<=0.5(0|1)

liquidez = activo_circulante / pasivo_circulante
endeudamiento = pasivo_total / activo_total
```

Las divisiones entre cero se marcan como `REQUIERE_VALIDACION`.

### Recursos humanos

```text
rrhh = gate_plantilla_minima
     * (min(1, anios_acreditados / anios_requeridos) + preparacion + software)
```

La distribución académica actual conserva la lógica existente:

- `none`: 0
- `lic`: 2
- `maestria`: 3
- `doctorado`: 4

Estado: `REQUIERE_VALIDACION`, porque la distribución exacta debe confirmarse contra convocatoria/junta vigente.

### Experiencia

```text
experiencia = RSU500(0|3)
            + electrica_automatizacion(0|1)
            + acero(0|1)
            + naves(0|1)
```

Estado: `REQUIERE_VALIDACION`, porque debe alimentarse con contratos y evidencia validados.

### Especialidad

```text
especialidad = diseno_construccion_arranque_500(0|2)
             + operacion_1825_dias(0|2)
             + OEM_3_MX_10_INT(0|2)
```

Estado: `REQUIERE_VALIDACION`, porque las referencias OEM deben validarse documentalmente.

### Precio máximo para objetivo competitivo

```text
precio_maximo = (50 * PSPMB) / (puntaje_objetivo - puntaje_tecnico)
```

Estado: `REQUIERE_VALIDACION`, porque asume que `PSPMB` permanece constante al cambiar el precio evaluado.

### Margen de seguridad

```text
margen_seguridad = precio_maximo_para_ganar - precio_actual
```

### Brechas y escenarios

```text
brecha_maxima = max(0, 50 - total_tecnico)
faltante_solvencia = max(0, 37.50 - total_tecnico)
avance_tecnico = min(100, (total_tecnico / 50) * 100)
valor_ajustado = valor_base * (1 + variacion_porcentual / 100)
brecha = max(0, puntaje_maximo - puntaje_actual)
puntaje_objetivo = puntaje_maximo * factor
diferencia = valor - base
```

Estas fórmulas se usan para cockpit y escenarios, pero se mantienen fuera de la capa de UI.

## Pruebas

Las pruebas viven en `tests/calculations/m1Calculations.test.js` y cubren:

- valores normales;
- cero;
- máximos;
- mínimos;
- números negativos;
- datos faltantes;
- extremos;
- divisiones entre cero;
- redondeos;
- límites de puntaje;
- reglas ambiguas marcadas como `REQUIERE_VALIDACION`.
