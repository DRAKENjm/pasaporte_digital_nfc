# DOCUMENTACIÓN FORMAL — PASAPORTE DIGITAL NFC

---

## 1. PORTADA

- **Nombre del proyecto:** Pasaporte Digital NFC
- **Tipo de proyecto:** Plataforma de fidelización y experiencias mediante tecnología NFC
- **Empresa / equipo:** __________________________
- **Integrantes:** ________________________________
- **Fecha:** _____________________________________
- **Versión del documento:** 1.0 (Definición Formal)

---

## 2. RESUMEN EJECUTIVO

Pasaporte Digital es una plataforma de fidelización que conecta clientes con establecimientos afiliados mediante una tarjeta física NFC y una web app.

El cliente adquiere una tarjeta NFC, la cual se vincula a su cuenta dentro del sistema. A través de esta tarjeta puede registrar visitas en establecimientos afiliados, obtener puntos, acceder a recompensas y consultar su actividad desde una web app.

Los establecimientos disponen de un panel propio desde el cual pueden validar tarjetas NFC, registrar visitas, entregar puntos, gestionar recompensas y consultar estadísticas relacionadas únicamente con su negocio.

El administrador general controla el ecosistema completo, incluyendo clientes, establecimientos, tarjetas NFC, reglas de puntos, recompensas, canjes, métricas, reportes y auditoría.

---

## 3. PLANTEAMIENTO DEL PROBLEMA

Actualmente muchos establecimientos utilizan métodos de fidelización independientes, como tarjetas físicas, sellos, promociones aisladas o registros manuales.

Estos mecanismos presentan problemas como:
- Falta de integración entre diferentes establecimientos.
- Dificultad para conocer el comportamiento de los clientes.
- Poca trazabilidad de visitas y recompensas.
- Falta de herramientas para analizar recurrencia.
- Limitaciones en campañas de fidelización.
- Pérdida o deterioro de tarjetas tradicionales.
- Escasa interacción digital con los clientes.

El proyecto **Pasaporte Digital** busca resolver estos problemas mediante una plataforma centralizada apoyada en tecnología NFC.

---

## 4. OBJETIVO GENERAL

Desarrollar una plataforma digital de fidelización basada en tecnología NFC que permita conectar clientes con establecimientos afiliados, registrar visitas, administrar puntos y recompensas y generar información útil para la toma de decisiones.

---

## 5. OBJETIVOS ESPECÍFICOS

- Registrar y administrar clientes.
- Vincular tarjetas NFC con cuentas de clientes.
- Gestionar establecimientos afiliados.
- Registrar visitas mediante tecnología NFC.
- Asignar puntos según reglas configurables.
- Permitir al cliente consultar sus puntos e historial.
- Gestionar recompensas.
- Permitir solicitar y validar canjes.
- Generar estadísticas para establecimientos.
- Proporcionar métricas globales al administrador.
- Implementar notificaciones en tiempo real.
- Mantener trazabilidad de las operaciones realizadas.
- Implementar roles y permisos de acceso.

---

## 6. ALCANCE DEL SISTEMA

### 6.1 Web App del Cliente
Permitirá:
- Iniciar sesión.
- Consultar su Pasaporte Digital.
- Consultar puntos.
- Revisar visitas.
- Explorar establecimientos afiliados.
- Consultar recompensas.
- Solicitar canjes.
- Consultar historial de canjes.
- Consultar actividad.
- Administrar datos básicos de su cuenta.
- Consultar el estado de su tarjeta NFC.
- Recibir notificaciones.

### 6.2 Panel del Establecimiento
Permitirá:
- Iniciar sesión.
- Validar tarjetas NFC.
- Identificar clientes.
- Registrar visitas.
- Registrar operaciones.
- Asignar puntos.
- Consultar clientes atendidos.
- Consultar historial de operaciones.
- Gestionar recompensas correspondientes al establecimiento.
- Consultar canjes pendientes.
- Confirmar entrega de recompensas.
- Consultar estadísticas del establecimiento.

### 6.3 Panel del Administrador General
Permitirá:
- Gestionar usuarios.
- Gestionar clientes.
- Gestionar establecimientos.
- Gestionar tarjetas NFC.
- Gestionar reglas de puntos.
- Gestionar recompensas.
- Gestionar y supervisar canjes.
- Gestionar categorías de establecimientos.
- Consultar actividad global.
- Consultar reportes.
- Consultar métricas.
- Gestionar estados del sistema.
- Consultar auditoría.
- Gestionar incidencias.

---

## 7. ACTORES DEL SISTEMA

- **Cliente:** Usuario que adquiere una tarjeta NFC y utiliza el Pasaporte Digital.
- **Trabajador del establecimiento:** Usuario autorizado para registrar visitas, validar tarjetas y confirmar operaciones.
- **Administrador del establecimiento:** Usuario responsable de administrar la información y estadísticas de su establecimiento.
- **Administrador general:** Usuario encargado de administrar todo el ecosistema.
- **Sistema:** Responsable de validar reglas, permisos, estados, puntos, recompensas y operaciones.

---

## 8. ROLES Y PERMISOS

- **Cliente:** Puede acceder únicamente a su información personal, puntos, visitas, recompensas y canjes.
- **Trabajador del establecimiento:** Puede registrar operaciones correspondientes únicamente al establecimiento al que pertenece.
- **Administrador del establecimiento:** Puede visualizar información, trabajadores, recompensas, clientes y estadísticas de su establecimiento.
- **Administrador general:** Puede visualizar y administrar toda la plataforma.

---

## 9. FUNCIONAMIENTO GENERAL

```
Cliente compra tarjeta NFC
       ↓
Se registra al cliente
       ↓
Se vincula la tarjeta NFC
       ↓
Se activa la cuenta
       ↓
Cliente accede a la Web App
       ↓
Cliente visita un establecimiento afiliado
       ↓
Presenta tarjeta NFC
       ↓
Lector NFC identifica la tarjeta
       ↓
Sistema valida cliente, tarjeta y establecimiento
       ↓
Establecimiento registra la operación
       ↓
Sistema calcula puntos
       ↓
Trabajador confirma
       ↓
Se registra la visita
       ↓
Se generan movimientos de puntos
       ↓
Se actualiza el saldo
       ↓
Cliente recibe notificación
       ↓
Se actualizan estadísticas del establecimiento
       ↓
Se actualizan métricas administrativas
```

---

## 10. PROCESO DE REGISTRO Y ACTIVACIÓN NFC

1. El cliente compra una tarjeta NFC.
2. Personal autorizado registra los datos del cliente.
3. El sistema comprueba si el cliente ya existe.
4. Se registra o recupera su cuenta.
5. Se lee el identificador correspondiente a la tarjeta NFC.
6. El sistema verifica que la tarjeta se encuentre disponible.
7. La tarjeta se vincula al cliente.
8. Se cambia su estado a activa.
9. Se genera el acceso del cliente.
10. El cliente configura sus credenciales.
11. El cliente puede ingresar a la web app.

---

## 11. PROCESO DE REGISTRO DE VISITA

1. El cliente llega a un establecimiento afiliado.
2. Presenta su tarjeta NFC.
3. El establecimiento lee la tarjeta.
4. El sistema identifica al cliente.
5. Se verifica que la tarjeta esté activa.
6. Se verifica que el cliente esté activo.
7. Se verifica que el establecimiento esté afiliado y activo.
8. Se muestran los datos básicos del cliente.
9. El trabajador registra la operación.
10. El sistema calcula los puntos.
11. Se validan las reglas de negocio.
12. El trabajador confirma la operación.
13. Se registra la visita.
14. Se registra el movimiento de puntos.
15. Se actualiza el saldo.
16. Se actualiza el historial.
17. Se notifica al cliente.

---

## 12. PROCESO DE RECOMPENSAS

El administrador podrá crear recompensas definiendo:
- Nombre.
- Descripción.
- Imagen.
- Puntos requeridos.
- Establecimiento donde aplica.
- Fecha de inicio.
- Fecha de vencimiento.
- Stock.
- Límites de uso.
- Estado.
- Condiciones.

El cliente podrá consultar aquellas recompensas para las que cumpla las condiciones.

---

## 13. PROCESO DE CANJE

