"""Carga de las 14 páginas, protección de páginas privadas y elementos comunes."""
import pytest
from playwright.sync_api import expect

PUBLICAS = [
    ("index.html", "Regala sabores y detalles de México"),
    ("catalogo.html", "Catálogo"),
    ("producto.html?id=16", "Mazapán de cacahuate"),
    ("carrito.html", "Tu carrito"),
    ("login.html", "¡Hola de nuevo!"),
    ("registro.html", "Crea tu cuenta"),
    ("mayoristas.html", "Portal mayorista"),
    ("ayuda.html", "¿En qué te ayudamos?"),
]


@pytest.mark.parametrize("ruta,titulo", PUBLICAS, ids=[r for r, _ in PUBLICAS])
def test_pagina_publica_carga(sitio, ruta, titulo):
    """La página pública responde 200, muestra su título, la cabecera y el pie, sin errores de JavaScript."""
    respuesta = sitio.ir(ruta)
    assert respuesta.status == 200
    expect(sitio.p.locator("h1").first).to_contain_text(titulo)
    expect(sitio.p.locator(".cabecera")).to_be_visible()
    expect(sitio.p.locator(".pie")).to_be_visible()
    assert sitio.errores_js == []


def test_pagina_404(sitio):
    """Una dirección que no existe devuelve código 404 con la página personalizada."""
    respuesta = sitio.ir("pagina-que-no-existe.html")
    assert respuesta.status == 404
    expect(sitio.p.locator("h1")).to_contain_text("No encontramos esta página")
    expect(sitio.p.get_by_role("link", name="Ir al inicio", exact=True)).to_be_visible()


@pytest.mark.parametrize("ruta", ["cuenta.html", "seguimiento.html", "checkout.html", "admin.html"])
def test_pagina_privada_pide_sesion(sitio, ruta):
    """Sin sesión, las páginas privadas mandan a iniciar sesión y recuerdan a dónde volver."""
    sitio.ir("index.html")
    sitio.carrito([(6, 1)])
    sitio.ir(ruta)
    sitio.p.wait_for_url(lambda u: "login.html" in u)
    assert f"volver={ruta}" in sitio.p.url


@pytest.mark.parametrize("ruta,titulo", [("cuenta.html", "¡Hola, Ana!"), ("seguimiento.html", "Mis pedidos"),
                                         ("seguimiento.html?id=1", "Pedido DE-000001"), ("confirmacion.html?id=2", "Pedido confirmado")])
def test_pagina_privada_con_sesion(sitio, ruta, titulo):
    """Con sesión de cliente, las páginas privadas muestran la información del cliente."""
    sitio.entrar("cliente")
    sitio.ir(ruta)
    expect(sitio.p.locator("h1").first).to_contain_text(titulo)
    assert sitio.errores_js == []


def test_admin_bloqueado_para_clientes(sitio):
    """Un cliente que abre el panel de administración es enviado al inicio."""
    sitio.entrar("cliente")
    sitio.ir("admin.html")
    sitio.p.wait_for_url(lambda u: u.endswith("index.html"))


def test_formato_de_quetzales(sitio):
    """Los montos se muestran con el formato del negocio: Q1,250.00."""
    sitio.ir("index.html")
    assert sitio.p.evaluate("[DE.dinero(1250), DE.dinero(0), DE.dinero(65.5), DE.dinero(10000)]") == \
        ["Q1,250.00", "Q0.00", "Q65.50", "Q10,000.00"]


def test_enlaces_internos_existen(sitio):
    """Todos los enlaces internos de la cabecera, el pie y la barra inferior llevan a páginas que existen."""
    sitio.ir("index.html")
    enlaces = sitio.p.eval_on_selector_all(
        "a[href$='.html'], a[href*='.html?'], a[href*='.html#']", "as => [...new Set(as.map(a => a.href.split(/[?#]/)[0]))]")
    assert len(enlaces) >= 8
    for url in enlaces:
        assert sitio.p.request.get(url).status == 200, url


@pytest.mark.celular
def test_navegacion_en_celular(sitio):
    """En celular se muestra la barra de navegación inferior y se oculta el menú de escritorio."""
    sitio.ir("index.html")
    expect(sitio.p.locator(".barra-inferior")).to_be_visible()
    expect(sitio.p.locator(".nav-principal")).to_be_hidden()
    expect(sitio.p.locator(".barra-inferior a[aria-current='page']")).to_have_text("Inicio")


def test_modo_demostracion_visible(sitio):
    """Mientras no se conecte la base de datos, el sitio avisa que los datos son de ejemplo."""
    sitio.ir("index.html")
    expect(sitio.p.locator(".barra-demo")).to_contain_text("Versión de demostración")
    assert sitio.p.evaluate("DE_CONFIG.MODO") == "demo"
