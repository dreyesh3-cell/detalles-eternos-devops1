"""
Recorrido automático del sitio con capturas de pantalla (evidencias).

Recorre las 14 páginas como lo haría un cliente, un mayorista y la administración:
navega, filtra, agrega al carrito, compra, sigue el pedido y administra la tienda.
Guarda una captura de cada página en celular (390 px) y escritorio (1366 px), y un
registro de cada paso con su resultado.

Requisitos:  pip install playwright   (usa el Microsoft Edge instalado en Windows)
Uso:         python capturas_sitio.py --base http://localhost:8080 --salida ../../docs/evidencias/sitio-web
"""
import argparse
import datetime as dt
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

TAMANOS = {
    "celular": {"viewport": {"width": 390, "height": 844}, "is_mobile": True, "has_touch": True, "device_scale_factor": 2},
    "escritorio": {"viewport": {"width": 1366, "height": 900}, "device_scale_factor": 1},
}


class Recorrido:
    def __init__(self, pagina, base, carpeta, registro):
        self.p, self.base, self.carpeta, self.registro = pagina, base.rstrip("/") + "/", carpeta, registro
        self.n = 0
        self.errores = []
        pagina.on("pageerror", lambda e: self.errores.append(str(e)))
        pagina.on("console", lambda m: self.errores.append(m.text) if m.type == "error" and "404" not in m.text else None)

    def ir(self, ruta):
        self.p.goto(self.base + ruta, wait_until="networkidle")
        self.p.wait_for_timeout(500)

    def captura(self, nombre, descripcion, completa=True):
        self.n += 1
        archivo = f"{self.n:02d}-{nombre}.png"
        self.p.wait_for_timeout(350)
        if completa:
            self.p.evaluate("window.scrollTo(0, 0)")
            # En una captura de página completa, los elementos fijos (barra inferior, WhatsApp) quedarían
            # flotando a media página: se muestran al final de la página solo para la foto.
            self.p.add_style_tag(content=".barra-inferior{position:static!important}.whatsapp,.toast{display:none!important}"
                                         "body{padding-bottom:0!important}")
        self.p.screenshot(path=self.carpeta / archivo, full_page=completa)
        estado = "OK" if not self.errores else "ERRORES: " + " | ".join(self.errores)
        self.registro.append(f"| {self.carpeta.name} | {archivo} | {descripcion} | {estado} |")
        self.errores.clear()

    def entrar(self, email, clave):
        self.ir("login.html")
        self.p.fill("#email", email)
        self.p.fill("#password", clave)
        self.p.click("#entrar")
        self.p.wait_for_url(lambda u: "login.html" not in u)
        self.p.wait_for_load_state("networkidle")

    def salir(self):
        self.p.evaluate("localStorage.removeItem('de_sesion')")