1. El cliente selecciona una recompensa.
2. El sistema verifica que esté activa.
3. Se valida la vigencia.
4. Se valida el saldo del cliente.
5. Se valida el stock.
6. Se verifican límites de uso.
7. Se genera una solicitud de canje.
8. Los puntos quedan reservados.
9. El estado del canje pasa a pendiente.
10. El cliente se presenta en el establecimiento.
11. El establecimiento valida el canje.
12. Se entrega la recompensa.
13. El trabajador confirma la entrega.
14. Los puntos se descuentan definitivamente.
15. Se actualiza el stock.
16. El canje pasa a estado canjeado.
17. Se actualiza el historial.
18. Se actualizan las estadísticas.

---

## 14. REGLAS DE NEGOCIO

- **RN-01:** Solo usuarios activos podrán iniciar sesión.
- **RN-02:** Cada usuario accederá únicamente a las funciones permitidas por su rol.
- **RN-03:** Una tarjeta NFC activa deberá pertenecer únicamente a un cliente.
- **RN-04:** Una tarjeta NFC no podrá ser activada simultáneamente para dos clientes.
- **RN-05:** Las tarjetas bloqueadas, perdidas o reemplazadas no podrán generar operaciones.
- **RN-06:** Solo establecimientos afiliados y activos podrán registrar visitas y entregar puntos.
- **RN-07:** Un trabajador solo podrá registrar operaciones para su propio establecimiento.
- **RN-08:** Toda entrega de puntos deberá estar vinculada a una operación válida.
- **RN-09:** El sistema deberá prevenir operaciones duplicadas.
- **RN-10:** Los límites diarios de visitas o puntos deberán ser configurables.
- **RN-11:** Un cliente no podrá solicitar una recompensa si no dispone de puntos suficientes.
- **RN-12:** Una recompensa deberá encontrarse activa y vigente para ser canjeada.
- **RN-13:** Si una recompensa posee stock, deberá existir disponibilidad.
- **RN-14:** Los límites de canje deberán poder configurarse por recompensa.
- **RN-15:** Un mismo canje pendiente no podrá utilizarse más de una vez.
- **RN-16:** Solo establecimientos autorizados podrán confirmar la entrega de determinadas recompensas.
- **RN-17:** Toda modificación de puntos deberá generar un movimiento.
- **RN-18:** Los puntos no deberán modificarse manualmente sin dejar trazabilidad.
- **RN-19:** Toda anulación deberá registrar usuario, fecha, hora y motivo.
- **RN-20:** El administrador podrá bloquear usuarios, establecimientos o tarjetas.
- **RN-21:** Un establecimiento no podrá consultar información privada correspondiente a otros establecimientos.
- **RN-22:** Las operaciones sensibles deberán quedar registradas en auditoría.

---

## 15. ESTADOS PRINCIPALES

### Usuario
- Activo
- Bloqueado
- Inactivo

### Establecimiento
- Pendiente
- Activo
- Suspendido
- Inactivo

### Tarjeta NFC
- Disponible
- Activa
- Bloqueada
- Perdida
- Dañada
- Reemplazada

### Visita
- Pendiente
- Confirmada
- Anulada

### Recompensa
- Borrador
- Activa
- Inactiva
- Vencida

### Canje
- Pendiente
- Canjeado
- Cancelado
- Vencido

---

## 16. REQUISITOS FUNCIONALES

- **RF-01:** El sistema deberá permitir registrar clientes.
- **RF-02:** El sistema deberá permitir iniciar sesión.
- **RF-03:** El sistema deberá validar los permisos según el rol.
- **RF-04:** El sistema deberá permitir registrar tarjetas NFC.
- **RF-05:** El sistema deberá permitir vincular una tarjeta con un cliente.
- **RF-06:** El sistema deberá permitir bloquear tarjetas.
- **RF-07:** El establecimiento deberá poder leer una tarjeta NFC.
- **RF-08:** El sistema deberá identificar al cliente mediante su tarjeta.
- **RF-09:** El establecimiento deberá poder registrar visitas.
- **RF-10:** El sistema deberá calcular puntos automáticamente.
- **RF-11:** El cliente deberá poder consultar su saldo.
- **RF-12:** El cliente deberá poder consultar su historial.
- **RF-13:** El cliente deberá poder consultar establecimientos afiliados.
- **RF-14:** El administrador deberá poder registrar establecimientos.
- **RF-15:** El administrador deberá poder gestionar recompensas.
- **RF-16:** El cliente deberá poder solicitar un canje.
- **RF-17:** El establecimiento deberá poder confirmar un canje.
- **RF-18:** El sistema deberá gestionar stock de recompensas cuando corresponda.
- **RF-19:** El sistema deberá registrar movimientos de puntos.
- **RF-20:** El sistema deberá generar reportes y estadísticas.
- **RF-21:** El sistema deberá enviar notificaciones.
- **RF-22:** El sistema deberá registrar operaciones sensibles en auditoría.

---

## 17. REQUISITOS NO FUNCIONALES

- **Seguridad:** El sistema deberá proteger credenciales, sesiones y operaciones sensibles.
- **Rendimiento:** Las operaciones principales deberán procesarse con baja latencia.
- **Disponibilidad:** La plataforma deberá encontrarse disponible durante los horarios de operación de los establecimientos.
- **Usabilidad:** Las interfaces deberán ser simples, intuitivas y responsive.
- **Escalabilidad:** La arquitectura deberá permitir incorporar nuevos clientes y establecimientos.
- **Compatibilidad:** La web app deberá funcionar correctamente en navegadores modernos.
- **Trazabilidad:** Las operaciones importantes deberán mantener historial.
- **Tiempo real:** Los cambios relevantes deberán reflejarse rápidamente en las interfaces involucradas.

---

## 18. CASOS DE USO PRINCIPALES

- **CU-01:** Registrar cliente
- **CU-02:** Iniciar sesión
- **CU-03:** Recuperar acceso
- **CU-04:** Activar tarjeta NFC
- **CU-05:** Bloquear tarjeta NFC
- **CU-06:** Reemplazar tarjeta NFC
- **CU-07:** Explorar establecimientos
- **CU-08:** Consultar puntos
- **CU-09:** Consultar historial
- **CU-10:** Registrar visita
- **CU-11:** Asignar puntos
- **CU-12:** Crear recompensa
- **CU-13:** Consultar recompensas
- **CU-14:** Solicitar canje
- **CU-15:** Validar canje
- **CU-16:** Confirmar entrega de recompensa
- **CU-17:** Cancelar canje
- **CU-18:** Gestionar establecimiento
- **CU-19:** Gestionar usuarios del establecimiento
- **CU-20:** Gestionar reglas de puntos
- **CU-21:** Gestionar programa de sellos e identidad del sello
- **CU-22:** Gestionar trabajadores del establecimiento
- **CU-23:** Gestionar sucursales del establecimiento
- **CU-24:** Reponer / reemplazar tarjeta NFC
- **CU-25:** Consultar métricas
- **CU-26:** Generar reportes
- **CU-27:** Consultar auditoría

---

## 19. ESTRUCTURA DE CADA CASO DE USO

```
Código: CU-XX
Nombre: __________________________
Actor principal: _________________
Actores secundarios: _____________
Descripción: _____________________
Precondiciones: __________________
Postcondiciones: _________________

Flujo principal:
1. __________________________
2. __________________________
3. __________________________

Flujos alternativos:
A1. _________________________
A2. _________________________

Excepciones:
E1. _________________________

Reglas relacionadas:
RN-XX, RN-XX
```

---

## 20. NOTIFICACIONES

El sistema deberá gestionar notificaciones mediante correo electrónico y notificaciones push.

### Eventos principales:
- **Cuenta creada:** Correo electrónico.
- **Tarjeta NFC activada:** Correo y push.
- **Puntos recibidos:** Push.
- **Canje solicitado:** Push.
- **Canje confirmado:** Push y correo.
- **Canje próximo a vencer:** Push.
- **Recompensa disponible:** Push.
- **Tarjeta bloqueada:** Correo y push.
- **Recuperación de contraseña:** Correo.
- **Actividad sospechosa:** Correo y/o notificación administrativa.

---

## 21. FLUJO EN TIEMPO REAL

```
Establecimiento confirma visita
       ↓
Backend procesa la operación
       ↓
Base de datos registra visita
       ↓
Se crea movimiento de puntos
       ↓
Saldo actualizado
       ↓
Web App del cliente se actualiza
       ↓
Cliente recibe notificación
       ↓
Dashboard del local actualiza estadísticas
       ↓
Administrador recibe datos agregados
```

---

## 22. MÓDULOS DEL CLIENTE

