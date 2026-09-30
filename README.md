# Detalles Eternos GT – Frontend

Página web de **Detalles Eternos GT**, tienda de variedades mexicana en la zona 18 de la
Ciudad de Guatemala. Es el canal de venta en línea, complementario a la tienda física.

- **Tecnología:** HTML, CSS y JavaScript, sin frameworks.
- **Diseño:** mobile-first, 100 % responsive y con accesibilidad WCAG 2.1 AA.
- **Estilo visual:** *Fiesta Artesanal*, que une el papel picado mexicano con el bordado del huipil
  guatemalteco en una interfaz limpia y moderna.

## Cómo verlo

No necesita instalar nada: abre los archivos `.html` con doble clic en el navegador.

- [diseno/01-inicio-revision.html](diseno/01-inicio-revision.html) muestra la página de Inicio en
  **celular y escritorio lado a lado**.
- [diseno/01-inicio.html](diseno/01-inicio.html) es la página de Inicio sola (cambia el tamaño de
  la ventana para ver cómo se adapta).

## Avance por pantalla

| # | Pantalla | Estado |
|---|---|---|
| 1 | Inicio | ✅ Diseño aprobado |
| 2 | Catálogo | Pendiente |
| 3 | Detalle de producto | Pendiente |
| 4 | Carrito | Pendiente |
| 5 | Checkout | Pendiente |
| 6 | Confirmación y seguimiento de pedido | Pendiente |
| 7 | Registro e inicio de sesión | Pendiente |
| 8 | Mi cuenta | Pendiente |
| 9 | Portal mayorista | Pendiente |
| 10 | Panel de administrador | Pendiente |

## Guía de estilo

| Color | Hex | Uso |
|---|---|---|
| Rosa mexicano | `#C2185B` | Botones y precios |
| Verde quetzal | `#0B6E4F` | Disponibilidad, envío, WhatsApp |
| Añil de tejido | `#2B3A8C` | Enlaces y foco |
| Amarillo maíz | `#F2B705` | Solo decorativo o con texto oscuro |
| Crema | `#FFF8F0` | Fondo general |
| Tinta | `#2A1E17` | Texto principal |

**Tipografías (Google Fonts):** Fraunces para títulos y precios, Nunito Sans para textos y botones.

## Datos pendientes del negocio

Los textos entre corchetes son marcadores que se reemplazarán con datos reales:
`[LOGO]`, `[TELÉFONO WHATSAPP]`, `[DIRECCIÓN EXACTA]`, `[HORARIO]`, `[MAPA]`, `[FOTO]`,
reglas del programa de puntos y lista de precios mayorista.

## Backend

El frontend se conectará a los microservicios del proyecto (auth, catálogo, pedidos y pagos,
en Python + FastAPI con Docker). Por ahora los diseños usan datos de ejemplo.

## Equipo

Universidad Mariano Gálvez de Guatemala – Facultad de Ingeniería en Sistemas de Información.

- Diana Lissette Reyes Hernández
- Walter Caleb Chávez Castillo
- Eberson Estuardo Can Sique
