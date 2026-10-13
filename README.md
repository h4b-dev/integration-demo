# NexShop — Tienda en línea de demostración

Aplicación de e-commerce construida con **React 19**, **TypeScript** y **Vite**, diseñada para demostrar la integración con distintas APIs de pagos de N1CO Pay.

---

## Requisitos previos

Antes de comenzar, asegúrate de tener instalado lo siguiente en tu computadora:

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| [Node.js](https://nodejs.org/) | 18.x o superior | `node -v` |
| npm | 9.x o superior | `npm -v` |
| Git | cualquier versión reciente | `git --version` |

---

## Instalación y puesta en marcha

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd online-store
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y completa tus credenciales:

```bash
cp .env.example .env
```

Abre el archivo `.env` y rellena los valores:

```env
# API de pagos (tokenización y cobros)
VITE_PAYMENT_BASE_URL=https://api-sandbox.n1co.shop
VITE_PAYMENT_CLIENT_ID=tu-client-id-aqui
VITE_PAYMENT_CLIENT_SECRET=tu-client-secret-aqui

# API de Payment Link (checkout rápido)
VITE_PAYMENT_LINK_TOKEN=tu-token-de-payment-link-aqui
```

> **Nota:** Todas las variables deben comenzar con `VITE_` para que Vite las exponga al cliente.

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en **http://localhost:5173**

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo con Hot Module Replacement |
| `npm run build` | Compila el proyecto para producción en la carpeta `dist/` |
| `npm run preview` | Sirve localmente la build de producción para revisarla |
| `npm run lint` | Ejecuta ESLint para detectar problemas en el código |

---

## Estructura del proyecto

```
src/
├── components/        # Componentes reutilizables (Cart, Header, Tabs, etc.)
├── context/           # Estado global con React Context
│   ├── CartContext.tsx      # Carrito de compras
│   └── PaymentContext.tsx   # Tarjetas guardadas y modal de pago
├── data/              # Datos de productos y suscripciones
├── pages/             # Vistas principales de cada pestaña
│   ├── ProductsTab.tsx
│   ├── SubscriptionsTab.tsx
│   ├── CheckoutTab.tsx
│   └── ThankYouPage.tsx
├── services/          # Lógica de comunicación con las APIs
│   ├── paymentAuth.ts       # Autenticación y token de acceso
│   ├── paymentMethods.ts    # Tokenización de tarjetas
│   ├── charges.ts           # Procesamiento de cobros
│   └── paymentLink.ts       # Generación de links de pago
└── types/             # Definiciones de TypeScript
```

---

## Funcionalidades por pestaña

### Productos — Payment API
Muestra un catálogo de productos con búsqueda y filtrado por categoría. El cliente agrega productos al carrito y paga ingresando o seleccionando una tarjeta guardada. Incluye soporte para autenticación 3D Secure.

### Suscripciones — Subscription API
Planes de suscripción con facturación mensual o anual. El cliente puede seleccionar un plan y procesarlo igual que un producto.

### Checkout Store — Payment Link API
Catálogo de productos que genera un **link de pago seguro** a través de N1CO Pay. Al hacer clic en *"Pay with Payment Link"*:
1. Se llama a la API para crear el link de pago con los productos del carrito.
2. La página de pago de N1CO Pay se carga dentro de un **iframe** sin salir de la tienda.
3. Al completar el pago, el iframe detecta el retorno automáticamente y muestra la página de confirmación.

---

## Configuración del proxy (CORS)

El proyecto usa el proxy integrado de Vite para evitar errores de CORS en desarrollo. Las llamadas a `/api/paymentlink/*` son redirigidas automáticamente a `https://api-pay-sandbox.n1co.shop`. Esta configuración se encuentra en `vite.config.ts` y **no requiere ningún cambio manual**.

> En un entorno de producción, este proxy debe reemplazarse por un backend propio (o un API Gateway) que realice las llamadas a N1CO Pay desde el servidor.

---

## Variables de entorno — referencia completa

| Variable | Descripción |
|---|---|
| `VITE_PAYMENT_BASE_URL` | URL base de la API de pagos (tokenización y cobros) |
| `VITE_PAYMENT_CLIENT_ID` | Client ID para autenticación OAuth |
| `VITE_PAYMENT_CLIENT_SECRET` | Client Secret para autenticación OAuth |
| `VITE_PAYMENT_LINK_TOKEN` | Bearer token para la API de Payment Link |

---

## Solución de problemas frecuentes

**El servidor no arranca**
Verifica que el puerto 5173 no esté ocupado. Puedes cambiarlo en `vite.config.ts` agregando `server: { port: 3000 }`.

**Error 401 al generar el link de pago**
El token en `VITE_PAYMENT_LINK_TOKEN` es inválido o expiró. Solicita un nuevo token a N1CO Pay y actualiza el archivo `.env`.

**Las variables de entorno no se leen**
Asegúrate de que el archivo se llame exactamente `.env` (no `.env.local` ni `.env.development`) y de reiniciar el servidor con `npm run dev` tras cualquier cambio en ese archivo.

**La página de "Gracias por tu compra" no aparece**
La URL de retorno (`successUrl`) apunta a `http://localhost:5173/?checkout=success`. Verifica que estés ejecutando la app en ese mismo origen al momento de completar el pago.

---

---

# Guía de integración N1CO Pay — Paso a paso

> Esta guía está escrita para cualquier persona del equipo —técnica o no— que necesite entender cómo funciona la integración con las APIs de N1CO Pay. No se necesitan conocimientos de programación para leer y comprender el flujo; los ejemplos de código son solo de referencia.

---

## ¿Qué es una API y cómo funciona aquí?

Imagina que una API es un mesero en un restaurante. Tú (la tienda) le dices al mesero lo que necesitas (por ejemplo: "cobra $50 a esta tarjeta"). El mesero va a la cocina (el servidor de N1CO Pay), trae la respuesta y te la entrega ("cobro exitoso" o "tarjeta rechazada"). Eso es todo: un mensaje de ida y uno de vuelta.

N1CO Pay ofrece **dos conjuntos de APIs** distintos:

| API | ¿Para qué sirve? | URL base |
|---|---|---|
| **Payment API** | Tokenizar tarjetas y realizar cobros directos | `https://api-sandbox.n1co.shop` |
| **Payment Link API** | Generar un link de pago listo para usar | `https://api-pay-sandbox.n1co.shop` |

Cada una tiene su propio sistema de autenticación, que se explica en su sección correspondiente.

---

## Glosario rápido

Antes de empezar, estos son los términos que vas a ver repetidamente:

- **Token de acceso:** Una contraseña temporal que dura cierto tiempo. Se obtiene una vez y se usa en todas las llamadas siguientes. Cuando expira, hay que pedir uno nuevo.
- **Tokenizar una tarjeta:** Convertir los datos reales de una tarjeta (número, fecha, CVV) en un código seguro llamado *token*. Ese token se guarda y se usa para cobrar, nunca los datos reales. Es como guardar la huella digital de la tarjeta en lugar de cargar la tarjeta física.
- **Cobro (Charge):** La instrucción de "cobra X monto al token de tarjeta Y".
- **3DS (Three-Domain Secure):** Una verificación adicional que algunos bancos exigen. Es la pantalla extra que a veces aparece pidiendo un código SMS o una clave de tu app bancaria antes de aprobar un pago. No todos los cobros la requieren.
- **authenticationId:** El identificador que devuelve el banco después de que el cliente completó el 3DS. Se usa para reintentar el cobro y confirmar que la autenticación fue exitosa.
- **Payment Link:** Un enlace único generado por N1CO Pay que lleva al cliente a una página de pago ya configurada. El comercio solo arma el carrito y N1CO Pay hace el resto.
- **lineItems:** La lista de productos incluidos en una orden (nombre, precio, cantidad).
- **successUrl / cancelUrl:** Las URLs a las que N1CO Pay redirige al cliente después de que paga (éxito) o cancela el proceso.

---

## Flujo A — Pago con tarjeta (Payment API)

Este flujo se usa en la pestaña **Productos** de la tienda. El cliente elige productos, ingresa su tarjeta y el cobro se procesa en tiempo real.

El proceso tiene hasta cuatro pasos:

```
[1] Autenticarse        →  obtener token de acceso
[2] Tokenizar tarjeta   →  convertir datos de tarjeta en token seguro
[3] Realizar el cobro   →  cobrar usando el token de tarjeta
[4] 3DS (si el banco    →  autenticar al cliente → reintentar cobro
    lo exige)
```

---

### Paso 1 — Autenticación: obtener el token de acceso

**¿Por qué?** Antes de poder hacer cualquier llamada a la Payment API, hay que demostrar que eres un comercio autorizado. Se envían las credenciales (Client ID y Client Secret) y a cambio se recibe un token de acceso temporal.

**Endpoint:**
```
POST https://api-sandbox.n1co.shop/api/v3/Token
```

**Headers:**
```
Content-Type: application/json
```

**Body (lo que se envía):**
```json
{
  "clientId": "14dc9978-39b0-4318-bddf-011ffd85b166",
  "clientSecret": "yiC8Q~voutP0lSr9sbQqETjLzLTaBQSci.pMEb4N"
}
```

**Respuesta exitosa:**
```json
{
  "tokenType": "Bearer",
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**¿Qué hacer con la respuesta?**
- Guarda el valor de `accessToken`. Lo necesitarás en **todos** los pasos siguientes.
- `expiresIn` indica cuántos segundos es válido el token (3600 = 1 hora). Pasado ese tiempo hay que repetir este paso.
- En cada llamada posterior, este token se envía en el header `Authorization` con el prefijo `Bearer`:
  ```
  Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

> **Analogía:** Es como llegar a una oficina, mostrar tu credencial en recepción y recibir un gafete de visitante con hora de expiración. Ese gafete lo presentas en cada puerta que quieras abrir durante tu visita.

---

### Paso 2 — Tokenizar la tarjeta

**¿Por qué?** Por seguridad, nunca se almacena ni se transmite el número de tarjeta real más de una vez. En este paso se envían los datos reales *una sola vez* y a cambio se recibe un `id` (el token de la tarjeta) que representa esa tarjeta de forma segura. De ahí en adelante, solo se usa ese `id`.

**Endpoint:**
```
POST https://api-sandbox.n1co.shop/api/v3/PaymentMethods
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <accessToken del Paso 1>
```

**Body (lo que se envía):**
```json
{
  "customer": {
    "id": "coreAutomatess",
    "email": "cliente@ejemplo.com",
    "name": "Juan Pérez",
    "phoneNumber": "+50310000019"
  },
  "card": {
    "number": "4000000000001000",
    "cardHolderName": "JUAN PEREZ",
    "expirationMonth": "01",
    "expirationYear": "2028",
    "cvv": "123"
  },
  "singleUse": false
}
```

Descripción de los campos:

| Campo | Descripción |
|---|---|
| `customer.id` | Identificador único del cliente en tu sistema |
| `customer.email` | Correo del cliente |
| `card.number` | Número de la tarjeta sin espacios |
| `card.cardHolderName` | Nombre tal como aparece en la tarjeta |
| `card.expirationMonth` | Mes de vencimiento (2 dígitos) |
| `card.expirationYear` | Año de vencimiento (4 dígitos) |
| `card.cvv` | Código de seguridad |
| `singleUse` | `false` = la tarjeta se puede reutilizar / `true` = se descarta después del primer cobro |

**Respuesta exitosa:**
```json
{
  "id": "pm_abc123xyz789",
  "type": "card",
  "success": true,
  "message": "Payment method created successfully",
  "bin": {
    "brand": "Visa",
    "issuerName": "BANCO EJEMPLO",
    "countryCode": "US"
  }
}
```

**¿Qué hacer con la respuesta?**
- Guarda el valor de `id` (ejemplo: `pm_abc123xyz789`). Este es el **token de la tarjeta** y lo necesitarás en el Paso 3.
- El campo `bin.brand` te dice la franquicia de la tarjeta (Visa, Mastercard, etc.).
- **Nunca** guardes el número real de la tarjeta. Solo guarda este `id`.

---

### Paso 3 — Realizar el cobro

**¿Por qué?** Con el token del cliente listo, ahora se le dice a la API "cobra este monto usando esta tarjeta".

**Endpoint:**
```
POST https://api-sandbox.n1co.shop/api/v3/Charges
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <accessToken del Paso 1>
```

**Body (lo que se envía):**
```json
{
  "customerId": "coreAutomatess",
  "cardId": "pm_abc123xyz789",
  "BillingInfo": {
    "CountryCode": "US",
    "StateCode": "CA",
    "ZipCode": "10002"
  },
  "order": {
    "amount": 149.99,
    "description": "Compra en NexShop",
    "id": "order-1718300000-k7x2m1",
    "name": "NexShop — 2 artículo(s)",
    "authenticationId": null
  }
}
```

Descripción de los campos:

| Campo | Descripción |
|---|---|
| `customerId` | El mismo `customer.id` que usaste al tokenizar la tarjeta |
| `cardId` | El `id` devuelto en el Paso 2 |
| `BillingInfo` | Dirección de facturación del cliente |
| `order.amount` | Monto total a cobrar |
| `order.id` | Identificador único de esta orden en tu sistema (debe ser diferente en cada cobro) |
| `order.authenticationId` | Se envía `null` en el primer intento; si hay 3DS se rellena en el Paso 4 |

---

#### Posible respuesta A — Cobro aprobado directamente

```json
{
  "status": "SUCCESS",
  "message": "Payment processed successfully",
  "error": null,
  "authentication": null,
  "order": {
    "id": "order-1718300000-k7x2m1",
    "amount": 149.99,
    "currency": "USD"
  },
  "createdAt": "2024-06-13T20:00:00Z"
}
```

Si `status` es `"SUCCESS"` y `authentication` es `null`, el cobro fue aprobado. **¡Listo!** No hay más pasos.

---

#### Posible respuesta B — El banco exige autenticación 3DS

```json
{
  "status": "AUTHENTICATION_REQUIRED",
  "message": "Payment requires 3DS authentication",
  "error": null,
  "authentication": {
    "url": "https://front-3ds-sandbox.n1co.com/authentication/bbae3dc9-0293-4789-8bec-ff373b9df534?showBranding=True&lang=en",
    "id": "bbae3dc9-0293-4789-8bec-ff373b9df534"
  },
  "order": null,
  "createdAt": "2026-02-24T00:49:34.6583066Z"
}
```

Cuando `status` es `"AUTHENTICATION_REQUIRED"`, el cobro no fue rechazado ni aprobado: quedó en pausa esperando que el cliente se autentique con su banco. El objeto `authentication` contiene:

| Campo | Descripción |
|---|---|
| `authentication.url` | La URL que debes mostrar al cliente (en un iframe o ventana nueva) para que complete la verificación con su banco |
| `authentication.id` | El identificador único de esta sesión de autenticación. Se guarda y se usa en el Paso 4 como `authenticationId` |

Continúa con el **Paso 4**.

---

#### Posible respuesta C — Cobro rechazado

```json
{
  "status": "FAILED",
  "message": "Payment declined",
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "La tarjeta no tiene fondos suficientes",
    "title": null,
    "detail": null
  },
  "authentication": null,
  "order": null,
  "createdAt": "2024-06-13T20:00:00Z"
}
```

Si `status` es `"FAILED"`, el cobro fue rechazado. El campo `error.message` explica el motivo. No hay que reintentar automáticamente; se debe informar al cliente.

---

### Paso 4 — Autenticación 3DS (solo si el banco lo exige)

**¿Qué es el 3DS?** Es una capa de seguridad adicional que algunos bancos activan para proteger a sus tarjetahabientes. El banco quiere confirmar que es el dueño real de la tarjeta quien está comprando, no un tercero. Generalmente se muestra una pantalla donde el cliente ingresa un código SMS, usa su app bancaria o responde una pregunta secreta.

**¿Cuándo ocurre?** Solo cuando la respuesta del Paso 3 incluye un objeto `authentication` con datos. No todos los cobros lo requieren.

**El flujo del 3DS tiene tres momentos:**

**Momento 1 — Detectar que se necesita 3DS**

La respuesta del Paso 3 contiene:
```json
"authentication": {
  "url": "https://front-3ds-sandbox.n1co.com/authentication/bbae3dc9-0293-4789-8bec-ff373b9df534?showBranding=True&lang=en",
  "id": "bbae3dc9-0293-4789-8bec-ff373b9df534"
}
```

Guarda el `id` de autenticación y abre la URL del campo `url`. Esta URL la abre el cliente en un iframe o una ventana nueva para que complete la verificación con su banco.

**Momento 2 — El cliente completa la verificación**

El cliente ve la página del banco, ingresa su código o confirma desde su app bancaria y el banco le da el visto bueno. Una vez que el cliente termina, se regresa al flujo de la tienda.

**Momento 3 — Reintentar el cobro con el ID de autenticación**

Se repite exactamente la misma llamada del **Paso 3**, pero ahora el campo `authenticationId` ya no es `null`:

```json
{
  "customerId": "coreAutomatess",
  "cardId": "pm_abc123xyz789",
  "BillingInfo": {
    "CountryCode": "US",
    "StateCode": "CA",
    "ZipCode": "10002"
  },
  "order": {
    "amount": 149.99,
    "description": "Compra en NexShop",
    "id": "order-1718300000-k7x2m1",
    "name": "NexShop — 2 artículo(s)",
    "authenticationId": "bbae3dc9-0293-4789-8bec-ff373b9df534"
  }
}
```

Si el banco aprobó la autenticación, esta segunda llamada devolverá `"status": "SUCCESS"`.

**Diagrama completo del Flujo A:**

```
Tienda                          N1CO Pay API                    Banco del cliente
  │                                   │                                │
  │── POST /api/v3/Token ────────────>│                                │
  │<── accessToken ───────────────────│                                │
  │                                   │                                │
  │── POST /api/v3/PaymentMethods ───>│                                │
  │<── id: "pm_abc123" ───────────────│                                │
  │                                   │                                │
  │── POST /api/v3/Charges ──────────>│                                │
  │   (authenticationId: null)        │                                │
  │                                   │                                │
  │         ┌─────────────────────────┤                                │
  │         │  ¿Requiere 3DS?         │                                │
  │         └──── NO ─────────────────┤                                │
  │<── status: "SUCCESS" ─────────────│                                │
  │         │                         │                                │
  │         └──── SÍ ─────────────────┤                                │
  │<── authentication.redirectUrl ────│                                │
  │                                   │                                │
  │── Muestra iframe del banco ───────────────────────────────────────>│
  │<── Cliente completa verificación ─────────────────────────────────│
  │                                   │                                │
  │── POST /api/v3/Charges ──────────>│                                │
  │   (authenticationId: "auth_3ds_…")│                                │
  │<── status: "SUCCESS" ─────────────│                                │
```

---

## Flujo B — Payment Link (Checkout Store)

Este flujo se usa en la pestaña **Checkout Store**. En lugar de procesar el pago directamente, la tienda le pide a N1CO Pay que genere un enlace de pago ya configurado. El cliente hace clic, completa el pago en la página segura de N1CO Pay y regresa automáticamente a la tienda.

**Ventaja principal:** La tienda no maneja ningún dato de tarjeta. Todo el proceso de pago ocurre en la infraestructura de N1CO Pay.

El proceso tiene tres pasos:

```
[1] Crear el link de pago  →  enviar la lista de productos y URLs de retorno
[2] Mostrar la página       →  el cliente paga en la página de N1CO Pay
[3] Detectar el retorno    →  success o cancel URL
```

---

### Paso 1 — Autenticación con Bearer token estático

A diferencia de la Payment API (que requiere intercambio de credenciales para obtener un token), la Payment Link API usa un **token estático** que se te entrega una sola vez y no expira automáticamente. Se usa directamente en el header `Authorization`.

```
Authorization: Bearer sk_5b62f376887a64dfecd8fcd642f067bf5a305595402a39d5d9946170311c8fd5
```

> Este token es como una llave maestra para tu cuenta. Trátalo con la misma confidencialidad que una contraseña. No lo compartas ni lo expongas en código público.

---

### Paso 2 — Crear el link de pago

**Endpoint:**
```
POST https://api-pay-sandbox.n1co.shop/api/paymentlink/checkout
```

**Headers:**
```
Authorization: Bearer sk_5b62f376887a64dfecd8fcd642f067bf5a305595402a39d5d9946170311c8fd5
Accept: application/json
Content-Type: application/json
```

**Body (lo que se envía):**
```json
{
  "orderName": "NexShop Order",
  "orderDescription": "Compra en tienda online",
  "lineItems": [
    {
      "product": {
        "sku": "desk-mat-001",
        "name": "Premium Desk Mat",
        "price": 39.99
      },
      "quantity": 2
    },
    {
      "product": {
        "sku": "usb-hub-002",
        "name": "USB-C Hub 7-in-1",
        "price": 49.99
      },
      "quantity": 1
    }
  ],
  "successUrl": "https://tu-tienda.com/?checkout=success",
  "cancelUrl": "https://tu-tienda.com/?checkout=cancelled",
  "metadata": [
    {
      "name": "clientId",
      "value": "nexshop-web"
    }
  ]
}
```

Descripción de los campos:

| Campo | Descripción |
|---|---|
| `orderName` | Nombre visible de la orden en la página de pago |
| `orderDescription` | Descripción opcional de la orden |
| `lineItems` | Lista de productos. Cada uno tiene `sku`, `name`, `price` y `quantity` |
| `lineItems[].product.sku` | Código único del producto en tu catálogo |
| `lineItems[].product.price` | Precio unitario del producto |
| `lineItems[].quantity` | Cantidad de unidades de ese producto |
| `successUrl` | URL a la que N1CO Pay redirige al cliente si el pago es exitoso |
| `cancelUrl` | URL a la que N1CO Pay redirige al cliente si cancela el pago |
| `metadata` | Información adicional opcional (útil para rastrear el origen del pago) |

**Respuesta exitosa:**
```json
{
  "orderCode": "PKEMHRx",
  "orderId": 16918,
  "paymentLinkUrl": "https://pay-sandbox.n1co.shop/PKEMHRx"
}
```

| Campo | Descripción |
|---|---|
| `orderCode` | Código corto identificador de la orden |
| `orderId` | ID numérico interno de la orden en N1CO Pay |
| `paymentLinkUrl` | La URL completa a la que debes llevar al cliente para que pague |

---

### Paso 3 — Mostrar la página de pago al cliente

Con la `paymentLinkUrl` obtenida, tienes dos opciones para mostrarla:

**Opción A — Iframe (implementada en este proyecto)**
Carga la URL dentro de un iframe en tu misma página. El cliente completa el pago sin salir de tu sitio. La página detecta automáticamente el retorno a la `successUrl` mediante el evento `onload` del iframe.

**Opción B — Nueva pestaña o redirección**
Abre la URL en una pestaña nueva o redirige directamente al cliente. Cuando termine, N1CO Pay lo llevará de vuelta a la `successUrl` o `cancelUrl` que configuraste.

---

### Paso 4 — Detectar el resultado del pago

Cuando el cliente termina (pague o cancele), N1CO Pay lo redirige a la URL que indicaste:

- **Pago exitoso:** N1CO Pay redirige a `successUrl` → tu aplicación detecta el parámetro `?checkout=success` y muestra la confirmación.
- **Pago cancelado:** N1CO Pay redirige a `cancelUrl` → tu aplicación detecta `?checkout=cancelled` y le permite al cliente intentar de nuevo.

No se necesita ninguna llamada adicional a la API para confirmar el resultado; la redirección a la `successUrl` es la señal de que el pago fue aprobado.

**Diagrama del Flujo B:**

```
Tienda                        N1CO Pay API              Página de pago N1CO
  │                                 │                           │
  │── POST /api/paymentlink/ ──────>│                           │
  │       checkout                  │                           │
  │<── paymentLinkUrl ──────────────│                           │
  │                                 │                           │
  │── Muestra iframe ───────────────────────────────────────── >│
  │                                 │                           │
  │                                 │<── Cliente paga ──────────│
  │                                 │                           │
  │<── Iframe redirige a successUrl ────────────────────────────│
  │
  │── Detecta ?checkout=success
  │── Muestra confirmación al cliente
```

---

> Los dominios que contienen `sandbox` son entornos de prueba. En producción se usan dominios equivalentes sin esa palabra. Los datos de tarjeta ingresados en sandbox **nunca** generan cobros reales.

---

## Tarjetas de prueba

Para probar sin usar tarjetas reales, usa los siguientes datos en el entorno sandbox:

| Campo | Valor |
|---|---|
| Número | `4000 0000 0000 1000` |
| Nombre | Cualquier nombre (ej. `Test User`) |
| Mes de vencimiento | `01` |
| Año de vencimiento | `2028` |
| CVV | `123` |

Esta tarjeta de prueba activa el flujo de **autenticación 3DS**, lo que permite probar el paso 4 del Flujo A completo.

---

## Flujo C — API de Suscripciones

La pestaña **Subscriptions** está dividida en dos vistas:

- **Admin** — exclusiva para el administrador del comercio. Permite crear planes de suscripción configurando nombre, precio, ciclo de cobro, período de prueba y límites. Los planes creados quedan disponibles para los clientes en la misma sesión.
- **Client** — vista que ve el cliente. Muestra los planes activos y permite suscribirse pagando con una tarjeta tokenizada, con soporte completo para autenticación 3DS.

> En una implementación real, la vista Admin estaría protegida detrás de autenticación y los planes se cargarían desde la base de datos del comercio. La vista Client solo consumiría los planes ya publicados.

El proceso de suscripción tiene dos pasos previos (crear plan desde Admin) y luego el flujo del cliente:

```
[1] Admin crea el plan   →  POST /api/v3/Plans  →  obtiene el plan ID
[2] Cliente tokeniza     →  POST /api/v3/PaymentMethods  →  obtiene token de tarjeta
[3] Cliente se suscribe  →  POST /api/v3/Subscriptions   →  con o sin 3DS
```

---

### Paso 1 (Admin) — Crear un plan de suscripción

**Endpoint:**
```
POST https://api-sandbox.n1co.shop/api/v3/Plans
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <accessToken>
```

**Body:**
```json
{
  "name": "Plan Mensual",
  "description": "Acceso completo por un mes",
  "amount": 14.99,
  "successUrl": "https://tu-tienda.com/success",
  "cancelUrl": "https://tu-tienda.com/cancel",
  "billingCycleType": "MONTH",
  "billingCyclesNumber": 1,
  "trialCycleType": "DAY",
  "trialCyclesNumber": 7,
  "cyclesToBillBeforeAllowCancelation": null,
  "subscriberLimit": null,
  "enrollmentEndDate": null,
  "subscriptionEndDate": null,
  "billingDay": null,
  "locationId": 119
}
```

**Respuesta exitosa:** el cuerpo de la respuesta es directamente el ID numérico del plan creado:
```
48
```

Guarda ese número — es el `planId` que el cliente usará al suscribirse.

Los valores posibles de `billingCycleType` y `trialCycleType` son: `DAY`, `WEEK`, `MONTH`, `YEAR`.

---

### Paso 2 (Cliente) — Tokenizar la tarjeta

Idéntico al **Paso 2 del Flujo A**. El cliente ingresa su tarjeta, se llama a `POST /api/v3/PaymentMethods` y se obtiene el `id` del método de pago tokenizado.

---

### Paso 3 (Cliente) — Crear la suscripción

**Endpoint:**
```
POST https://api-sandbox.n1co.shop/api/v3/Subscriptions
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <accessToken>
```

**Body (primer intento):**
```json
{
  "planId": 48,
  "customer": {
    "id": "coreAutomatess",
    "name": "coreAutomatess",
    "email": "coreAutomatess@n1co.com",
    "phoneNumber": "+50310000019"
  },
  "paymentMethod": {
    "id": "pm_abc123xyz789"
  }
}
```

Descripción de los campos:

| Campo | Descripción |
|---|---|
| `planId` | ID del plan obtenido en el Paso 1 |
| `customer.id` | ID del cliente — **debe ser el mismo `customer` con el que se tokenizó la tarjeta en el Paso 2**; si no coincide, la API responde `500` |
| `customer.name` | Nombre del suscriptor |
| `customer.email` | Correo del suscriptor |
| `customer.phoneNumber` | Teléfono del suscriptor |
| `paymentMethod.id` | Token de tarjeta obtenido en el Paso 2 |
| `locationCode` | *(Opcional)* Código de una sucursal del comercio (ver `GET /api/v3/Locations`). Si se omite se usa la sucursal por defecto; un código inexistente devuelve `400 Invalid location code` |

---

#### Posible respuesta A — Suscripción creada directamente

```json
{
  "message": "Subscription created successfully",
  "error": null,
  "authentication": null,
  "subscription": {
    "id": "sub_xyz",
    "status": "ACTIVE"
  }
}
```

Si `error` es `null` y `authentication` es `null`, la suscripción fue creada. No hay más pasos.

---

#### Posible respuesta B — El banco exige autenticación 3DS

```json
{
  "message": "Authentication required",
  "error": null,
  "authentication": {
    "url": "https://front-3ds-sandbox.n1co.com/authentication/bbae3dc9-…",
    "id": "bbae3dc9-0293-4789-8bec-ff373b9df534"
  },
  "subscription": null
}
```

El flujo es idéntico al **Paso 4 del Flujo A**: se muestra la URL en un iframe, el cliente completa la verificación con su banco y se repite la llamada incluyendo el `authenticationId`:

```json
{
  "planId": 48,
  "customer": { ... },
  "paymentMethod": { "id": "pm_abc123xyz789" },
  "authenticationId": "bbae3dc9-0293-4789-8bec-ff373b9df534"
}
```

Si el banco aprobó la autenticación, esta segunda llamada creará la suscripción.

---

#### Posible respuesta C — Suscripción rechazada

```json
{
  "message": "Payment declined",
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "La tarjeta no tiene fondos suficientes",
    "title": null,
    "detail": null
  },
  "authentication": null,
  "subscription": null
}
```

Si `error` no es `null`, la suscripción fue rechazada. El campo `error.message` explica el motivo.

---

### Diagrama del Flujo C

```
Admin                      N1CO Pay API                      Cliente
  │                              │                               │
  │── POST /api/v3/Plans ───────>│                               │
  │<── planId: 48 ───────────────│                               │
  │                              │                               │
  │                              │<── POST /api/v3/PaymentMethods│
  │                              │── id: "pm_abc123" ───────────>│
  │                              │                               │
  │                              │<── POST /api/v3/Subscriptions─│
  │                              │    (authenticationId: null)   │
  │                              │                               │
  │                    ┌─────────┤                               │
  │                    │ ¿3DS?   │                               │
  │                    └── NO ───┤                               │
  │                              │── subscription created ──────>│
  │                    ┌─────────┤                               │
  │                    └── SÍ ───┤                               │
  │                              │── authentication.url ────────>│
  │                              │<── Cliente completa 3DS ──────│
  │                              │<── POST /api/v3/Subscriptions─│
  │                              │    (authenticationId: "…")    │
  │                              │── subscription created ──────>│
```

---

## Resumen de todos los endpoints

| Método | URL | ¿Para qué? |
|---|---|---|
| `POST` | `https://api-sandbox.n1co.shop/api/v3/Token` | Obtener token de acceso (Payment API) |
| `POST` | `https://api-sandbox.n1co.shop/api/v3/PaymentMethods` | Tokenizar una tarjeta |
| `DELETE` | `https://api-sandbox.n1co.shop/api/v3/PaymentMethods/{id}` | Eliminar un token de tarjeta guardado |
| `POST` | `https://api-sandbox.n1co.shop/api/v3/Charges` | Realizar un cobro |
| `POST` | `https://api-sandbox.n1co.shop/api/v3/Plans` | Crear un plan de suscripción |
| `POST` | `https://api-sandbox.n1co.shop/api/v3/Subscriptions` | Crear una suscripción |
| `POST` | `https://api-pay-sandbox.n1co.shop/api/paymentlink/checkout` | Crear un link de pago |