- Inicio.
- Explorar.
- Recibir sello / registrar experiencia.
- Puntos.
- Mis recompensas.
- Historial.
- Actividad.
- Perfil.
- Información de tarjeta NFC.
- Notificaciones.

---

## 23. MÓDULOS DEL ESTABLECIMIENTO

- Dashboard.
- Validar visita.
- Clientes.
- Historial.
- Puntos.
- Recompensas.
- Canjes pendientes.
- Canjes realizados.
- Estadísticas.
- Trabajadores.
- Configuración.

---

## 24. MÓDULOS DEL ADMINISTRADOR GENERAL

- Dashboard.
- Clientes.
- Establecimientos.
- Usuarios.
- Tarjetas NFC.
- Visitas.
- Puntos.
- Recompensas.
- Canjes.
- Categorías.
- Reportes.
- Métricas.
- Auditoría.
- Configuración.

---

## 25. MODELO DE DATOS — NIVEL CONCEPTUAL

### 25.1. Lista de Entidades Candidatas y Responsabilidades

1. **USUARIO:**
   - Representa a cualquier persona con credenciales y acceso al sistema (`CLIENTE`, `TRABAJADOR_LOCAL`, `ADMIN_LOCAL`, `ADMIN_GENERAL`).
   - Responsabilidades: Autenticación, control de acceso, estado de cuenta.

2. **ROL:**
   - Define los permisos y alcance operativo en la plataforma.
   - Responsabilidades: Tipificar las facultades de cada usuario (`ROL 1 ── N USUARIO`).

3. **CLIENTE:**
   - Representa al consumidor titular que adquiere la tarjeta NFC y utiliza el Pasaporte Digital.
   - Relaciona el perfil con su pasaporte, visitas, sellos, historial de puntos y canjes.

4. **TARJETA_NFC:**
   - Representa el soporte físico inteligente (chip NFC / UID).
   - Estados: `Disponible`, `Activa`, `Bloqueada`, `Perdida`, `Dañada`, `Reemplazada`.
   - Regla especial: Un cliente puede tener un historial de muchas tarjetas, pero **solo una activa** en un momento dado (`CLIENTE 1 ── N TARJETA_NFC`).

5. **ESTABLECIMIENTO:**
   - Representa la marca o empresa comercial afiliada a la red de fidelización (ej. *Aroma Café*, *Barbería X*).
   - Responsabilidades: Posee programas de fidelización, reglas de negocio y recompensas.

6. **SUCURSAL:**
   - Representa la sede física u operativa específica donde el cliente acude presencialmente.
   - Cardinalidad: `ESTABLECIMIENTO 1 ── N SUCURSAL`.
   - Desacoplamiento clave: La visita y lectura NFC ocurren físicamente en una sucursal determinada.

7. **USUARIO_SUCURSAL:**
   - Entidad asociativa para gobernar la dotación de personal: asigna trabajadores y administradores locales a una o varias sucursales (`USUARIO N ── M SUCURSAL`).
   - Almacena permisos de sede, estado y fechas de asignación.

8. **PROGRAMA_SELLOS:**
   - Define las reglas y metas del programa de fidelización del establecimiento (ej. meta: 5 sellos; equivalencia: 1 sello = 20 puntos; límites de frecuencia y vigencia).
   - Permite conservar programas históricos y versionados (`ESTABLECIMIENTO 1 ── N PROGRAMA_SELLOS`).

9. **DISEÑO_SELLO:**
   - Identidad visual e iconográfica del sello digital que se estampa en el pasaporte.
   - Almacena: Imagen/SVG, logo de marca, color de tinta HEX, nombre distintivo y mensaje (`PROGRAMA_SELLOS 1 ── 1 DISEÑO_SELLO`).

10. **VISITA:**
    - Entidad transaccional central: certifica la presencia física válida del cliente mediante lectura NFC en una sucursal específica, validada por un operador autorizado.
    - Relaciones: `CLIENTE 1 ── N VISITA`, `SUCURSAL 1 ── N VISITA`.
    - Desencadena: la acreditación de sellos digitales y movimientos de puntos.

