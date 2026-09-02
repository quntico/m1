# Reglas globales

## Idioma

Responder siempre al usuario en español.

## Arquitectura

Mantener separación entre:

- UI
- business logic
- calculations
- connectors
- storage
- exports
- configuration

## Código

- No duplicar funciones.
- No escribir funciones enormes cuando puedan separarse.
- No modificar módulos no relacionados.
- Conservar backwards compatibility cuando sea posible.
- Antes de eliminar código, confirmar que ya no sea utilizado.

## Git

- Trabajar con commits pequeños y claros.
- Usar ramas feature/* para cambios grandes.
- main debe mantenerse estable.
- No hacer force push sin autorización.
- Documentar cambios relevantes en CHANGELOG.md.

## Seguridad

- No secretos en frontend.
- No credenciales en repositorio.
- Usar variables de entorno.
- Mantener .env en .gitignore.

## Datos

- Separar configuración de datos reales.
- Nunca sobreescribir datos del usuario sin respaldo.
- Antes de una migración crear backup.

## Calidad

Antes de completar una tarea:

- revisar errores;
- ejecutar pruebas;
- comprobar regresiones;
- verificar persistencia;
- verificar exportaciones.

## UX

No agregar controles sin propósito.
Mantener consistencia visual en toda la aplicación.

## Principio

Primero entender.
Después modificar.
Después probar.
Finalmente documentar.
