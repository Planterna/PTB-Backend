# PTB Backend

Este es el backend construido con **Node.js, TypeScript, Express y Prisma**, diseñado bajo una arquitectura MVC básica.

## Configuración Inicial

1. **Configurar la base de datos PostgreSQL:**
   Asegúrate de tener PostgreSQL (versión 16) instalado y en ejecución. 
   Crea una base de datos, por ejemplo: `ptb_db`.

2. **Configurar Variables de Entorno (.env):**
   Abre el archivo `.env` en la raíz del backend y modifica la variable `DATABASE_URL` para que apunte a tu base de datos local con tus credenciales. Ejemplo:
   ```env
   DATABASE_URL="postgresql://tu_usuario:tu_password@localhost:5432/ptb_db?schema=public"
   ```

3. **Migrar la Base de Datos y Generar Cliente Prisma:**
   Una vez configurado el `.env`, ejecuta en la terminal dentro de esta carpeta (`ptb-backend`):
   ```bash
   npx prisma db push
   # o alternativamente: npx prisma migrate dev --name init
   ```
   Esto creará las tablas en tu base de datos y generará los tipos de TypeScript.

4. **Ejecutar Semillero (Seed):**
   Para poblar la base de datos con un usuario de prueba, sus tarjetas y movimientos, ejecuta:
   ```bash
   npx prisma db seed
   ```

5. **Levantar el Servidor en Desarrollo:**
   ```bash
   npm run dev
   ```
   El servidor escuchará en `http://localhost:3000`.
