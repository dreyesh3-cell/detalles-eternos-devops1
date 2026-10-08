# Contenedores Docker – Proyecto DEVOPS 1 (puntos 2 y 3)

## Arquitectura

| Contenedor | Imagen | Puerto | Base de datos | Redis DB | Función |
|---|---|---|---|---|---|
| postgres | postgres:16-alpine | 5432 | – | – | Base de datos relacional |
| redis | redis:7-alpine | 6379 | – | – | Caché, sesiones y eventos |
| auth | devops1/auth | 8001 | auth_db | 0 | Registro, login y sesiones |
| catalogo | devops1/catalogo | 8002 | catalogo_db | 1 | Productos (con caché) |
| pedidos | devops1/pedidos | 8003 | pedidos_db | 2 | Pedidos (consulta a catálogo) |
| pagos | devops1/pagos | 8004 | pagos_db | 3 | Pagos (actualiza pedidos) |

Tecnología de los microservicios: **Python 3.12 + FastAPI + Uvicorn**, con `psycopg2`
(PostgreSQL), `redis-py` (Redis) y `httpx` (comunicación entre servicios).

Se aplica el patrón **una base de datos por microservicio**: un solo servidor PostgreSQL,
pero cada servicio tiene su propia base (creadas por `docker/postgres/init.sql`).

## Decisiones de los Dockerfiles

- **Multi-stage build**: la etapa `deps` instala las dependencias de `requirements.txt` y la imagen final solo copia lo instalado → imagen más pequeña.
- **python:3.12-slim**: imagen base ligera.
- **Usuario `appuser`**: el contenedor no corre como root (buena práctica de seguridad).
- **HEALTHCHECK**: Docker consulta `/health`, que verifica PostgreSQL y Redis.
- **PYTHONUNBUFFERED=1**: los logs aparecen al instante en `docker compose logs`.
- **.dockerignore**: evita copiar `__pycache__`, `.venv`, `.git`, `.env`, etc.

## Decisiones del docker-compose.yml

- `depends_on` con `condition: service_healthy`: los servicios esperan a que PostgreSQL y Redis estén listos.
- Red interna `backend`: los servicios se comunican por nombre (`http://catalogo:8002`).
- Volúmenes `pgdata` y `redisdata`: los datos persisten aunque se borren los contenedores.
- Variables en `.env` (con valores por defecto) para no escribir contraseñas en el código.
- Ancla YAML `x-servicio-base` para no repetir configuración común.

## Cómo ejecutar

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps          # todos deben quedar "healthy"
docker compose logs -f auth
docker compose down        # detener   (down -v borra también los datos)
```

Cada servicio tiene documentación interactiva (Swagger) en `/docs`:
http://localhost:8001/docs, :8002/docs, :8003/docs, :8004/docs

Las pruebas de extremo a extremo están en `pruebas.http` (extensión REST Client de VS Code).
