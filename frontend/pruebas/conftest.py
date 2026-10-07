"""
Configuración de las pruebas del sitio web (pytest + Playwright).

Cada prueba abre un navegador limpio (Microsoft Edge sin historial), así los datos de
demostración empiezan igual en todas. No se usa la base de datos real.

Ejecutar desde frontend/pruebas:
    pytest --base http://localhost:8080 --html=../evidencias/reporte-pytest.html --self-contained-html
"""
import base64
import datetime as dt
import re
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

CUENTAS = {
    "admin": ("admin@detalleseternos.gt", "Admin12345"),
    "cliente": ("ana@test.com", "Cliente123"),
    "mayorista": ("mayorista@test.com", "Mayorista123"),
}


def pytest_addoption(parser):
    parser.addoption("--base", default="http://localhost:8080", help="Dirección del sitio a probar")
    parser.addoption("--navegador", default="msedge", help="Canal del navegador: msedge o chrome")


@pytest.fixture(scope="session")
def base(pytestconfig):
    return pytestconfig.getoption("base").rstrip("/") + "/"


@pytest.fixture(scope="session")
def navegador(pytestconfig):
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel=pytestconfig.getoption("navegador"), headless=True)
        yield nav
        nav.close()


class Sitio:
    """Atajos para navegar el sitio dentro de una prueba."""

    def __init__(self, pagina, base):
        self.p, self.base = pagina, base
        self.errores_js = []
        pagina.on("pageerror", lambda e: self.errores_js.append(str(e)))

    def ir(self, ruta):
        respuesta = self.p.goto(self.base + ruta, wait_until="networkidle")
        self.p.wait_for_timeout(300)
        return respuesta

    def entrar(self, tipo, volver_a=None):
        email, clave = CUENTAS[tipo]
        self.ir("login.html" + (f"?volver={volver_a}" if volver_a else ""))
        self.p.fill("#email", email)
        self.p.fill("#password", clave)
        self.p.click("#entrar")
        self.p.wait_for_url(lambda u: "login.html" not in u)
        self.p.wait_for_load_state("networkidle")

    def carrito(self, items):
        """Deja el carrito con [(id_producto, cantidad), …] sin pasar por la interfaz."""
        datos = [{"id": i, "cantidad": c} for i, c in items]
        self.p.evaluate("d => localStorage.setItem('de_carrito', JSON.stringify(d))", datos)

    def cotizar(self, datos, rol=None, productos=None):
        """Ejecuta las reglas de negocio (DE.cotizar) con los productos de demostración o con productos inventados."""
        return self.p.evaluate(
            """([datos, rol, propios]) => {
                const lista = propios || DE_DEMO.productos;
                return DE.cotizar(datos, Object.fromEntries(lista.map(p => [p.id, p])), rol);
            }""", [datos, rol, productos])


@pytest.fixture
def sitio(navegador, base, request):
    viewport = {"width": 390, "height": 844} if request.node.get_closest_marker("celular") else {"width": 1366, "height": 900}
    ctx = navegador.new_context(locale="es-GT", viewport=viewport)
    pagina = ctx.new_page()
    s = Sitio(pagina, base)
    request.node._pagina = pagina
    yield s
    ctx.close()


@pytest.hookimpl(trylast=True)   # al final, después de que pytest-metadata llena los datos del entorno
def pytest_configure(config):
    config.addinivalue_line("markers", "celular: la prueba se ejecuta con pantalla de celular (390 px)")
    config.addinivalue_line("markers", "captura: adjunta una captura de pantalla al reporte aunque la prueba pase")
    try:
        from pytest_metadata.plugin import metadata_key
    except ImportError:          # sin pytest-html no hay metadatos
        return
    entorno = config.stash[metadata_key]
    traducido = {ENTORNO_ES.get(k, k): v for k, v in entorno.items()}
    entorno.clear()
    entorno.update(traducido)
    entorno.update({
        "Proyecto": "Detalles Eternos GT – Sitio web",
        "Sitio probado": config.getoption("base"),
        "Navegador": "Microsoft Edge (Playwright, sin interfaz)",
        "Modo de datos": "Demostración (sin base de datos real)",
        "Fecha": dt.datetime.now().strftime("%Y-%m-%d %H:%M"),
    })


# ---------- Personalización del reporte HTML (pytest-html) ----------

def pytest_html_report_title(report):
    report.title = "Reporte de pruebas · Sitio web Detalles Eternos GT"


def pytest_html_results_summary(prefix, summary, postfix):
    prefix.extend([
        "<p>Pruebas automáticas del frontend: carga de las 14 páginas, reglas de negocio RN-01 a RN-04, "
        "catálogo, carrito, compra completa, cuentas, portal mayorista y panel de administración.</p>",
    ])