11. **SELLO_DIGITAL:**
    - Registro inmutable de cada sello individual obtenido por el cliente en su pasaporte (Sello #N, fecha/hora, local, programa asociado).
    - Cardinalidad: `VISITA 1 ── 0..N SELLO_DIGITAL` (normalmente 1, ampliable a campañas especiales) y `CLIENTE 1 ── N SELLO_DIGITAL`.

12. **MOVIMIENTO_PUNTOS:**
    - Libro mayor (ledger) inmutable que audita cada entrada o salida de puntos del cliente.
    - Tipos: Ganancia por visita/sello, Bonificación, Canje (reserva/débito), Reversión, Ajuste manual autorizado, Devolución.
    - Cardinalidad: `CLIENTE 1 ── N MOVIMIENTO_PUNTOS`, `VISITA 1 ── 0..N MOVIMIENTO_PUNTOS`.

13. **REGLA_PUNTOS:**
    - Parámetros configurables de acreditación de puntaje por establecimiento o programa (ej. 20 puntos por sello, bonos por consumo, topes diarios).
    - Cardinalidad: `PROGRAMA_SELLOS 1 ── N REGLA_PUNTOS`.

14. **RECOMPENSA:**
    - Catálogo de beneficios, productos o experiencias canjeables por puntos.
    - Atributos: Puntos requeridos, stock disponible, fechas de vigencia, límite de canjes por cliente y estado.

15. **RECOMPENSA_SUCURSAL:**
    - Entidad asociativa que parametriza la disponibilidad de una recompensa por sedes físicas (`RECOMPENSA N ── M SUCURSAL`), permitiendo recompensas exclusivas por sede o de validez multi-sucursal.

16. **CANJE:**
    - Solicitud formal y ciclo de redención de una recompensa por parte del cliente.
    - Estados: `Pendiente`, `Canjeado`, `Cancelado`, `Vencido`.
    - Cardinalidades: `CLIENTE 1 ── N CANJE`, `RECOMPENSA 1 ── N CANJE`.

17. **NOTIFICACION:**
    - Mensajería transaccional enviada al usuario ante eventos clave (puntos ganados, canje emitido/validado, bloqueos de seguridad).
    - Canales: Push, Correo electrónico, Bandeja interna (`USUARIO 1 ── N NOTIFICACION`).

18. **AUDITORIA:**
    - Registro de inmutabilidad y seguridad sobre operaciones críticas (bloqueo de tarjetas, anulaciones de visitas, ajustes de puntos, cambios en recompensas) con operador, timestamp, IP y motivo.
    - Cardinalidad: `USUARIO 1 ── N REGISTROS_AUDITORIA`.

---

### 25.2. Mapa de Relaciones Conceptuales

```
ROL 1 ────────────────────────────── N USUARIO
USUARIO 1 ────────────────────────── 0..1 CLIENTE
USUARIO N ────────────────────────── M SUCURSAL  (vía USUARIO_SUCURSAL)

CLIENTE 1 ────────────────────────── N TARJETA_NFC (Exactamente 1 Activa)
CLIENTE 1 ────────────────────────── N VISITA
CLIENTE 1 ────────────────────────── N SELLO_DIGITAL
CLIENTE 1 ────────────────────────── N MOVIMIENTO_PUNTOS
CLIENTE 1 ────────────────────────── N CANJE

ESTABLECIMIENTO 1 ────────────────── N SUCURSAL
ESTABLECIMIENTO 1 ────────────────── N PROGRAMA_SELLOS
PROGRAMA_SELLOS 1 ────────────────── 1 DISEÑO_SELLO
PROGRAMA_SELLOS 1 ────────────────── N REGLA_PUNTOS

SUCURSAL 1 ───────────────────────── N VISITA
RECOMPENSA N ─────────────────────── M SUCURSAL  (vía RECOMPENSA_SUCURSAL)

VISITA 1 ─────────────────────────── 0..N SELLO_DIGITAL
VISITA 1 ─────────────────────────── 0..N MOVIMIENTO_PUNTOS

RECOMPENSA 1 ─────────────────────── N CANJE

USUARIO 1 ────────────────────────── N NOTIFICACION
USUARIO 1 ────────────────────────── N AUDITORIA
```

---

### 25.3. Principios Arquitectónicos Protegidos en el Modelo

1. **La cuenta no depende de la tarjeta física:** El saldo, historial, nivel y sellos pertenecen al `CLIENTE`. La pérdida o reemplazo de la tarjeta NFC no altera su patrimonio de puntos ni su pasaporte.
2. **Los puntos no dependen rígidamente del sello:** Un cliente puede acumular puntos por sellos, pero también por bonos, promociones o ajustes sin corromper la entidad del sello digital.
3. **El sello nace de una visita física válida:** No existe sello flotante; cada sello proviene de una `VISITA` validada en una `SUCURSAL` por un operador autorizado.
4. **Desacoplamiento multisede:** Las recompensas y las operaciones soportan tanto negocios de una sola sede como cadenas con múltiples sucursales sin duplicar catálogos.
5. **Trazabilidad e inmutabilidad contable:** Todo cambio en los puntos se audita a través de un `MOVIMIENTO_PUNTOS` tipo libro mayor (ledger), eliminando saldos mutados a ciegas.

---

### 25.4. Modelo Lógico Normalizado por Bloques Funcionales

Conforme a las reglas de normalización y depuración de redundancias, el modelo lógico se organiza en **7 bloques funcionales**:

---

#### BLOQUE 1: IDENTIDAD Y ACCESO

1. **`ROL`**
   - **PK:** `id_rol`
   - **Atributos:** `nombre` (UNIQUE: 'CLIENTE', 'TRABAJADOR_LOCAL', 'ADMIN_LOCAL', 'ADMIN_GENERAL'), `descripcion`
   - **Relación:** 1 a N con `USUARIO`.

2. **`USUARIO`**
   - **PK:** `id_usuario`
   - **FK:** `id_rol` → `ROL(id_rol)`
   - **Atributos:** `email` (UNIQUE), `password_hash`, `nombres`, `apellidos`, `telefono`, `estado` ('ACTIVO', 'BLOQUEADO', 'INACTIVO'), `fecha_creacion`, `ultimo_acceso`
   - **Relación:** 1 a 0..1 con `CLIENTE`; 1 a N con `USUARIO_SUCURSAL`, `NOTIFICACION`, `AUDITORIA`.

3. **`CLIENTE`** (Extensión / Especialización de Usuario)
   - **PK:** `id_cliente`
   - **FK / UNIQUE:** `id_usuario` → `USUARIO(id_usuario)` (Relación 1 a 1 estricta)
   - **Atributos:** `fecha_registro`
   - *Nota de normalización:* El saldo de puntos **no** es un campo mutable oficial de verdad absoluta; el saldo canjeable se calcula y concilia como la suma algebraica derivada del libro mayor (`MOVIMIENTO_PUNTOS`). Se puede mantener una columna `saldo_puntos_cache` únicamente como caché de lectura indexada.

---

#### BLOQUE 2: ESTABLECIMIENTOS Y SUCURSALES

4. **`ESTABLECIMIENTO`** (Entidad Matriz / Marca)
   - **PK:** `id_establecimiento`
   - **Atributos:** `nombre_comercial`, `razon_social`, `ruc_identificador`, `email_contacto`, `telefono_contacto`, `estado`, `fecha_creacion`
   - **Relación:** 1 a N con `SUCURSAL`, `PROGRAMA_SELLOS`, `RECOMPENSA`.

5. **`SUCURSAL`** (Sede Física Presencial)
   - **PK:** `id_sucursal`
   - **FK:** `id_establecimiento` → `ESTABLECIMIENTO(id_establecimiento)`
   - **Atributos:** `nombre_sucursal`, `direccion`, `latitud`, `longitud`, `telefono`, `horario_atencion`, `estado`
   - **Relación:** 1 a N con `USUARIO_SUCURSAL`, `VISITA`, `RECOMPENSA_SUCURSAL`, `CANJE`.

6. **`USUARIO_SUCURSAL`** (Dotación de Personal por Sede)
   - **PK compuesta:** (`id_usuario`, `id_sucursal`)
   - **FK:** `id_usuario` → `USUARIO(id_usuario)`
   - **FK:** `id_sucursal` → `SUCURSAL(id_sucursal)`
   - **Atributos:** `cargo_puesto`, `estado` ('ACTIVO', 'INACTIVO'), `fecha_asignacion`

---

#### BLOQUE 3: HARDWARE Y SEGURIDAD NFC

7. **`TARJETA_NFC`**
   - **PK:** `id_tarjeta`
   - **FK:** `id_cliente` → `CLIENTE(id_cliente)` (nullable mientras esté en stock disponible)
   - **Atributos:** `uid_nfc` (UNIQUE), `qr_respaldo` (UNIQUE), `estado` ('DISPONIBLE', 'ACTIVA', 'BLOQUEADA', 'PERDIDA', 'DAÑADA', 'REEMPLAZADA'), `fecha_vinculacion`, `fecha_actualizacion`
   - **Restricción de Negocio:** Un cliente solo puede tener **una** tarjeta en estado `'ACTIVA'` simultáneamente (`CREATE UNIQUE INDEX ON tarjetas_nfc (id_cliente) WHERE estado = 'ACTIVA'`).

8. **`HISTORIAL_TARJETA_NFC`** (Auditoría de Reemplazos y Estados)
   - **PK:** `id_historial_tarjeta`
   - **FK:** `id_tarjeta` → `TARJETA_NFC(id_tarjeta)`
   - **FK:** `id_usuario_operador` → `USUARIO(id_usuario)` (Quién ejecutó el cambio)
   - **Atributos:** `estado_anterior`, `estado_nuevo`, `motivo` (ej. 'EXTRAVIO', 'ROBO', 'DETERIORO_CHIP', 'ACTIVACION_INICIAL', 'REEMPLAZO_POR_NUEVA'), `fecha_cambio`

---

#### BLOQUE 4: PROGRAMA DE FIDELIZACIÓN Y PUNTOS

9. **`PROGRAMA_SELLOS`**
   - **PK:** `id_programa`
   - **FK:** `id_establecimiento` → `ESTABLECIMIENTO(id_establecimiento)`
   - **Atributos:** `nombre_programa`, `meta_sellos`, `max_sellos_por_dia`, `vigencia_desde`, `vigencia_hasta`, `estado` ('ACTIVO', 'INACTIVO', 'HISTORICO'),
     *Identidad visual integrada (MVP):* `sello_nombre`, `sello_icono_url`, `sello_color_hex`, `sello_mensaje`
   - *Nota de normalización:* Los puntos por sello se delegan a `REGLA_PUNTOS` para evitar doble fuente de verdad. El diseño del sello se consolida dentro de esta entidad para máxima eficiencia del MVP.

10. **`REGLA_PUNTOS`**
    - **PK:** `id_regla`
    - **FK:** `id_programa` → `PROGRAMA_SELLOS(id_programa)`
    - **Atributos:** `tipo_regla` ('PUNTOS_POR_SELLO', 'BONO_CONSUMO', 'DOBLE_PUNTAJE_CAMPANA', 'TOPE_DIARIO'), `valor_puntos`, `condicion_monto_minimo`, `descripcion`, `activa`

11. **`MOVIMIENTO_PUNTOS`** (Ledger Contable de Puntos)
    - **PK:** `id_movimiento`
    - **FK:** `id_cliente` → `CLIENTE(id_cliente)`
    - **FK (opcional):** `id_visita` → `VISITA(id_visita)`
    - **FK (opcional):** `id_canje` → `CANJE(id_canje)`
    - **Atributos:** `tipo_movimiento` ('GANANCIA_VISITA', 'BONIFICACION', 'RESERVA_CANJE', 'DEBITO_CANJE', 'REVERSION_CANJE', 'AJUSTE_ADMIN', 'DEVOLUCION'), `cantidad_puntos` (positivo o negativo), `saldo_resultante`, `descripcion_concepto`, `fecha_hora`

---

#### BLOQUE 5: VISITA Y SELLO DIGITAL

12. **`VISITA`** (Transacción Central Confirmada por Trabajador)
    - **PK:** `id_visita`
    - **FK:** `id_cliente` → `CLIENTE(id_cliente)`
    - **FK:** `id_tarjeta` → `TARJETA_NFC(id_tarjeta)`
    - **FK:** `id_sucursal` → `SUCURSAL(id_sucursal)`
    - **FK:** `id_usuario_validador` → `USUARIO(id_usuario)` (Trabajador que confirma la presencia)
    - **Atributos:** `fecha_hora`, `monto_consumo` (opcional), `estado` ('CONFIRMADA', 'ANULADA'), `motivo_anulacion`
    - *Regla:* La visita es un evento explícitamente confirmado por el trabajador en caja/recepción tras lectura de la tarjeta física, nunca una lectura pasiva desatendida.

13. **`SELLO_DIGITAL`** (Estampado Inmutable)
    - **PK:** `id_sello`
    - **FK:** `id_visita` → `VISITA(id_visita)`
    - **FK:** `id_programa` → `PROGRAMA_SELLOS(id_programa)`
    - **Atributos:** `numero_orden_en_meta` (ej. 1 de 5), `fecha_emision`
    - *Nota de normalización:* Se suprime `id_cliente` de esta tabla porque ya se deriva directamente de `VISITA`, garantizando la 3ª Forma Normal (3FN) y evitando riesgo de discrepancias.

---

#### BLOQUE 6: RECOMPENSAS Y CANJES

14. **`RECOMPENSA`**
    - **PK:** `id_recompensa`
    - **FK:** `id_establecimiento` → `ESTABLECIMIENTO(id_establecimiento)`
    - **Atributos:** `titulo`, `descripcion`, `imagen_url`, `puntos_requeridos`, `stock_disponible`, `limite_por_cliente`, `vigencia_desde`, `vigencia_hasta`, `estado` ('BORRADOR', 'ACTIVA', 'INACTIVA', 'AGOTADA')

15. **`RECOMPENSA_SUCURSAL`** (Disponibilidad Geográfica)
    - **PK compuesta:** (`id_recompensa`, `id_sucursal`)
    - **FK:** `id_recompensa` → `RECOMPENSA(id_recompensa)`
    - **FK:** `id_sucursal` → `SUCURSAL(id_sucursal)`
    - **Atributos:** `disponible` (BOOLEAN)

16. **`CANJE`**
    - **PK:** `id_canje`
    - **FK:** `id_cliente` → `CLIENTE(id_cliente)`
    - **FK:** `id_recompensa` → `RECOMPENSA(id_recompensa)`
    - **FK (opcional al inicio):** `id_sucursal` → `SUCURSAL(id_sucursal)` (nullable al solicitar, se fija al presentarse físicamente a redimir)
    - **FK (opcional):** `id_usuario_entrega` → `USUARIO(id_usuario)` (Trabajador que entrega la recompensa)
    - **Atributos:** `codigo_validacion_qr_pin`, `puntos_costo_historico` (copia congelada de los puntos exigidos al momento del canje, protegiendo al cliente si la recompensa cambia de valor posteriormente), `estado` ('PENDIENTE', 'CANJEADO', 'CANCELADO', 'VENCIDO'), `fecha_solicitud`, `fecha_entrega`, `fecha_vencimiento`

---

#### BLOQUE 7: NOTIFICACIÓN Y AUDITORÍA

17. **`NOTIFICACION`**
    - **PK:** `id_notificacion`
    - **FK:** `id_usuario` → `USUARIO(id_usuario)`
    - **Atributos:** `canal` ('PUSH', 'EMAIL', 'INTERNA'), `tipo_evento` ('PUNTOS_RECIBIDOS', 'CANJE_SOLICITADO', 'CANJE_ENTREGADO', 'TARJETA_BLOQUEADA', 'SEGURIDAD'), `titulo`, `mensaje`, `leida` (BOOLEAN), `fecha_envio`

18. **`AUDITORIA`** (Bitácora de Operaciones Sensibles)
    - **PK:** `id_auditoria`
    - **FK:** `id_usuario` → `USUARIO(id_usuario)` (Operador responsable)
    - **Atributos:** `accion_operacion` ('BLOQUEO_TARJETA', 'REEMPLAZO_TARJETA', 'ANULACION_VISITA', 'AJUSTE_PUNTOS', 'MODIFICACION_RECOMPENSA'), `tabla_afectada`, `registro_id_afectado`, `valores_anteriores_json`, `valores_nuevos_json`, `ip_origen`, `motivo_justificacion`, `fecha_hora`

---

### 25.5. Modelo Físico — Definición de Tablas, Columnas y Tipos de Datos (PostgreSQL)

En esta fase se materializan los tipos de datos nativos de PostgreSQL (UUID v4, VARCHAR, TEXT, INT, BOOLEAN, TIMESTAMP WITH TIME ZONE, JSONB), llaves primarias, llaves foráneas e índices de integridad:

#### 1. `roles`
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `nombre` | `VARCHAR(50)` | `UNIQUE NOT NULL` ('CLIENTE', 'TRABAJADOR_LOCAL', 'ADMIN_LOCAL', 'ADMIN_GENERAL') |
| `descripcion` | `TEXT` | Descripción de las facultades del rol |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |

#### 2. `configuracion_sistema` (Parámetros Globales y Marca Pasaporte Digital)
*Aísla la identidad de la plataforma de los usuarios y de los establecimientos afiliados.*
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `clave` | `VARCHAR(60)` | `UNIQUE NOT NULL` (ej. 'PLATFORM_LOGO_URL', 'PLATFORM_NAME', 'SUPPORT_EMAIL') |
| `valor` | `TEXT` | `NOT NULL` |
| `descripcion` | `VARCHAR(255)` | Descripción del parámetro de configuración |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |

#### 3. `usuarios`
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `rol_id` | `UUID` | `NOT NULL REFERENCES roles(id) ON DELETE RESTRICT` |
| `email` | `VARCHAR(150)` | `UNIQUE NOT NULL` |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` |
| `nombres` | `VARCHAR(100)` | `NOT NULL` |
| `apellidos` | `VARCHAR(100)` | `NOT NULL` |
| `telefono` | `VARCHAR(30)` | Teléfono móvil de contacto |
| `avatar_url` | `TEXT` | Foto de perfil opcional |
| `estado` | `VARCHAR(20)` | `DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'BLOQUEADO', 'INACTIVO'))` |
| `ultimo_acceso` | `TIMESTAMPTZ` | Registro de última sesión |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |

#### 4. `clientes` (Extensión Pura 1 a 1 de Usuario)
*No almacena saldo mutable como dato oficial; el saldo se deriva de `movimientos_puntos`.*
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `usuario_id` | `UUID` | `UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE` |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |

#### 5. `establecimientos` (Entidad Matriz / Marca)
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `nombre_comercial` | `VARCHAR(150)` | `NOT NULL` |
| `razon_social` | `VARCHAR(150)` | `NOT NULL` |
| `ruc` | `VARCHAR(11)` | `UNIQUE NOT NULL` |
| `descripcion` | `TEXT` | Reseña o descripción del establecimiento |
| `logo_url` | `TEXT` | Logotipo oficial de la marca del local |
| `portada_url` | `TEXT` | Imagen de portada o banner comercial |
| `email_contacto` | `VARCHAR(150)` | `NOT NULL` |
| `telefono_contacto` | `VARCHAR(30)` | Teléfono de contacto central |
| `estado` | `VARCHAR(20)` | `DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO'))` |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |

