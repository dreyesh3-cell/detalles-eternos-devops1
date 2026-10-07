# Detalles Eternos GT – Tienda en línea (DEVOPS 1)

Transformación digital de **Detalles Eternos GT**, una tienda de variedades mexicana ubicada
en la zona 18 de la Ciudad de Guatemala. El proyecto agrega un canal de venta en línea,
complementario a la tienda física.

El backend está construido como **arquitectura de microservicios** en contenedores Docker y
orquestado con Docker Compose. Un usuario se registra e inicia sesión, se crea un producto en
el catálogo, se genera un pedido (que consulta el precio al catálogo) y se paga (lo que marca
el pedido como `PAGADO`).

> **Estado:** backend funcionando · diseño de la pantalla de Inicio aprobado
> ([frontend/diseno/](frontend/diseno/)) · frontend en construcción.

## Arquitectura

| Contenedor | Imagen | Puerto | Base de datos | Redis DB | Función |
|---|---|---|---|---|---|
| auth | devops1/auth | 8001 | auth_db | 0 | Registro, login y sesiones |
| catalogo | devops1/catalogo | 8002 | catalogo_db | 1 | Productos (con caché) |
| pedidos | devops1/pedidos | 8003 | pedidos_db | 2 | Pedidos (consulta a catálogo) |
| pagos | devops1/pagos | 8004 | pagos_db | 3 | Pagos (actualiza pedidos) |
| postgres | postgres:16-alpine | 5432 | – | – | Base de datos relacional |
| redis | redis:7-alpine | 6379 | – | – | Caché, sesiones y eventos |

```
                 ┌────────┐   ┌──────────┐   ┌─────────┐   ┌───────┐
  Cliente ─────► │  auth  │   │ catalogo │◄──│ pedidos │◄──│ pagos │
                 └───┬────┘   └────┬─────┘   └────┬────┘   └───┬───┘
                     │             │              │            │
               ┌─────┴─────────────┴──────────────┴────────────┴─────┐
               │        PostgreSQL (una base por servicio)           │
               │        Redis (sesiones, caché y pub/sub)            │
               └─────────────────────────────────────────────────────┘
```

- **Tecnología:** Python 3.12, FastAPI, Uvicorn, psycopg2, redis-py y httpx.
- **Una base de datos por microservicio:** un solo servidor PostgreSQL con 4 bases
  independientes, creadas por `docker/postgres/init.sql`.
- **Comunicación entre servicios:** por HTTP dentro de la red interna de Docker
  (`http://catalogo:8002`, `http://pedidos:8003`).

Más detalles de los Dockerfiles y del compose en [docs/docker.md](docs/docker.md).

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (en Windows requiere WSL 2)
- Opcional: VS Code con la extensión **REST Client** para ejecutar `pruebas.http`

## Cómo ejecutarlo

1. Crear el archivo de variables de entorno a partir de la plantilla:

   ```bash
   cp .env.example .env        # Linux / Mac / Git Bash
   copy .env.example .env      # Windows (CMD o PowerShell)
   ```

   Opcionalmente, cambia las contraseñas dentro de `.env`.

2. Construir y levantar todos los contenedores:

   ```bash
   docker compose up -d --build
   ```

   La primera vez tarda unos minutos porque descarga las imágenes base.

3. Verificar que los 6 contenedores estén en estado **healthy**:

   ```bash
   docker compose ps
   ```

Guía paso a paso para VS Code: [docs/COMO_PROBAR_EN_VSCODE.md](docs/COMO_PROBAR_EN_VSCODE.md)

## Endpoints