ENTORNO_ES = {"Platform": "Plataforma", "Packages": "Paquetes", "Plugins": "Complementos"}
ENCABEZADOS_ES = {">Result<": ">Resultado<", ">Test<": ">Prueba<", ">Duration<": ">Duración<", ">Links<": ">Enlaces<"}
RESULTADOS_ES = {"Passed": "Aprobada", "Failed": "Fallida", "Skipped": "Omitida", "Error": "Error",
                 "XFailed": "Fallo esperado", "XPassed": "Aprobada inesperada", "Rerun": "Repetida"}
# Textos fijos de la plantilla de pytest-html (se traducen al terminar de escribir el reporte).
# Ojo: pytest-html usa el texto en inglés del resultado ("Passed") para filtrar y ordenar, así que solo se traduce
# el texto que se ve en la celda (dentro de los datos del reporte), no el valor interno.
PLANTILLA_ES = [
    *[(rf"(col-result\\&#34;&gt;){en}(&lt;)", rf"\g<1>{es}\g<2>") for en, es in RESULTADOS_ES.items()],
    (r">Environment<", ">Entorno<"),
    (r">Summary<", ">Resumen<"),
    (r"No results found\. Check the filters\.", "No hay resultados. Revisa los filtros."),
    (r"\(Un\)check the boxes to filter the results\.", "Marca o desmarca las casillas para filtrar los resultados."),
    (r"There are still tests running\. <br />Reload this page to get the latest results!",
     "Todavía hay pruebas en ejecución. <br />¡Recarga esta página para ver los resultados más recientes!"),
    (r"(\d+) tests? took ([\d:]+)\.", r"\1 pruebas ejecutadas en \2."),
    (r"(\d+) Failed,", r"\1 Fallidas,"),
    (r"(\d+) Passed,", r"\1 Aprobadas,"),
    (r"(\d+) Skipped,", r"\1 Omitidas,"),
    (r"(\d+) Expected failures,", r"\1 Fallos esperados,"),
    (r"(\d+) Unexpected passes,", r"\1 Aprobadas inesperadas,"),
    (r"(\d+) Errors,", r"\1 Errores,"),
    (r"(\d+) Reruns", r"\1 Repetidas,"),
    (r"(\d+) Retried,", r"\1 Reintentadas"),
    (r">Show all details<", ">Mostrar todos los detalles<"),
    (r">Hide all details<", ">Ocultar todos los detalles<"),
    (r"No log output captured\.", "Sin mensajes registrados."),
    (r'content: "expand \[\+\]"', 'content: "ampliar [+]"'),
    (r'content: "collapse \[-\]"', 'content: "reducir [-]"'),
]
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]


def _traducir(celdas, tabla):
    for i, celda in enumerate(celdas):
        for en, es in tabla.items():
            celda = celda.replace(en, es)
        celdas[i] = celda


def pytest_html_results_table_header(cells):
    _traducir(cells, ENCABEZADOS_ES)
    cells.insert(2, "<th>Descripción</th>")


def pytest_html_results_table_row(report, cells):
    cells.insert(2, f"<td>{getattr(report, 'descripcion', '')}</td>")


def pytest_unconfigure(config):
    """Traduce al español los textos fijos del reporte HTML ya escrito por pytest-html."""
    ruta = getattr(config.option, "htmlpath", None)
    if not ruta:
        return
    archivo = Path(ruta)
    if not archivo.is_absolute():
        archivo = Path(config.invocation_params.dir) / archivo
    if not archivo.exists():
        return
    html = archivo.read_text(encoding="utf-8")
    ahora = dt.datetime.now()
    fecha = f"{ahora.day} de {MESES[ahora.month - 1]} de {ahora.year} a las {ahora:%H:%M:%S}"
    html = re.sub(r"Report generated on .*? by (<a [^>]*>pytest-html</a>)\s*v([\d.]+)",
                  rf"Reporte generado el {fecha} con \1 v\2", html, flags=re.S)
    for patron, reemplazo in PLANTILLA_ES:
        html = re.sub(patron, reemplazo, html)
    html = html.replace('<html>', '<html lang="es">', 1)
    archivo.write_text(html, encoding="utf-8")


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    resultado = yield
    reporte = resultado.get_result()
    reporte.descripcion = " ".join((getattr(item.function, "__doc__", "") or "").split())
    pagina = getattr(item, "_pagina", None)
    if reporte.when == "call" and pagina is not None and (reporte.failed or item.get_closest_marker("captura")):
        try:
            import pytest_html
            imagen = base64.b64encode(pagina.screenshot(full_page=False)).decode()
            extras = getattr(reporte, "extras", [])
            extras.append(pytest_html.extras.png(imagen, "Captura"))
            reporte.extras = extras
        except Exception:  # la captura es opcional
            pass
