# Notas de implementación

## Fuente principal
Se construyó a partir del Método de Calificación M1 y del Acta de Fallo suministrados.

## Reglas directamente modeladas
- Técnica máxima: 50.
- Umbral técnico: 37.50.
- Calidad: 15.
- Capacidad: 17.
- Experiencia y especialidad: 15.
- Cumplimiento: 3.
- Económica: 50 para propuestas solventes.
- RRHH: 6 = experiencia 1 + preparación 4 + software 1, condicionado a plantilla mínima.
- Capacidad económica: 6 = capital de trabajo 4 + liquidez 1 + endeudamiento 1.
- Experiencia: 6 = RSU ≥500 t/d 3 + eléctrica/automatización 1 + acero 1 + naves 1.
- Especialidad: 6 = diseño/construcción/puesta en marcha ≥500 t/d 2 + operación reciente 2 + OEM 3 México/10 internacional 2.
- MIPYME: 0.5.
- Carta fabricante: 4.
- Carta CDR: 3.
- Discapacidad: 0.5.

## Interpretaciones operativas del motor
- RRHH/experiencia usa relación proporcional años acreditados / años objetivo porque el método habla de puntuación proporcional.
- Preparación académica se parametrizó: Licenciatura=2, Maestría=3, Doctorado=4. Antes de presentar oferta debe validarse contra la convocatoria/junta vigente.
- Discapacidad: el motor usa 5% como umbral para 0.5 en precalificación.
- Cumplimiento: el helper interno asigna 1 punto por referencia completa hasta 3; la matriz permite override manual.
- Calidad: el documento presenta máximos por subrubro; el fallo histórico muestra puntajes parciales en PROGONZA. Por ello el histórico se conserva exacto y Consorcio X puede usar manual override.

## Recomendación de uso
Usar el modo automático para identificar huecos y el override manual únicamente cuando el equipo jurídico/técnico haya confirmado cómo aplicará CONAGUA la proporcionalidad en la nueva convocatoria.