def recorrer(pw, base, salida, tamano, registro, pasos):
    carpeta = salida / tamano
    carpeta.mkdir(parents=True, exist_ok=True)
    nav = pw.chromium.launch(channel="msedge", headless=True)
    ctx = nav.new_context(locale="es-GT", **TAMANOS[tamano])
    r = Recorrido(ctx.new_page(), base, carpeta, registro)
    p = r.p
    celular = tamano == "celular"

    # ---------- Visitante ----------
    r.ir("index.html")
    expect(p.locator("#destacados .producto").first).to_be_visible()
    r.captura("inicio-primera-pantalla", "Inicio tal como se ve al abrirlo (barra inferior fija y botón de WhatsApp)", completa=False)
    r.ir("index.html")
    r.captura("inicio","Inicio: banner de temporada, beneficios, categorías, destacados, puntos, mayoristas y ubicación")

    r.ir("catalogo.html")
    expect(p.locator("#productos .producto").first).to_be_visible()
    r.captura("catalogo", "Catálogo: 12 productos por página, orden y paginación")

    if celular:
        p.click("#abrir-filtros")
        p.check("input[name='categoria'][value='dulceria']")
        p.wait_for_timeout(600)
        r.captura("catalogo-filtros", "Catálogo: panel de filtros abierto en celular (categoría Dulcería marcada)")
        p.click("#ver-resultados")
    else:
        p.check("input[name='categoria'][value='dulceria']")
        p.wait_for_timeout(400)
        p.locator("input[name='disponibles'] + .pista").click()
        p.wait_for_timeout(600)
        r.captura("catalogo-filtros", "Catálogo: filtros Dulcería + solo disponibles, con chips de filtros activos")
    total = p.locator(".resultado").inner_text()
    pasos.append(f"[{tamano}] Filtro por categoría Dulcería → {total}")

    r.ir("catalogo.html?q=cartera")
    r.captura("catalogo-busqueda", "Catálogo: búsqueda «cartera»")

    r.ir("producto.html?id=16")
    r.captura("producto-perecedero", "Detalle de producto perecedero: aviso RN-03 y precio mayorista")
    p.click("[data-cantidad='detalle'] [data-paso='1']")
    p.click("button[data-agregar='16']")
    expect(p.locator("#toast")).to_contain_text("en tu carrito")
    pasos.append(f"[{tamano}] Agregado al carrito: 2 × Mazapán de cacahuate (desde el detalle)")

    r.ir("producto.html?id=11")
    r.captura("producto-liquido", "Detalle de producto líquido: aviso RN-02")
    p.click("button[data-agregar='11']")

    r.ir("producto.html?id=24")
    r.captura("producto-agotado", "Producto agotado (RN-01): botón bloqueado y opción «Avísenme»")

    r.ir("carrito.html")
    expect(p.locator(".linea").first).to_be_visible()
    r.captura("carrito", "Carrito: cantidades, subtotal, progreso hacia envío gratis y avisos RN-02/RN-03")

    r.ir("registro.html")
    r.captura("registro", "Registro de clientes con opción de cuenta mayorista")
    p.click("#crear")
    r.captura("registro-validacion", "Registro: validación de campos con mensajes claros")

    r.ir("checkout.html")                                        # sin sesión → pide iniciar sesión
    p.wait_for_url(lambda u: "login.html" in u)
    r.captura("login", "Inicio de sesión (al intentar pagar sin sesión)")

    # ---------- Cliente: compra completa ----------
    p.fill("#email", "ana@test.com")
    p.fill("#password", "Cliente123")
    p.click("#entrar")
    p.wait_for_url(lambda u: "checkout.html" in u)
    p.wait_for_load_state("networkidle")
    expect(p.locator("#confirmar")).to_be_enabled()
    r.captura("checkout", "Checkout: domicilio bloqueado por perecederos (RN-03), exprés local, pago y resumen")

    p.check("input[name='entrega'][value='expres']")
    p.wait_for_timeout(400)
    p.check("#empaque_regalo")
    p.fill("#mensaje_regalo", "¡Feliz cumpleaños!")
    p.fill("#direccion", "10a calle 5-20 zona 18, colonia Atlántida")
    p.select_option("#cuotas", "3")
    p.wait_for_timeout(600)
    total = p.locator("#confirmar").inner_text()
    p.click("#confirmar")
    p.wait_for_url(lambda u: "confirmacion.html" in u, timeout=15000)
    p.wait_for_load_state("networkidle")
    numero = p.locator(".numero-pedido").inner_text()
    r.captura("confirmacion", "Confirmación: pago aprobado (simulado), número de pedido y línea de tiempo")
    pasos.append(f"[{tamano}] Pedido {numero} creado con exprés local, empaque de regalo y 3 cuotas → «{total}» → {p.locator('h1').inner_text()}")

    r.ir("seguimiento.html")
    r.captura("mis-pedidos", "Mis pedidos: lista con estado de cada pedido")
    r.ir("seguimiento.html?id=1")
    r.captura("seguimiento", "Seguimiento de pedido enviado a Quetzaltenango")

    r.ir("cuenta.html")
    r.captura("mi-cuenta", "Mi cuenta: puntos de fidelización, datos y últimos pedidos")
    pasos.append(f"[{tamano}] Puntos de Ana después de pagar: {p.locator('.tarjeta-puntos .cifra').inner_text()}")
    r.salir()

    # ---------- Mayorista ----------
    r.ir("mayoristas.html")
    r.captura("mayoristas-visitante", "Portal mayorista visto por un visitante")
    r.entrar("mayorista@test.com", "Mayorista123")
    r.ir("mayoristas.html")
    expect(p.locator("#tabla-precios tbody tr").first).to_be_visible()
    r.captura("mayoristas-precios", "Portal mayorista: lista de precios por volumen y pedido por cantidad")
    p.locator("[data-agregar-may='12']").click()
    r.ir("carrito.html")
    r.captura("carrito-mayorista", "Carrito mayorista: precio por volumen aplicado automáticamente")
    linea = p.locator(".linea").first.inner_text()
    precio = next((x for x in linea.splitlines() if "c/u" in x), "")
    pasos.append(f"[{tamano}] Mayorista agrega 12 × Jabón para trastes → {precio.strip()} "
                 f"({'precio mayorista aplicado' if 'mayorista' in linea.lower() else 'SIN precio mayorista'})")
    p.evaluate("localStorage.removeItem('de_carrito')")
    r.salir()

    # ---------- Administración ----------
    r.entrar("admin@detalleseternos.gt", "Admin12345")
    r.ir("admin.html#resumen")
    expect(p.locator(".cifra-tarjeta").first).to_be_visible()
    r.captura("admin-resumen", "Panel: resumen de pedidos por preparar, ventas, solicitudes y productos por agotarse")
    r.ir("admin.html#productos")
    expect(p.locator("#tabla-productos tr").first).to_be_visible()
    r.captura("admin-productos", "Panel: productos con precio y ajuste rápido de existencias")
    p.locator("[data-editar]").first.click()
    r.captura("admin-editar-producto", "Panel: formulario para editar un producto")
    p.locator("#dialogo-producto [data-cerrar]").first.click()
    r.ir("admin.html#pedidos")
    r.captura("admin-pedidos", "Panel: pedidos con cambio de estado")
    p.locator("#tabla-pedidos select").first.select_option("EN_PREPARACION")
    expect(p.locator("#toast")).to_contain_text("En preparación")
    pasos.append(f"[{tamano}] Administración cambia el pedido más reciente a «En preparación»")
    r.ir("admin.html#clientes")
    r.captura("admin-clientes", "Panel: clientes, puntos y aprobación de mayoristas")
    r.salir()

    # ---------- Otras páginas ----------
    r.ir("ayuda.html")
    r.captura("ayuda", "Ayuda: envíos, restricciones, pagos, puntos y preguntas frecuentes")
    r.ir("pagina-que-no-existe.html")
    r.captura("error-404", "Página 404 personalizada")
    nav.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:8080")
    ap.add_argument("--salida", default="capturas")
    args = ap.parse_args()
    salida = Path(args.salida).resolve()
    registro, pasos = [], []
    with sync_playwright() as pw:
        for tamano in TAMANOS:
            recorrer(pw, args.base, salida, tamano, registro, pasos)
    fecha = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    (salida / "RECORRIDO.md").write_text(
        f"# Recorrido automático del sitio\n\nFecha: {fecha} · Sitio: {args.base} · Navegador: Microsoft Edge (Playwright)\n\n"
        "## Pasos del flujo de compra\n\n" + "\n".join(f"- {x}" for x in pasos) +
        "\n\n## Capturas\n\n| Tamaño | Archivo | Qué muestra | Errores de JavaScript |\n|---|---|---|---|\n" + "\n".join(registro) + "\n",
        encoding="utf-8")
    print("\n".join(pasos))
    print(f"\n{len(registro)} capturas en {salida}")


if __name__ == "__main__":
    main()