#### 6. `sucursales` (Sedes Presenciales del Establecimiento)
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `establecimiento_id`| `UUID` | `NOT NULL REFERENCES establecimientos(id) ON DELETE RESTRICT` |
| `nombre` | `VARCHAR(150)` | `NOT NULL` (ej. 'Sede Principal - Miraflores', 'Mall Plaza') |
| `direccion` | `TEXT` | `NOT NULL` |
| `latitud` | `DOUBLE PRECISION` | Coordenada GPS latitud (`CHECK (latitud BETWEEN -90 AND 90)`) |
| `longitud` | `DOUBLE PRECISION`| Coordenada GPS longitud (`CHECK (longitud BETWEEN -180 AND 180)`) |
| `telefono` | `VARCHAR(30)` | Teléfono de la sucursal |
| `horario_atencion` | `TEXT` | Detalle de días y horas de atención al público |
| `estado` | `VARCHAR(20)` | `DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO'))` |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |

#### 7. `usuarios_sucursales` (Asignación de Personal a Sedes)
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `usuario_id` | `UUID` | `NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE` |
| `sucursal_id`| `UUID` | `NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE` |
| `cargo` | `VARCHAR(50)` | Cargo en la sede (ej. 'Cajero', 'Recepcionista', 'Encargado') |
| `estado` | `VARCHAR(20)` | `DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO'))` |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |
| **PK** | | `PRIMARY KEY (usuario_id, sucursal_id)` |

