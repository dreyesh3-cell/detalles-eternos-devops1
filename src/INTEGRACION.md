# Guía de integración: frontend ↔ backend y base de datos

Para quien construye la base de datos y el backend de **Detalles Eternos GT**.
El sitio web ya está terminado y funciona con datos de ejemplo. Este documento dice
**exactamente qué necesita el sitio** para funcionar con los datos reales.

---

## 1. Cómo está hecho el sitio

- HTML + CSS + JavaScript sin frameworks. 14 páginas en la raíz de `frontend/`.
- **Toda la comunicación con el backend está en un solo archivo:** `js/app.js`, sección
  *"5. MODO API"*. Ninguna página llama a `fetch` directamente.
- `js/config.js` tiene un interruptor:

  ```js
  MODO: 'demo',   // funciona sin servidor, con datos de ejemplo en el navegador
  MODO: 'api',    // usa el backend real
  API_URL: '/api' // con el nginx incluido no hay que cambiarlo
  ```

- En modo `'demo'`, `js/datos-demo.js` simula el backend con los **mismos formatos JSON**
  descritos abajo. Si el backend devuelve lo mismo, el sitio funciona sin cambiar nada más.

## 2. Pasos para conectar la base de datos

1. Implementar en el backend los endpoints de la sección 4 (marcados ❌ o ⚠️).
2. En `js/config.js` cambiar `MODO: 'demo'` por `MODO: 'api'`.
3. Levantar el sitio con el nginx incluido (sección 7) en la misma red Docker que los microservicios.
4. Probar el recorrido con `pruebas/capturas_sitio.py` (sección 8).

## 3. Autenticación

- `POST /auth/login` devuelve un **token**. El sitio lo envía en cada petición:
  `Authorization: Bearer <token>`.
- Si una respuesta es **401**, el sitio borra la sesión y manda a iniciar sesión.
- Roles: `cliente`, `mayorista`, `admin`. Las rutas de administración deben responder **403** si el rol no es `admin`.
- Los errores deben venir como `{"detail": "Mensaje en español para el cliente"}`: el sitio muestra ese texto tal cual.

## 4. Endpoints que usa el sitio

Rutas vistas desde el navegador (nginx quita el prefijo `/api/<servicio>` al reenviar).
Estado: ✅ ya existe en el backend actual · ⚠️ existe pero le falta algo · ❌ falta.

### Catálogo (`/api/catalogo`)

| Método y ruta | Uso en el sitio | Estado |
|---|---|---|
| `GET /productos` | Catálogo, inicio, búsqueda, mayoristas, panel | ⚠️ faltan filtros, paginación y campos nuevos |
| `GET /productos/{id}` | Detalle de producto | ⚠️ faltan campos nuevos |
| `GET /categorias` | Conteo por categoría en los filtros | ❌ (el sitio lo calcula si no existe) |
| `POST /productos` *(admin)* | Nuevo producto | ⚠️ falta proteger con rol admin |
| `PUT /productos/{id}` *(admin)* | Editar producto | ❌ |
| `PATCH /productos/{id}/stock` *(admin)* `{"stock": 12}` | Botones − / + de existencias | ❌ |
| `DELETE /productos/{id}` *(admin)* | Quitar de la tienda (se recomienda `activo = false`) | ❌ |
| `GET /inventario/alertas` *(admin)* | "Productos por agotarse" (stock ≤ 5) | ❌ |

**Parámetros de `GET /productos`** (todos opcionales):
`q` (texto), `categoria` (una o varias separadas por coma), `min`, `max` (precio),
`disponibles=true` (stock > 0), `envio_nacional=true` (solo `tipo = normal`), `destacado=true`,
`ids` (lista separada por coma), `orden` (`vendidos` · `precio_asc` · `precio_desc` · `nuevos` · `nombre`),
`pagina` (desde 1), `por_pagina` (12 por defecto).

**Respuesta de `GET /productos`:**
```json
{ "total": 248, "pagina": 1, "paginas": 21, "por_pagina": 12, "data": [ /* Producto */ ] }
```
> Mientras el backend devuelva solo `{"data": [...]}`, el sitio filtra y pagina en el navegador (sirve para pocos productos, no para 10,000).

**Producto:**
```json
{
  "id": 16, "nombre": "Mazapán de cacahuate, caja de 30 piezas",
  "descripcion": "El clásico mazapán mexicano…",
  "categoria": "dulceria",
  "precio": 65.00, "precio_mayorista": 52.00, "minimo_mayorista": 6,
  "stock": 24, "peso_lb": 1.1,
  "tipo": "perecedero",
  "destacado": true, "imagen_url": "", "ventas": 90, "activo": true,
  "creado_en": "2026-09-01T10:00:00Z"
}
```
- `categoria`: `carteras` · `belleza` · `hogar` · `dulceria` · `cafe` · `regalos`
- `tipo`: `normal` · `perecedero` (dulces y café, RN-03) · `liquido` (líquidos y aerosoles, RN-02)
- `precio_mayorista` puede ser `null`. `imagen_url` vacío muestra el marcador `[FOTO]`.

