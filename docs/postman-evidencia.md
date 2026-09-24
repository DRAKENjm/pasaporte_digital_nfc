# Evidencia de pruebas con Postman

## Descripción

Para la validación del esquema de la API REST del sistema Pasaporte NFC, se utilizó Postman como herramienta de prueba funcional para ejecutar peticiones HTTP reales contra el backend del proyecto. Esta validación permitió comprobar la correcta implementación de los endpoints principales del servicio, así como la integridad de la comunicación cliente-servidor en un entorno operativo.

## Pruebas realizadas

Se ejecutaron pruebas de salud del sistema y de autenticación del usuario, incluyendo:

- Registro de usuarios
- Inicio de sesión
- Consulta del perfil autenticado
- Verificación de respuestas HTTP y JSON

## Evidencia técnica

### 1. Health Check

Endpoint: GET /health

Objetivo: verificar que el servidor está activo y disponible.

Resultado esperado: respuesta HTTP 200 con un estado correcto del sistema.

### 2. Registro de usuario

Endpoint: POST /api/auth/register

Objetivo: validar que el backend procesa correctamente nuevas solicitudes de registro.

Resultado esperado: respuesta HTTP 201 con confirmación de creación del usuario.

### 3. Login

Endpoint: POST /api/auth/login

Objetivo: comprobar la autenticación del usuario y la generación de un token JWT.

Resultado esperado: respuesta HTTP 200 con un token válido para acceso a recursos protegidos.

### 4. Perfil autenticado

Endpoint: GET /api/auth/profile

Objetivo: validar la autorización del usuario mediante la cabecera Authorization.

Resultado esperado: respuesta HTTP 200 con los datos del usuario autenticado.

## Texto formal para presentación

Para la validación del esquema de la API REST del sistema Pasaporte NFC, se empleó Postman como herramienta de prueba funcional para ejecutar peticiones HTTP reales contra el backend. Este proceso permitió verificar la correcta implementación de los endpoints principales del servicio, así como la integridad de la comunicación cliente-servidor en un entorno funcional.

Durante la ejecución de pruebas, se validó el estado del sistema mediante el endpoint de salud, evidenciando que el servidor responde correctamente y se encuentra disponible. Asimismo, se probaron las operaciones de registro y autenticación de usuarios, verificando que el endpoint de registro procesa correctamente los datos de entrada y que el endpoint de login genera un JWT válido como mecanismo de autenticación. Además, se comprobó la correcta autorización de acceso mediante la cabecera Authorization, validando el consumo del endpoint de perfil autenticado del usuario.

La utilización de Postman permitió confirmar que la API REST cumple con los requisitos de operación esperados, incluyendo manejo de respuestas HTTP, procesamiento de JSON, generación de tokens de sesión y control de acceso a recursos protegidos. Estos resultados demuestran que el esquema de la API está correctamente definido e implementado, y que el backend presenta un nivel de funcionamiento adecuado para su uso en pruebas y despliegue posterior.

## Observación

El archivo de colección de pruebas para Postman se encuentra en la ruta:

- docs/PasaporteNFC.postman_collection.json

Este archivo permite importar las pruebas en Postman y ejecutarlas directamente sobre la API del proyecto.