| Servicio | Método | Ruta | Descripción |
|---|---|---|---|
| todos | GET | `/health` | Estado del servicio, PostgreSQL y Redis |
| auth | POST | `/register` | Registra un usuario `{email, password}` |
| auth | POST | `/login` | Devuelve un token de sesión (guardado 1 h en Redis) |
| auth | GET | `/validate/{token}` | Valida un token y devuelve el `userId` |
| catalogo | GET | `/productos` | Lista productos (caché de 60 s en Redis) |
| catalogo | GET | `/productos/{id}` | Obtiene un producto |
| catalogo | POST | `/productos` | Crea un producto `{nombre, precio, stock}` |
| pedidos | GET | `/pedidos` | Lista pedidos |
| pedidos | POST | `/pedidos` | Crea un pedido `{usuario_id, producto_id, cantidad}` |
| pedidos | PATCH | `/pedidos/{id}/estado` | Cambia el estado de un pedido |
| pagos | GET | `/pagos` | Lista pagos |
| pagos | POST | `/pagos` | Registra un pago `{pedido_id, monto}` y marca el pedido como `PAGADO` |

Cada servicio tiene documentación interactiva (Swagger) en `/docs`:
[auth](http://localhost:8001/docs) ·
[catálogo](http://localhost:8002/docs) ·
[pedidos](http://localhost:8003/docs) ·
[pagos](http://localhost:8004/docs)

## Pruebas

El flujo completo está en [pruebas.http](pruebas.http) (extensión REST Client de VS Code):

1. Registro de usuario → 2. Login → 3. Validar token → 4. Crear producto →
5. Listar productos dos veces (la segunda responde desde la caché) →
6. Crear pedido → 7. Pagar → 8. Ver pedidos (estado `PAGADO`) → 9. Ver pagos

Ejemplo con curl:

```bash
curl -X POST http://localhost:8001/register -H "Content-Type: application/json" \
     -d '{"email":"ana@test.com","password":"1234"}'
```

Las salidas reales de estas pruebas están en [docs/evidencias/](docs/evidencias/).

## Comandos útiles

```bash
docker compose ps              # estado de los contenedores
docker compose logs -f auth    # logs en vivo de un servicio
docker compose up -d --build   # reconstruir después de cambiar código
docker compose down            # detener (conserva los datos)
docker compose down -v         # detener y borrar los datos
```

## Estructura del proyecto

```
devops1-py/
├── docker-compose.yml       # Orquestación de los 6 contenedores
├── .env.example             # Plantilla de variables de entorno
├── pruebas.http             # Pruebas de extremo a extremo
├── src/                     # Código de cada microservicio
│   ├── auth/
│   ├── catalogo/
│   ├── pedidos/
│   └── pagos/               # main.py, db.py y requirements.txt en cada uno
├── docker/
│   ├── auth/ catalogo/ pedidos/ pagos/   # Dockerfile de cada servicio
│   └── postgres/init.sql    # Crea las 4 bases de datos
├── frontend/
│   └── diseno/              # Diseños aprobados de cada pantalla (HTML + CSS)
└── docs/
    ├── docker.md            # Decisiones técnicas de Docker
    ├── COMO_PROBAR_EN_VSCODE.md
    └── evidencias/          # Salidas de docker compose ps, docker images y pruebas
```

## Solución de problemas

- **`port is already allocated`:** otro programa usa el puerto. Cambia el puerto de la
  izquierda en `docker-compose.yml` (por ejemplo, `"5433:5432"`).
- **Un servicio no queda healthy:** revisa `docker compose logs <servicio>`.
- **Cambiaste las contraseñas en `.env` y ya no conecta:** la base se creó con las anteriores.
  Ejecuta `docker compose down -v` y vuelve a levantar.
- **`database "auth_db" does not exist`:** `init.sql` solo se ejecuta cuando el volumen está
  vacío. Ejecuta `docker compose down -v` y vuelve a levantar.

## Equipo

Universidad Mariano Gálvez de Guatemala – Facultad de Ingeniería en Sistemas de Información.
Proyecto: *Transformación digital de Detalles Eternos GT*.

- Diana Lissette Reyes Hernández
- Walter Caleb Chávez Castillo
- Eberson Estuardo Can Sique