### Autenticación y clientes (`/api/auth`)

| Método y ruta | Uso | Estado |
|---|---|---|
| `POST /register` `{nombre, email, password, telefono, mayorista}` | Crear cuenta | ⚠️ solo guarda email y contraseña |
| `POST /login` `{email, password}` → `{token, usuario}` | Iniciar sesión | ⚠️ devuelve solo `token` (el sitio lo completa con `/validate`) |
| `GET /validate/{token}` → `{valid, userId, rol}` | Respaldo del login | ⚠️ falta `rol` |
| `GET /me` → Usuario | Mi cuenta, puntos, portal mayorista | ❌ |
| `POST /logout` | Cerrar sesión | ❌ (opcional) |
| `POST /me/solicitar-mayorista` | Pedir cuenta mayorista | ❌ |
| `GET /usuarios?q=` *(admin)* → [Usuario] | Panel → Clientes | ❌ |
| `PATCH /usuarios/{id}` *(admin)* `{"rol": "mayorista"}` | Aprobar mayorista | ❌ |

**Usuario:** `{ "id": 2, "nombre": "Ana López", "email": "ana@test.com", "telefono": "5555-1234", "rol": "cliente", "solicita_mayorista": false, "puntos": 120 }`

### Pedidos (`/api/pedidos`)

| Método y ruta | Uso | Estado |
|---|---|---|
| `POST /pedidos/cotizar` → Cotización | Carrito y checkout (totales y envío) | ❌ (el sitio calcula con las mismas reglas si no existe) |
| `POST /pedidos` → Pedido | Confirmar compra | ⚠️ hoy acepta 1 producto; el sitio envía varios |
| `GET /pedidos?estado=&pagina=&por_pagina=` | Mis pedidos (cliente: solo los suyos · admin: todos) | ⚠️ falta filtrar por usuario |
| `GET /pedidos/{id}` | Confirmación y seguimiento | ❌ |
| `PATCH /pedidos/{id}/estado` *(admin)* `{"estado": "ENVIADO"}` | Panel → Pedidos | ✅ (falta proteger con rol admin) |
| `GET /pedidos/resumen` *(admin)* | Panel → Resumen | ❌ |

**Cuerpo de `POST /pedidos`** (el mismo sin datos personales sirve para `/cotizar`):
```json
{
  "items": [ { "producto_id": 16, "cantidad": 2 }, { "producto_id": 11, "cantidad": 1 } ],
  "nombre": "Ana López", "telefono": "5555-1234",
  "entrega": "expres", "departamento": "Guatemala", "municipio": "Guatemala",
  "direccion": "10a calle 5-20 zona 18", "mensajeria": "", "notas": "",
  "empaque_regalo": true, "mensaje_regalo": "¡Feliz cumpleaños!",
  "metodo_pago": "tarjeta", "cuotas": 3, "banco": ""
}
```
- `entrega`: `domicilio` · `expres` · `tienda` · `metodo_pago`: `tarjeta` · `transferencia` · `contra_entrega`
- **El backend no debe confiar en precios enviados por el navegador:** calcula todo con los datos de la base.

**Cotización** (respuesta de `/cotizar`; `POST /pedidos` devuelve el Pedido guardado con estos mismos totales):
```json
{
  "lineas": [ { "producto_id": 16, "nombre": "…", "categoria": "dulceria", "tipo": "perecedero", "cantidad": 2,
                "stock": 24, "precio_unitario": 65.0, "precio_mayorista_aplicado": false, "subtotal": 130.0, "peso_lb": 1.1 } ],
  "subtotal": 184.0, "peso_lb": 10.8, "envio": 30.0, "envio_gratis": false, "cargo_empaque": 35.0, "total": 249.0,
  "entregas_permitidas": ["tienda", "expres"],
  "avisos":  [ { "tipo": "perecedero", "texto": "Tu pedido tiene productos perecederos…" } ],
  "errores": [ "Solo quedan 3 unidades de «…»." ],
  "califica_envio_gratis": false, "faltante_envio_gratis": 416.01, "puntos_estimados": 18
}
```

**Pedido:** los datos del cuerpo + `id`, `usuario_id`, `items` (las `lineas`), `subtotal`, `envio`,
`cargo_empaque`, `total`, `peso_lb`, `estado`, `creado_en`, `actualizado_en` y `historial`
(`[{ "estado": "PAGADO", "fecha": "…" }]`, opcional, para mostrar fechas en la línea de tiempo).

**Estados:** `PENDIENTE` → `PAGADO` → `EN_PREPARACION` → `ENVIADO` o `LISTO_PARA_RECOGER` → `ENTREGADO` · `CANCELADO`.

### Pagos (`/api/pagos`)

