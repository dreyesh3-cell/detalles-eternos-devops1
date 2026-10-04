# Cómo probarlo en VS Code (paso a paso)

## Requisitos
1. **Docker Desktop** instalado y abierto (la ballena debe estar en verde).
2. **VS Code**.

## Pasos
1. Descomprime el ZIP y en VS Code: **Archivo → Abrir carpeta…** → elige `devops1-py`.
2. VS Code te ofrecerá instalar las extensiones recomendadas (Python, Docker, REST Client). Acepta.
3. Crea el archivo `.env`: copia `.env.example` y renómbralo a `.env`.
   (En la terminal: `copy .env.example .env` en Windows, `cp .env.example .env` en Mac/Linux.)
4. Levanta todo:
   - Opción A: `Ctrl+Shift+B` (ejecuta la tarea "Docker: levantar todo").
   - Opción B: en la terminal de VS Code (`Ctrl+ñ` o `Ctrl+``): `docker compose up -d --build`
   La primera vez tarda unos minutos porque descarga imágenes.
5. Verifica: `docker compose ps` → los 6 contenedores deben decir **healthy**.
   También puedes verlos en el ícono de la ballena (extensión Docker) en la barra lateral.
6. Prueba:
   - Abre `pruebas.http` y haz clic en **Send Request** sobre cada petición, en orden.
   - O abre en el navegador http://localhost:8001/docs (Swagger) y usa "Try it out".

## Si algo falla
- **"port is already allocated"**: otro programa usa el puerto 5432 u 800X. Cierra ese programa
  o cambia el puerto de la izquierda en `docker-compose.yml` (ej. `"5433:5432"`).
- **Un servicio no queda healthy**: `docker compose logs nombre_servicio` para ver el error.
- **Cambiaste las contraseñas en `.env` y ya no conecta**: la base se creó con las anteriores;
  ejecuta `docker compose down -v` y vuelve a levantar.
- **Cambiaste código Python**: vuelve a ejecutar `docker compose up -d --build`.