#### 8. `tarjetas_nfc`
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `cliente_id` | `UUID` | `REFERENCES clientes(id) ON DELETE SET NULL` (nullable en stock) |
| `uid_nfc` | `VARCHAR(100)` | `UNIQUE NOT NULL` |
| `qr_respaldo`| `VARCHAR(150)` | `UNIQUE NOT NULL` |
| `estado` | `VARCHAR(20)` | `DEFAULT 'DISPONIBLE' CHECK (estado IN ('DISPONIBLE', 'ACTIVA', 'BLOQUEADA', 'PERDIDA', 'DAÑADA', 'REEMPLAZADA'))` |
| `fecha_asignacion` | `TIMESTAMPTZ` | Timestamp de vinculación al cliente |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |

*Restricción física única condicional:*
```sql
CREATE UNIQUE INDEX idx_tarjeta_unica_activa_cliente 
ON tarjetas_nfc (cliente_id) 
WHERE estado = 'ACTIVA';
```

#### 9. `historial_tarjetas_nfc`
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `tarjeta_id` | `UUID` | `NOT NULL REFERENCES tarjetas_nfc(id) ON DELETE CASCADE` |
| `operador_id`| `UUID` | `NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT` |
| `estado_anterior` | `VARCHAR(20)` | Estado previo |
| `estado_nuevo` | `VARCHAR(20)` | `NOT NULL` Nuevo estado asignado |
| `motivo` | `TEXT` | Justificación técnica u operativa del cambio |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |

#### 10. `programas_sellos`
*Contiene la identidad visual y ruta del sello digital integrado para el MVP.*
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `establecimiento_id` | `UUID` | `NOT NULL REFERENCES establecimientos(id) ON DELETE RESTRICT` |
| `nombre` | `VARCHAR(100)` | `NOT NULL` (ej. 'Programa Café de Especialidad') |
| `meta_sellos` | `INT` | `NOT NULL CHECK (meta_sellos > 0)` |
| `max_sellos_dia` | `INT` | `DEFAULT 1 CHECK (max_sellos_dia > 0)` |
| `sello_nombre` | `VARCHAR(60)` | `NOT NULL` Nombre comercial del sello (ej. 'Sello Latte') |
| `sello_imagen_url` | `TEXT` | `NOT NULL` Ruta de la imagen / insignia del sello |
| `sello_color_hex` | `VARCHAR(7)` | `DEFAULT '#9B1B30'` Color de tinta digital |
| `sello_mensaje` | `TEXT` | Mensaje o lema estampado |
| `vigencia_desde` | `DATE` | Fecha de inicio |
| `vigencia_hasta` | `DATE` | Fecha de fin |
| `estado` | `VARCHAR(20)` | `DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'HISTORICO'))` |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |

#### 11. `reglas_puntos`
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `programa_id` | `UUID` | `NOT NULL REFERENCES programas_sellos(id) ON DELETE CASCADE` |
| `tipo_regla` | `VARCHAR(50)` | `NOT NULL CHECK (tipo_regla IN ('PUNTOS_POR_SELLO', 'BONO_CONSUMO', 'DOBLE_PUNTOS_CAMPANA', 'TOPE_DIARIO'))` |
| `puntos` | `INT` | `NOT NULL CHECK (puntos >= 0)` |
| `monto_minimo`| `NUMERIC(10,2)` | Monto mínimo de consumo condicional (opcional) |
| `descripcion` | `VARCHAR(255)` | Explicación de la regla |
| `activa` | `BOOLEAN` | `DEFAULT TRUE` |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |

#### 12. `visitas`
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `cliente_id` | `UUID` | `NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT` |
| `tarjeta_id` | `UUID` | `NOT NULL REFERENCES tarjetas_nfc(id) ON DELETE RESTRICT` |
| `sucursal_id` | `UUID` | `NOT NULL REFERENCES sucursales(id) ON DELETE RESTRICT` |
| `validador_id` | `UUID` | `NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT` (Trabajador) |
| `monto_consumo` | `NUMERIC(10,2)` | Monto de compra o ticket (opcional) |
| `estado` | `VARCHAR(20)` | `DEFAULT 'CONFIRMADA' CHECK (estado IN ('CONFIRMADA', 'ANULADA'))` |
| `motivo_anulacion`| `TEXT` | Motivo en caso de anulación |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |

#### 13. `sellos_digitales` (Sin redundancia: 3FN)
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `visita_id` | `UUID` | `NOT NULL REFERENCES visitas(id) ON DELETE CASCADE` |
| `programa_id` | `UUID` | `NOT NULL REFERENCES programas_sellos(id) ON DELETE RESTRICT` |
| `numero_orden` | `INT` | `NOT NULL CHECK (numero_orden > 0)` (ej. sello 1, 2, 3...) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |

#### 14. `movimientos_puntos` (Ledger Inmutable)
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `cliente_id` | `UUID` | `NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT` |
| `visita_id` | `UUID` | `REFERENCES visitas(id) ON DELETE SET NULL` (opcional) |
| `canje_id` | `UUID` | `REFERENCES canjes(id) ON DELETE SET NULL` (opcional) |
| `tipo_movimiento` | `VARCHAR(40)` | `NOT NULL CHECK (tipo_movimiento IN ('GANANCIA_VISITA', 'BONIFICACION', 'RESERVA_CANJE', 'DEBITO_CANJE', 'REVERSION_CANJE', 'AJUSTE_ADMIN', 'DEVOLUCION'))` |
| `cantidad` | `INT` | `NOT NULL` (Positivo para abono, negativo para débito) |
| `saldo_resultante` | `INT` | `NOT NULL` Saldo calculado en el momento exacto |
| `concepto` | `VARCHAR(255)` | `NOT NULL` Descripción de la operación |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |

#### 15. `recompensas`
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `establecimiento_id`| `UUID` | `NOT NULL REFERENCES establecimientos(id) ON DELETE RESTRICT` |
| `titulo` | `VARCHAR(150)` | `NOT NULL` |
| `descripcion` | `TEXT` | Condiciones y detalles del beneficio |
| `imagen_url` | `TEXT` | Foto de la recompensa |
| `puntos_requeridos` | `INT` | `NOT NULL CHECK (puntos_requeridos > 0)` |
| `stock` | `INT` | `DEFAULT NULL` (NULL = stock ilimitado; >= 0 stock finito) |
| `limite_por_cliente`| `INT` | `DEFAULT 1` |
| `vigencia_desde` | `DATE` | Fecha inicio de disponibilidad |
| `vigencia_hasta` | `DATE` | Fecha fin de disponibilidad |
| `estado` | `VARCHAR(20)` | `DEFAULT 'ACTIVA' CHECK (estado IN ('BORRADOR', 'ACTIVA', 'INACTIVA', 'AGOTADA'))` |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |

#### 16. `recompensas_sucursales` (Disponibilidad Geográfica)
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `recompensa_id` | `UUID` | `NOT NULL REFERENCES recompensas(id) ON DELETE CASCADE` |
| `sucursal_id` | `UUID` | `NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE` |
| `disponible` | `BOOLEAN` | `DEFAULT TRUE` |
| **PK** | | `PRIMARY KEY (recompensa_id, sucursal_id)` |

#### 17. `canjes`
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `cliente_id` | `UUID` | `NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT` |
| `recompensa_id` | `UUID` | `NOT NULL REFERENCES recompensas(id) ON DELETE RESTRICT` |
| `sucursal_id` | `UUID` | `REFERENCES sucursales(id) ON DELETE RESTRICT` (nullable al solicitar) |
| `usuario_entrega_id`| `UUID`| `REFERENCES usuarios(id) ON DELETE RESTRICT` (Trabajador) |
| `codigo_seguridad` | `VARCHAR(50)` | `UNIQUE NOT NULL` Token QR / PIN alfanumérico |
| `puntos_costo` | `INT` | `NOT NULL` Copia histórica congelada del costo |
| `estado` | `VARCHAR(20)` | `DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'CANJEADO', 'CANCELADO', 'VENCIDO'))` |
| `fecha_solicitud` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |
| `fecha_entrega` | `TIMESTAMPTZ` | Momento de entrega física en local |
| `fecha_vencimiento`| `TIMESTAMPTZ`| Límite para reclamar la recompensa |

#### 18. `notificaciones`
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `usuario_id` | `UUID` | `NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE` |
| `canal` | `VARCHAR(20)` | `NOT NULL CHECK (canal IN ('PUSH', 'EMAIL', 'INTERNA'))` |
| `tipo_evento` | `VARCHAR(50)` | `NOT NULL` |
| `titulo` | `VARCHAR(150)` | `NOT NULL` |
| `mensaje` | `TEXT` | `NOT NULL` |
| `leida` | `BOOLEAN` | `DEFAULT FALSE` |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |

