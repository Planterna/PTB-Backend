# PTB Backend

Este es el backend construido con **Node.js, TypeScript, Express y Prisma**, estructurado bajo una arquitectura limpia por capas (Routes, Controllers, Services, Models y Manejo Centralizado de Errores con `HttpError`).

## Arquitectura del Proyecto

- **Rutas (`src/routes/`)**: Definición de endpoints HTTP y documentación Swagger/OpenAPI.
- **Controladores (`src/controllers/`)**: Manejo de peticiones HTTP, extracción de parámetros, invocación de la capa de servicios y retorno directo de respuestas JSON. Los errores se delegan con `next(error)`.
- **Servicios (`src/services/`)**: Lógica de negocio, validaciones y reglas del dominio (comunicación directa con Prisma ORM). Lanzan errores tipados que extienden de `HttpError`.
- **Modelos y DTOs (`src/models/`)**: Definición de interfaces, DTOs y validaciones de datos (ej. regex para nombres de usuario).
- **Errores HTTP (`src/errors/`)**: Jerarquía de excepciones que extienden de `HttpError` (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `NotFoundError`, `InternalServerError`).
- **Middlewares (`src/middlewares/`)**: Interceptor de autenticación JWT y middleware centralizado de manejo de errores (`errorHandler`).

## Configuración Inicial

1. **Levantar PostgreSQL (Docker Compose o local):**
   Puedes levantar la base de datos incluida en `docker-compose.yml`:
   ```bash
   docker compose up -d
   ```
   O asegurarte de tener PostgreSQL 16 corriendo en el puerto configurado.

2. **Configurar Variables de Entorno (`.env`):**
   Abre el archivo `.env` en la raíz del proyecto y ajusta los valores necesarios:
   ```env
   PORT=3000
   DATABASE_URL="postgresql://usuario:password@localhost:5433/ptb_db?schema=public"
   JWT_SECRET="tu_clave_secreta"
   ```

3. **Migrar la Base de Datos y Generar Cliente Prisma:**
   Ejecuta en la terminal:
   ```bash
   npx prisma db push
   # y para generar el cliente Prisma:
   npx prisma generate
   ```

4. **Ejecutar Semillero (Seed):**
   Para poblar la base de datos con un usuario de prueba (`lois_becket`), tarjetas y transacciones:
   ```bash
   npx prisma db seed
   ```

5. **Levantar el Servidor en Desarrollo:**
   ```bash
   npm run dev
   ```
   - Servidor escuchando en: `http://localhost:3000`
   - Documentación Swagger UI en: `http://localhost:3000/api-docs`

## Reglas del Campo `usuario`

En el registro de usuarios, el campo `usuario` debe cumplir con:
- Solo caracteres alfanuméricos (letras `a-z`, `A-Z`, números `0-9`).
- Guion bajo (`_`) y guion medio (`-`).
- Sin espacios ni otros caracteres especiales.
- Debe ser único en el sistema (si ya existe, el registro retorna error 409 Conflict).
- En el endpoint de Login (`/api/auth/login`) la autenticación se realiza con **usuario** y **contraseña** (el email ya no se utiliza para iniciar sesión).

## Endpoints de Cuentas y Transferencias (Pantalla Realizar Pago)

- **`GET /api/cuentas`**: Lista las cuentas bancarias del usuario autenticado (para llenar el selector *"Desde"*).
- **`POST /api/cuentas/validar`**: Valida si el número de cuenta de 10 dígitos existe en la base de datos y retorna los datos del titular verificado:
  - Body: `{ "numero_cuenta": "1009876543" }`
  - Retorna: `{ "valida": true, "cuenta": { "titular": "...", "numero_cuenta": "...", "banco": "Prestige Trust Bank", ... } }`
- **`GET /api/cuentas/validar/:numero_cuenta`**: Misma validación mediante parámetro de ruta.
- **`POST /api/cuentas/transferir`**: Procesa la transferencia bancaria (débito, crédito y creación de movimientos atómicos):
  - Body:
    ```json
    {
      "cuenta_origen": "1002345678",
      "cuenta_destino": "1009876543",
      "monto": 200.00,
      "descripcion": "Almuerzo, Cuota arriendo"
    }
    ```
  - **Lógica ejecutada**:
    1. Verifica que la cuenta origen pertenezca al usuario autenticado.
    2. Valida que la cuenta de destino exista y sea distinta a la de origen.
    3. Comprueba que el saldo sea suficiente.
    4. En una transacción atómica `prisma.$transaction`:
       - Resta el saldo a la cuenta de origen.
       - Suma el saldo a la cuenta de destino.
- **`GET /api/cuentas/bancos`**: Retorna el catálogo de bancos disponibles (Prestige Trust Bank, Banco Pichincha, Banco Guayaquil, Produbanco, etc.).
- **`POST /api/cuentas/validar-interbancaria`**: Valida si el número de cuenta existe en la tabla de simulación interbancaria (`cuentas_interbancarias`):
  - Body: `{ "numero_cuenta": "2204567891", "banco": "Banco Pichincha" }`
  - Retorna datos del titular y banco de destino.
  - Si no existe: Retorna error 404 (`La cuenta interbancaria destino no existe o no se encuentra habilitada`).
- **`POST /api/cuentas/transferir-interbancaria`**: Ejecuta la transferencia interbancaria:
  - Body:
    ```json
    {
      "cuenta_origen": "1002345678",
      "numero_cuenta_destino": "2204567891",
      "monto": 50.00,
      "descripcion": "Pago cuota mensual"
    }
    ```
  - **Lógica ejecutada**:
    1. Verifica la cuenta local de origen y saldo suficiente del emisor.
    2. Valida la cuenta destino en la tabla `cuentas_interbancarias`. Si no existe o no está activa, arroja error 404.
    3. En una transacción atómica `prisma.$transaction`:
       - Debita de la cuenta local del emisor.
       - Acredita en el saldo simulado de la cuenta interbancaria.
       - Registra el movimiento de débito: `Transferencia interbancaria a {titular} ({banco})`.

