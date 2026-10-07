# Detalles Eternos GT – Sitio web

Tienda en línea de **Detalles Eternos GT**, tienda de variedades mexicana en la zona 18 de la
Ciudad de Guatemala. Es el canal de venta en línea, complementario a la tienda física.

- **Tecnología:** HTML, CSS y JavaScript, sin frameworks. Servido con nginx (Docker).
- **Diseño:** mobile-first, 100 % responsive, accesibilidad WCAG 2.1 AA.
- **Estilo:** *Fiesta Artesanal*, que une el papel picado mexicano con el huipil guatemalteco.
- **Estado:** las 14 páginas están terminadas y funcionan con **datos de ejemplo**. Están listas para conectarse
  a la base de datos real cambiando una línea (ver [INTEGRACION.md](INTEGRACION.md)).

## Cómo verlo

**Opción 1: sin instalar nada.** Abre `index.html` con doble clic. Funciona en modo demostración: los productos y
pedidos se guardan solo en tu navegador.

**Opción 2: como sitio publicado (Docker).**
```bash
docker build -t devops1/frontend .
docker run -d -p 8080:80 devops1/frontend
```
Abre http://localhost:8080

**Cuentas de prueba** (solo en modo demostración):

| Tipo | Correo | Contraseña |
|---|---|---|
| Administración | `admin@detalleseternos.gt` | `Admin12345` |
| Cliente | `ana@test.com` | `Cliente123` |
| Mayorista | `mayorista@test.com` | `Mayorista123` |

## Páginas

| # | Página | Archivo | Requisitos que cubre |
|---|---|---|---|
| 1 | Inicio | `index.html` | Banner de temporada, categorías, destacados, beneficios, WhatsApp |
| 2 | Catálogo | `catalogo.html` | RF-03, RF-09: filtros, búsqueda, precio, disponibilidad y paginación |
| 3 | Detalle de producto | `producto.html?id=` | Precio, precio mayorista, existencias, avisos RN-02 y RN-03 |
| 4 | Carrito | `carrito.html` | RF-04: agregar, modificar, eliminar; progreso a envío gratis |
| 5 | Checkout | `checkout.html` | RF-05, RF-06, RF-08: entrega, empaque de regalo, pago y envío según RN-04 |
| 6 | Confirmación | `confirmacion.html?id=` | Resultado del pago y número de pedido |
| 7 | Mis pedidos y seguimiento | `seguimiento.html` | RF-07: estado de cada pedido en línea de tiempo |
| 8 | Iniciar sesión | `login.html` | RF-02 |
| 9 | Crear cuenta | `registro.html` | RF-01, con solicitud de cuenta mayorista |
| 10 | Mi cuenta | `cuenta.html` | RF-12: puntos de fidelización y últimos pedidos |
| 11 | Portal mayorista | `mayoristas.html` | RF-13: precios por volumen y pedido por cantidad |
| 12 | Panel de administración | `admin.html` | RF-10, RF-11: productos, existencias, pedidos y clientes |
| 13 | Ayuda | `ayuda.html` | Envíos, restricciones, pagos, puntos y preguntas frecuentes |
| 14 | Página no encontrada | `404.html` | Error 404 personalizado |

## Reglas de negocio visibles

| Regla | Dónde se ve |
|---|---|
| RN-01 Inventario unificado | "Quedan N", "Agotado" con compra bloqueada, validación en carrito y checkout |
| RN-02 Líquidos y aerosoles | Ícono 💧 en el catálogo, aviso en el producto, carrito y checkout |
| RN-03 Perecederos | Ícono ⏱, "Envío a domicilio" deshabilitado; solo recogida o exprés local |
| RN-04 Envío gratis y regalo | Barra de progreso hacia Q600.00, envío gratis hasta 10 lb, Empaque de Regalo Especial |

## Estructura

```
├── index.html … 404.html      14 páginas
├── css/estilos.css            Estilos de todo el sitio
├── js/
│   ├── config.js              ⚙️ Configuración: modo demo/api, datos del negocio, tarifas
│   ├── app.js                 Núcleo: formato Q, sesión, carrito, reglas, conexión con la API, cabecera y pie
│   ├── datos-demo.js          Productos, cuentas y pedidos de ejemplo
│   └── paginas/*.js           Lógica de cada página
├── img/favicon.svg
├── nginx.conf, proxy_comun.inc, Dockerfile   Publicación con nginx
├── robots.txt, sitemap.xml
├── INTEGRACION.md             Guía para conectar la base de datos y publicar en un dominio
├── pruebas/capturas_sitio.py  Recorrido automático con capturas de pantalla
├── evidencias/                Capturas de cada página (celular y escritorio) y RECORRIDO.md
└── diseno/                    Diseños aprobados (Inicio y Catálogo)
```

## Pruebas automáticas (pytest)

69 pruebas en `pruebas/`: carga de las 14 páginas, reglas de negocio RN-01 a RN-04, precios mayoristas, puntos,
catálogo, carrito, cuentas, compra completa y panel de administración. Usan el Microsoft Edge instalado.

```bash
cd pruebas
pip install -r requirements.txt
pytest --base http://localhost:8080 --html=../evidencias/reporte-pytest.html --self-contained-html
```

Último resultado: **69 de 69 pruebas aprobadas**. Reporte: [evidencias/reporte-pytest.html](evidencias/reporte-pytest.html).

## Datos pendientes del negocio

Los textos entre corchetes se reemplazan en `js/config.js` y en las páginas:
`[LOGO]`, `[TELÉFONO WHATSAPP]`, `[DIRECCIÓN EXACTA]`, `[HORARIO]`, `[MAPA]`, `[FOTO]`,
`[NÚMERO DE CUENTA …]`, `[REGLAS DE PUNTOS POR DEFINIR]`, `[LISTA DE PRECIOS MAYORISTA]`, `[DOMINIO]`.
Las tarifas de envío y el precio del empaque de regalo son **de ejemplo** y se cambian en `js/config.js`.

## Equipo

Universidad Mariano Gálvez de Guatemala – Facultad de Ingeniería en Sistemas de Información.

- Diana Lissette Reyes Hernández
- Walter Caleb Chávez Castillo
- Eberson Estuardo Can Sique