| Método y ruta | Uso | Estado |
|---|---|---|
| `POST /pagos` `{"pedido_id": 5}` | Pagar al confirmar | ⚠️ hoy pide `monto`; debe tomarlo del pedido |

Respuesta: `{ "id", "pedido_id", "monto", "metodo", "estado", "referencia", "mensaje", "estado_pedido" }`.
Comportamiento esperado (simulado): tarjeta → `APROBADO` y pedido `PAGADO` · transferencia →
`PENDIENTE_VERIFICACION` (pedido sigue `PENDIENTE`) · contra entrega → pedido `EN_PREPARACION`.
**Nunca pedir ni guardar datos de tarjeta:** con la pasarela real (NeoNet / VisaNet) el pago ocurre en su página.

## 5. Reglas de negocio que el backend debe validar

Los valores están en `js/config.js → REGLAS` (los "de ejemplo" están pendientes de confirmar con el negocio).

| Regla | Qué validar |
|---|---|
| RN-01 Inventario | No vender más que el `stock`; descontar al crear el pedido (en una transacción) y devolver al cancelar. La web debe reflejar la tienda en ≤ 30 s (si hay caché, que dure menos de 30 s). |
| RN-02 Líquidos | Si hay `tipo = liquido` y el envío es a otro departamento, incluir el aviso en `avisos`. |
| RN-03 Perecederos | Si hay `tipo = perecedero`, `entrega = domicilio` no se permite. `expres` solo en los municipios de `REGLAS.municipiosExpres`. |
| RN-04 Envío gratis | Domicilio gratis si `subtotal > 600` **y** `peso_lb ≤ 10`; si no: Q35 hasta 5 lb + Q4 por libra extra (ejemplo). Exprés: Q30. Empaque de regalo: + Q35 (ejemplo). |
| RF-13 Mayoristas | Si el usuario es `mayorista` y la cantidad ≥ `minimo_mayorista`, usar `precio_mayorista`. |
| RF-12 Puntos | Al pasar un pedido a `PAGADO`: 1 punto por cada Q10 del subtotal (ejemplo). |

## 6. Cambios que necesita la base de datos

- **productos:** agregar `descripcion`, `categoria`, `precio_mayorista`, `minimo_mayorista`, `peso_lb`, `tipo`,
  `destacado`, `imagen_url`, `ventas`, `activo`, `creado_en`. Índice por `categoria`.
- **usuarios:** agregar `nombre`, `telefono`, `rol`, `solicita_mayorista`, `puntos`.
- **pedidos:** agregar los datos de entrega y pago del cuerpo de arriba, `subtotal`, `envio`, `cargo_empaque`,
  `peso_lb`, `actualizado_en`; nueva tabla **pedido_items** (`pedido_id`, `producto_id`, `nombre`, `cantidad`,
  `precio_unitario`, `subtotal`, `tipo`).
- **pagos:** agregar `usuario_id`, `referencia`, `cuotas`.

## 7. Publicar en un dominio

El sitio trae su propio servidor: `Dockerfile` + `nginx.conf`. nginx sirve las páginas y reenvía
`/api/<servicio>/` a cada microservicio, así navegador y API comparten dominio y **no hace falta CORS**.

**Opción A: agregarlo al `docker-compose.yml` del proyecto** (lo hace quien administra el compose):
```yaml
  frontend:
    build: ./frontend
    container_name: devops1-frontend
    restart: unless-stopped
    networks: [backend]
    ports:
      - "8080:80"        # en el servidor de producción: "80:80"
    depends_on: [auth, catalogo, pedidos, pagos]
```

**Opción B: solo el sitio** (modo demo, sin backend):
```bash
docker build -t devops1/frontend frontend
docker run -d -p 8080:80 devops1/frontend      # http://localhost:8080
```

**Con un dominio real:**
1. Apuntar el registro DNS `A` del dominio (p. ej. `detalleseternos.gt`) a la IP del servidor.
2. En `nginx.conf` cambiar `server_name _;` por el dominio.
3. Activar HTTPS (requisito de seguridad): lo más simple es poner delante un proxy con certificados automáticos
   (Caddy, Traefik o Cloudflare) o usar `certbot --nginx` en el servidor.
4. Reemplazar `[DOMINIO]` en `robots.txt` y `sitemap.xml`.
5. En `js/config.js`: `MODO: 'api'` y los datos del negocio (`whatsapp`, `direccion`, `horario`, cuentas bancarias).

> Si nginx corre fuera de Docker, cambiar `resolver 127.0.0.11` y los nombres `auth:8001`, etc. por las direcciones reales.

## 8. Cómo probar

```bash
pip install playwright
python pruebas/capturas_sitio.py --base http://localhost:8080 --salida evidencias
```
Recorre las 14 páginas como cliente, mayorista y administración (compra completa incluida) y guarda
capturas en celular y escritorio más un informe `RECORRIDO.md`. Usa el Microsoft Edge instalado.
