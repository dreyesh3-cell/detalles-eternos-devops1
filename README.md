# Detalles Eternos GT

Proyecto de tienda de variedades para el curso de Seminario. Esta primera etapa organiza el código y prepara la infraestructura DevOps.

## Microservicios

- **auth:** registro, inicio de sesión y usuarios.
- **catalogo:** categorías, productos e inventario.
- **pedidos:** carrito y pedidos.
- **pagos:** pagos asociados a los pedidos.

## Estructura

- `src/`: código fuente de los microservicios.
- `docs/`: documentación y modelo de datos.
- `docker/`: archivos relacionados con Docker.
- `tests/`: pruebas del proyecto.
- `docker-compose.yml`: configuración para levantar los servicios y sus dependencias.

## Requisitos

- Git
- Docker Desktop

## Configuración

1. Copiar `.env.example` como `.env`.
2. Ajustar los valores de `.env` para el entorno local.
3. Cuando esté disponible `docker-compose.yml`, iniciar el proyecto con:

   ```bash
   docker compose up --build