#### 19. `auditoria`
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `usuario_id` | `UUID` | `NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT` |
| `accion` | `VARCHAR(60)` | `NOT NULL` |
| `tabla_afectada` | `VARCHAR(60)` | `NOT NULL` |
| `registro_id` | `UUID` | `NOT NULL` |
| `valores_anteriores`| `JSONB` | Snapshot del estado previo |
| `valores_nuevos` | `JSONB` | Snapshot del estado modificado |
| `ip_origen` | `VARCHAR(45)` | Dirección IP del cliente/operador |
| `motivo` | `TEXT` | Justificación obligatoria |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |

#### 20. `reclamaciones` (Libro de Reclamaciones Virtual — Indecopi)
*Cumple con la normativa peruana de protección al consumidor (plazo estricto de respuesta: 15 días hábiles improrrogables). Abarca tanto quejas/reclamos directos a la plataforma como incidencias canalizadas por sede/establecimiento.*
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `codigo_reclamacion`| `VARCHAR(30)` | `UNIQUE NOT NULL` (ej. 'LR-2026-000123') |
| `usuario_id` | `UUID` | `REFERENCES usuarios(id) ON DELETE SET NULL` (nullable si no tiene sesión iniciada) |
| `establecimiento_id`| `UUID` | `REFERENCES establecimientos(id) ON DELETE SET NULL` (nullable si el reclamo es a la plataforma) |
| `sucursal_id` | `UUID` | `REFERENCES sucursales(id) ON DELETE SET NULL` |
| `tipo` | `VARCHAR(10)` | `NOT NULL CHECK (tipo IN ('RECLAMO', 'QUEJA'))` |
| `nombre_consumidor` | `VARCHAR(150)` | `NOT NULL` Nombres y apellidos completos |
| `tipo_documento` | `VARCHAR(10)` | `NOT NULL` (DNI, CE, PASAPORTE) |
| `numero_documento` | `VARCHAR(20)` | `NOT NULL` |
| `es_menor_edad` | `BOOLEAN` | `DEFAULT FALSE` |
| `nombre_apoderado` | `VARCHAR(150)` | En caso de ser menor de edad |
| `telefono` | `VARCHAR(30)` | `NOT NULL` |
| `email` | `VARCHAR(150)` | `NOT NULL` Para envío automático de copia y respuesta |
| `descripcion_bien_servicio`| `TEXT`| `NOT NULL` Identificación del producto, servicio o experiencia |
| `monto_reclamado` | `NUMERIC(10,2)` | Monto económico asociado (opcional) |
| `detalle` | `TEXT` | `NOT NULL` Hechos expuestos por el consumidor |
| `pedido_consumidor`| `TEXT` | `NOT NULL` Pretensión concreta del reclamante |
| `respuesta_proveedor`| `TEXT` | Descargo formal emitido al consumidor |
| `fecha_registro` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |
| `fecha_limite_respuesta`| `DATE` | `NOT NULL` Fecha calculada (+15 días hábiles improrrogables) |
| `fecha_respuesta` | `TIMESTAMPTZ` | Momento en el que se notificó formalmente la respuesta |
| `estado` | `VARCHAR(20)` | `DEFAULT 'REGISTRADO' CHECK (estado IN ('REGISTRADO', 'EN_REVISION', 'RESPONDIDO', 'CERRADO'))` |

#### 21. `documentos_legales` (Términos, Políticas y Versiones)
*Evita textos legales estáticos en código y permite auditar vigencia y versiones.*
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `tipo_documento` | `VARCHAR(40)` | `NOT NULL CHECK (tipo_documento IN ('POLITICA_PRIVACIDAD', 'TERMINOS_CONDICIONES', 'POLITICA_COOKIES', 'CONSENTIMIENTO_MARKETING'))` |
| `version` | `VARCHAR(15)` | `NOT NULL` (ej. 'v1.0', 'v1.1') |
| `titulo` | `VARCHAR(150)` | `NOT NULL` |
| `contenido_url` | `TEXT` | Ruta o URL del documento íntegro en Markdown o PDF |
| `contenido_texto` | `TEXT` | Contenido en texto plano o estructurado |
| `fecha_publicacion` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |
| `fecha_vigencia` | `TIMESTAMPTZ` | Momento a partir del cual rige |
| `estado` | `VARCHAR(20)` | `DEFAULT 'ACTIVO' CHECK (estado IN ('BORRADOR', 'ACTIVO', 'OBSOLETO'))` |
| **UNIQUE** | | `UNIQUE (tipo_documento, version)` |

#### 22. `aceptaciones_legales` (Consentimiento Explícito e Inmutable)
*Prueba de cumplimiento ante la Autoridad Nacional de Protección de Datos Personales (ANPD).*
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `usuario_id` | `UUID` | `NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE` |
| `documento_id` | `UUID` | `NOT NULL REFERENCES documentos_legales(id) ON DELETE RESTRICT` |
| `fecha_aceptacion` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |
| `ip_origen` | `VARCHAR(45)` | Dirección IP al momento de aceptar |
| `user_agent` | `TEXT` | Dispositivo / Navegador del usuario |
| **UNIQUE** | | `UNIQUE (usuario_id, documento_id)` |

#### 23. `solicitudes_datos_personales` (Derechos ARCO — Ley 29733 y DS 016-2024-JUS)
*Mecanismo formal para el ejercicio de derechos de los titulares de datos personales.*
| Columna | Tipo de Dato | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` |
| `usuario_id` | `UUID` | `NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT` |
| `tipo_solicitud` | `VARCHAR(20)` | `NOT NULL CHECK (tipo_solicitud IN ('ACCESO', 'RECTIFICACION', 'CANCELACION', 'OPOSICION'))` |
| `detalle_peticion` | `TEXT` | `NOT NULL` Motivo y datos que solicita tratar o rectificar |
| `documento_sustento_url`| `TEXT` | DNI o prueba documental adjunta |
| `fecha_solicitud` | `TIMESTAMPTZ` | `DEFAULT CURRENT_TIMESTAMP` |
| `fecha_respuesta` | `TIMESTAMPTZ` | Momento de resolución |
| `respuesta` | `TEXT` | Respuesta formal y medidas aplicadas |
| `estado` | `VARCHAR(20)` | `DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_TRAMITE', 'PROCEDENTE', 'DENEGADA', 'CONCLUIDA'))` |

---

### 25.6. Capa Legal, Privacidad y Principio de Privacidad por Diseño (Data Isolation)

#### A. Marco Legal Peruano Aplicable
1. **Protección al Consumidor (Indecopi):**
   - Implementación de Libro de Reclamaciones Virtual accesible permanentemente.
   - Código correlativo único y acuse de recibo por correo.
   - Plazo de atención: **15 días hábiles improrrogables**.
   - Responsabilidad separada: Pasaporte Digital responde por la plataforma; cada establecimiento responde por sus bienes/servicios y sedes específicas.
2. **Protección de Datos Personales (Ley N.º 29733 y D.S. N.º 016-2024-JUS vigente):**
   - Todos los datos recopilados (nombres, fotos, teléfono, correo, geolocalización, hábitos de consumo en comercios, UID NFC) son **datos personales protegidos**.
   - **Inscripción Obligatoria:** El banco de datos de la plataforma se registra ante el *Registro Nacional de Protección de Datos Personales (ANPD)*.
   - **Consentimiento Libre, Previo, Expreso e Informado:** Versionado en `documentos_legales` y evidenciado en `aceptaciones_legales`.
   - **Garantía de Derechos ARCO:** Módulo de atención para Acceso, Rectificación, Cancelación y Oposición.

#### B. Principio de Aislamiento de Datos por Local (Data Isolation)
*Por arquitectura y cumplimiento normativo, queda terminantemente prohibido el acceso cruzado a datos entre comercios:*
- Un establecimiento afiliado (ej. *Aroma Café*) **únicamente tiene visibilidad** de:
  - Nombre del cliente e id/estado de su tarjeta activa.
  - Sellos correspondientes a su propio programa de fidelización.
  - Visitas ocurridas exclusivamente en sus propias sucursales.
  - Canjes generados o entregados en sus propias sucursales.
- **Datos vedados a los comercios:** El comercio nunca podrá consultar el historial de visitas a otros establecimientos afiliados, canjes de la competencia, ni información demográfica o personal sensible que no concierna a su relación directa con el consumidor.
- **Acceso global:** Solo el `ADMIN_GENERAL` posee visibilidad agregada y supervisión de la plataforma completa, sujeta a bitácora estricta de auditoría (`auditoria`).

---

## 26. ARQUITECTURA GENERAL

```
Cliente Web App
       ↓
 API / Backend
       ↓
 Base de datos
       ↓
Servicios externos
```

Al mismo backend también se conectarán:
- Panel del establecimiento.
- Panel administrativo.
- Servicio NFC.
- Servicio de correo.
- Servicio de notificaciones push.

---

## 27. SEGURIDAD

El sistema deberá considerar:
- Contraseñas almacenadas de forma segura.
- Autenticación.
- Autorización por roles.
- Control de sesiones.
- Validación del estado de las cuentas.
- Protección de las operaciones NFC.
- Control de operaciones duplicadas.
- Auditoría.
- Registro de intentos fallidos.
- Recuperación segura de acceso.
- Bloqueo de tarjetas.
- Validación de establecimientos.
- Protección de datos personales.

---

## 28. PROTOTIPOS Y MOCKUPS

### Cliente:
- Diseño orientado principalmente a dispositivos móviles.
- **Colores principales:** Borgoña, Dorado, Blanco / marfil.

### Establecimiento:
- Panel web responsive orientado principalmente a PC o laptop.
- **Prioridades:** Validación NFC, Clientes, Canjes, Estadísticas básicas.

### Administrador:
- Panel web orientado a escritorio.
- **Prioridades:** Métricas globales, Gestión del ecosistema, Reportes, Administración, Auditoría.

*El diseño deberá mantenerse limpio, profesional y sin saturación visual.*

---

## 29. PRUEBAS

- **Pruebas funcionales:** Validación de cada requisito funcional.
- **Pruebas de roles:** Comprobar que cada usuario pueda acceder únicamente a sus funciones.
- **Pruebas NFC:** Tarjeta válida, inexistente, bloqueada, duplicada, reemplazada.
- **Pruebas de puntos:** Asignación correcta, prevención de duplicados, reversión, saldo.
- **Pruebas de canje:** Saldo suficiente, insuficiente, recompensa vencida, sin stock, canje duplicado, cancelación.
- **Pruebas de seguridad:** Intentos de acceso no autorizado, manipulación de datos, control de sesiones, permisos.
- **Pruebas de rendimiento:** Evaluación de operaciones simultáneas y tiempos de respuesta.

---

## 30. TRABAJO FUTURO

En versiones posteriores se podrá considerar:
- Aplicación móvil nativa.
- Mayor cobertura geográfica.
- Nuevos establecimientos.
- Campañas personalizadas.
- Recomendaciones basadas en comportamiento.
- Analítica avanzada.
- Predicción de recurrencia.
- Segmentación de clientes.
- Programas de niveles.
- Beneficios exclusivos.
- Integración con otros sistemas.
- Automatización de campañas.

---

## 31. CONCLUSIÓN

Pasaporte Digital propone un ecosistema de fidelización que combina una tarjeta física NFC con una plataforma digital.

El cliente obtiene una experiencia centralizada para registrar visitas, acumular puntos y acceder a recompensas. Los establecimientos obtienen herramientas para fidelizar y analizar a sus clientes, mientras que el administrador dispone de una visión general del funcionamiento del ecosistema.

La definición previa de actores, procesos, reglas de negocio, requisitos y casos de uso permitirá posteriormente construir un modelo de datos y una arquitectura técnica coherentes con las necesidades reales del proyecto.

---

## 32. DEFINICIONES PREVIAS AL MODELO DE DATOS

Con el objetivo de garantizar una base sólida, normalizada y congruente para el diseño de las entidades y relaciones, se establecen formalmente los siguientes acuerdos estructurales de negocio:

### 32.1. Cuenta única por correo electrónico
- Cada usuario (cliente, trabajador, administrador de establecimiento o administrador general) posee una única cuenta identificada de forma unívoca por su dirección de correo electrónico (`email UNIQUE`).
- El inicio de sesión y la autenticación se sustentan en dicha identidad única, impidiendo registros duplicados con el mismo correo electrónico en la plataforma.

### 32.2. Relación Cliente – Tarjeta NFC (1 a N con exactamente 1 Activa) y Flujo de Reposición
- **Cardinalidad:** Un cliente puede tener asociadas varias tarjetas NFC a lo largo del tiempo (historial de reposiciones), pero **solo una tarjeta podrá encontrarse en estado `Activa` de manera simultánea**.
- **Regla de integridad:** El sistema aplicará una restricción única condicional (o trigger de validación) que garantice: máximo una tarjeta con estado `Activa` por cada cliente.
- **Flujo de reposición / reemplazo:**
  1. Si la tarjeta actual del cliente es declarada en estado `Bloqueada`, `Perdida` o `Dañada`, dicha tarjeta pasa inmediatamente al estado correspondiente y deja de operar.
  2. Al asignar una nueva tarjeta física (en estado inicial `Disponible`), el sistema transiciona la tarjeta anterior al estado `Reemplazada`.
  3. La nueva tarjeta se vincula al cliente y pasa a estado `Activa`.
  4. Los puntos acumulados, sellos, historial de visitas y canjes pendientes permanecen intactos en la cuenta del cliente (la identidad y saldo residen en el cliente, no en el plástico NFC).

### 32.3. Matriz Formal de Estados de la Tarjeta NFC
- **`Disponible`:** Tarjeta en stock de la administración o del establecimiento, registrada físicamente pero aún no vinculada a ningún cliente.
- **`Activa`:** Tarjeta vinculada a un cliente activo y habilitada para registrar visitas y canjes.
- **`Bloqueada`:** Inhabilitada temporalmente por seguridad, reporte preventivo o decisión administrativa.
- **`Perdida`:** Reportada como extraviada por el cliente; inhabilitada permanentemente para operar.
- **`Dañada`:** Falla física o lectura corrupta del chip NFC; inhabilitada permanentemente.
- **`Reemplazada`:** Tarjeta histórica que fue dada de baja formalmente al otorgarle un nuevo plástico al cliente.

### 32.4. Locales con Sucursales Opcionales
- El modelo contempla que un establecimiento matriz (marca/empresa) pueda operar con una o múltiples **sucursales físicas**:
  - Un establecimiento sin sucursales opera como una única sede comercial autónoma.
  - Para establecimientos con múltiples locales, cada sucursal dispone de su propia ubicación geográfica (dirección, coordenadas GPS, teléfono, horario), asociadas a la entidad matriz.
- El personal (trabajadores) y los registros de visitas quedan vinculados a la sucursal específica donde se produjo físicamente la lectura NFC.

### 32.5. Definición de Sello Digital como Visita Válida
- El **Sello Digital** representa la certificación digital inmutable de una visita física válida y confirmada realizada por un cliente portador de su tarjeta NFC en un establecimiento / sucursal.
- El sello no es un mero contador numérico: es un registro de experiencia que almacena la marca temporal, el establecimiento/sucursal emisor, el operador que validó la operación y la constancia de fidelidad en el pasaporte del cliente.

### 32.6. Relación Sello – Puntos Parametrizable por Local
- Cada establecimiento puede definir y parametrizar de manera independiente su propia política de conversión:
  - **Puntos por sello:** Cantidad de puntos otorgados al cliente al estampar un sello digital válido.
  - **Monto mínimo / condiciones:** Reglas de compra o consumo asociadas (si aplican) para acreditar el sello y sus puntos.
  - **Límites de frecuencia:** Restricción de sellos acreditables por cliente en una misma jornada (ej. máximo 1 sello por día por establecimiento) para prevenir fraudes o lecturas duplicadas.

### 32.7. Identidad Visual y Atributos del Sello por Local
Cada establecimiento personaliza los atributos de identidad de su sello digital dentro del Pasaporte del cliente:
- **Nombre distintivo del sello:** (Ej. *"Sello Cafetero"*, *"Sello Gourmet"*).
- **Insignia / Icono visual:** Recurso gráfico SVG o imagen PNG representativa de la marca.
- **Color de tinta digital (HEX):** Tonalidad característica con la que se "estampa" visualmente el sello en la Web App del cliente.
- **Mensaje conmemorativo o lema:** Texto breve descriptivo que acompaña la acreditación del sello en el pasaporte.

