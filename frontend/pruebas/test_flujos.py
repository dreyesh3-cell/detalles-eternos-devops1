"""Flujos completos en el navegador: catálogo, carrito, cuentas, compra, mayoristas y administración."""
import re

import pytest
from playwright.sync_api import expect


# ---------------- Catálogo (RF-03, RF-09) ----------------

def test_catalogo_filtra_por_categoria(sitio):
    """Filtrar por Dulcería muestra solo productos de esa categoría."""
    sitio.ir("catalogo.html?categoria=dulceria")
    expect(sitio.p.locator(".resultado")).to_have_text("5 productos")
    categorias = sitio.p.locator("#productos .producto-cat").all_inner_texts()
    assert categorias and all(c.upper() == "DULCERÍA" for c in categorias)


def test_catalogo_solo_disponibles_oculta_agotados(sitio):
    """«Solo productos disponibles» oculta los agotados (RN-01)."""
    sitio.ir("catalogo.html?categoria=dulceria&disponibles=1")
    expect(sitio.p.locator(".resultado")).to_have_text("4 productos")
    expect(sitio.p.locator("#productos .stock--agotado")).to_have_count(0)


def test_catalogo_busqueda(sitio):
    """La búsqueda desde la cabecera lleva al catálogo con los resultados."""
    sitio.ir("index.html")
    sitio.p.fill("#buscar-global", "mazapán")
    sitio.p.press("#buscar-global", "Enter")
    sitio.p.wait_for_url(re.compile(r"catalogo\.html\?q="))
    expect(sitio.p.locator("h1")).to_contain_text("Resultados para «mazapán»")
    expect(sitio.p.locator("#productos .producto-nombre").first).to_contain_text("Mazapán")


def test_catalogo_paginacion(sitio):
    """El catálogo muestra 12 productos por página y la última página muestra el resto."""
    sitio.ir("catalogo.html")
    expect(sitio.p.locator("#productos .producto")).to_have_count(12)
    expect(sitio.p.locator("#paginacion p")).to_have_text("Mostrando 1–12 de 28 productos")
    sitio.p.click("#paginacion [aria-label='Página 3']")
    expect(sitio.p.locator("#productos .producto")).to_have_count(4)
    assert "pagina=3" in sitio.p.url


def test_catalogo_ordenar_por_precio(sitio):
    """Ordenar por menor precio muestra los productos de más barato a más caro."""
    sitio.ir("catalogo.html?orden=precio_asc")
    precios = [float(t.replace("Q", "").replace(",", "")) for t in sitio.p.locator("#productos .precio").all_inner_texts()]
    assert precios == sorted(precios)


@pytest.mark.celular
def test_catalogo_panel_de_filtros_en_celular(sitio):
    """En celular, el botón Filtros abre el panel y "Ver N productos" lo cierra."""
    sitio.ir("catalogo.html")
    sitio.p.click("#abrir-filtros")
    expect(sitio.p.locator("#filtros")).to_have_class(re.compile("abierto"))
    sitio.p.check("input[name='categoria'][value='cafe']")
    expect(sitio.p.locator("#ver-resultados")).to_have_text("Ver 3 productos")
    sitio.p.click("#ver-resultados")
    expect(sitio.p.locator("#filtros")).not_to_have_class(re.compile("abierto"))


def test_producto_agotado_no_se_puede_agregar(sitio):
    """RN-01: en un producto agotado el botón de compra está deshabilitado."""
    sitio.ir("producto.html?id=24")
    expect(sitio.p.get_by_role("button", name="Sin existencias")).to_be_disabled()
    expect(sitio.p.locator(".detalle [data-agregar]")).to_have_count(0)


# ---------------- Carrito (RF-04) ----------------

def test_carrito_agregar_modificar_y_eliminar(sitio):
    """Se agrega un producto, se cambia la cantidad (subtotal Q378.00) y se elimina."""
    sitio.ir("producto.html?id=6")
    sitio.p.click("button[data-agregar='6']")
    expect(sitio.p.locator("#contador-carrito")).to_have_text("1")
    sitio.ir("carrito.html")
    expect(sitio.p.locator(".linea")).to_have_count(1)
    sitio.p.click(".linea [data-paso='1']")
    expect(sitio.p.locator(".linea-subtotal")).to_have_text("Q378.00")
    sitio.p.click(".linea [data-quitar]")
    expect(sitio.p.locator(".vacio h2")).to_have_text("Tu carrito está vacío")


def test_carrito_no_supera_existencias(sitio):
    """RN-01: el selector de cantidad no deja pasar de las existencias (3 carteras)."""
    sitio.ir("producto.html?id=1")
    for _ in range(5):
        boton = sitio.p.locator("[data-cantidad='detalle'] [data-paso='1']")
        if boton.is_enabled():
            boton.click()
    expect(sitio.p.locator("[data-cantidad='detalle'] input")).to_have_value("3")


# ---------------- Cuentas (RF-01, RF-02) ----------------

def test_registro_valida_campos(sitio):
    """El registro muestra mensajes claros si faltan datos o las contraseñas no coinciden."""
    sitio.ir("registro.html")
    sitio.p.click("#crear")
    expect(sitio.p.locator("#error-nombre")).to_have_text("Escribe tu nombre completo.")
    sitio.p.fill("#nombre", "Luis Pérez"); sitio.p.fill("#email", "luis@correo")
    sitio.p.fill("#telefono", "5555-0000"); sitio.p.fill("#password", "Clave12345"); sitio.p.fill("#password2", "Otra12345")
    sitio.p.click("#crear")
    expect(sitio.p.locator("#error-email")).to_contain_text("correo válido")
    sitio.p.fill("#email", "luis@correo.com"); sitio.p.click("#crear")
    expect(sitio.p.locator("#error-password2")).to_have_text("Las contraseñas no coinciden.")


def test_registro_crea_cuenta_e_inicia_sesion(sitio):
    """Un cliente nuevo se registra y entra directo a Mi cuenta."""
    sitio.ir("registro.html")
    sitio.p.fill("#nombre", "Luis Pérez"); sitio.p.fill("#email", "luis@correo.com")
    sitio.p.fill("#telefono", "5555-0000"); sitio.p.fill("#password", "Clave12345"); sitio.p.fill("#password2", "Clave12345")
    sitio.p.click("#crear")
    sitio.p.wait_for_url(re.compile(r"cuenta\.html"))
    expect(sitio.p.locator("h1")).to_contain_text("Luis")
    expect(sitio.p.locator(".tarjeta-puntos .cifra")).to_have_text("0")


def test_registro_rechaza_correo_repetido(sitio):
    """No se puede crear una segunda cuenta con un correo que ya existe."""
    sitio.ir("registro.html")
    sitio.p.fill("#nombre", "Ana Otra"); sitio.p.fill("#email", "ana@test.com")
    sitio.p.fill("#telefono", "5555-0000"); sitio.p.fill("#password", "Clave12345"); sitio.p.fill("#password2", "Clave12345")
    sitio.p.click("#crear")
    expect(sitio.p.locator("#aviso")).to_contain_text("Ya existe una cuenta con ese correo")


def test_login_con_clave_incorrecta(sitio):
    """Con una contraseña incorrecta se muestra un error y no se inicia sesión."""
    sitio.ir("login.html")
    sitio.p.fill("#email", "ana@test.com"); sitio.p.fill("#password", "incorrecta")
    sitio.p.click("#entrar")
    expect(sitio.p.locator("#aviso")).to_contain_text("Correo o contraseña incorrectos")
    assert sitio.p.evaluate("localStorage.getItem('de_sesion')") is None


def test_cerrar_sesion(sitio):
    """Cerrar sesión desde Mi cuenta regresa al inicio sin sesión."""
    sitio.entrar("cliente")
    sitio.p.click("#salir")
    sitio.p.wait_for_url(re.compile(r"index\.html"))
    assert sitio.p.evaluate("localStorage.getItem('de_sesion')") is None


# ---------------- Compra completa (RF-05, RF-06, RF-07, RF-12) ----------------

@pytest.mark.captura
def test_compra_completa_con_tarjeta(sitio):
    """Compra de punta a punta: checkout con exprés local, regalo y 3 cuotas → pago aprobado, Q249.00, +18 puntos y existencias descontadas."""
    sitio.ir("index.html")
    sitio.carrito([(16, 2), (11, 1)])
    sitio.ir("checkout.html")
    sitio.p.wait_for_url(re.compile(r"login\.html"))
    sitio.p.fill("#email", "ana@test.com"); sitio.p.fill("#password", "Cliente123"); sitio.p.click("#entrar")
    sitio.p.wait_for_url(re.compile(r"checkout\.html"))
    expect(sitio.p.locator("input[name='entrega'][value='domicilio']")).to_be_disabled()      # RN-03
    sitio.p.check("input[name='entrega'][value='expres']")
    sitio.p.fill("#direccion", "10a calle 5-20 zona 18")
    sitio.p.check("#empaque_regalo")
    sitio.p.select_option("#cuotas", "3")
    expect(sitio.p.locator("#confirmar")).to_have_text("Confirmar pedido · Q249.00")
    sitio.p.click("#confirmar")
    sitio.p.wait_for_url(re.compile(r"confirmacion\.html\?id=5"), timeout=15000)
    expect(sitio.p.locator("h1")).to_have_text("¡Gracias! Tu pago fue aprobado")
    expect(sitio.p.locator(".numero-pedido")).to_have_text("DE-000005")
    expect(sitio.p.locator("#contador-carrito")).to_have_text("")                               # carrito vaciado
    sitio.ir("cuenta.html")
    expect(sitio.p.locator(".tarjeta-puntos .cifra")).to_have_text("138")                       # 120 + 18
    sitio.ir("producto.html?id=16")
    expect(sitio.p.locator(".detalle-info .stock")).to_contain_text("22 en tienda")             # 24 − 2


def test_compra_con_transferencia_queda_pendiente(sitio):
    """Pagando por transferencia, el pedido queda pendiente y se muestran las cuentas bancarias."""
    sitio.entrar("cliente")
    sitio.carrito([(6, 1)])
    sitio.ir("checkout.html")
    sitio.p.check("input[name='metodo_pago'][value='transferencia']")
    sitio.p.fill("#direccion", "4a avenida 3-15 zona 1")
    sitio.p.click("#confirmar")
    sitio.p.wait_for_url(re.compile(r"confirmacion\.html"), timeout=15000)
    expect(sitio.p.locator("h1")).to_contain_text("Solo falta tu transferencia")
    expect(sitio.p.get_by_text("Datos para tu transferencia")).to_be_visible()


def test_checkout_valida_direccion(sitio):
    """Con envío a domicilio, el checkout no avanza sin una dirección completa."""
    sitio.entrar("cliente")
    sitio.carrito([(6, 1)])
    sitio.ir("checkout.html")
    sitio.p.click("#confirmar")
    expect(sitio.p.locator("#error-direccion")).to_contain_text("dirección completa")
    assert "checkout.html" in sitio.p.url


# ---------------- Mayoristas (RF-13) ----------------

def test_mayorista_ve_lista_y_obtiene_precio_por_volumen(sitio):
    """La cuenta mayorista ve la lista de precios y al agregar 12 jabones el carrito aplica Q25.00 c/u."""
    sitio.entrar("mayorista")
    sitio.ir("mayoristas.html")
    expect(sitio.p.locator("#tabla-precios tbody tr").first).to_be_visible()
    sitio.p.fill("#c-12", "12")
    sitio.p.click("[data-agregar-may='12']")
    sitio.ir("carrito.html")
    expect(sitio.p.locator(".linea").first).to_contain_text("Q25.00 c/u")
    expect(sitio.p.locator(".linea").first).to_contain_text("Precio mayorista")


def test_cliente_solicita_acceso_mayorista(sitio):
    """Un cliente puede solicitar su cuenta mayorista desde el portal."""
    sitio.entrar("cliente")
    sitio.ir("mayoristas.html")
    sitio.p.click("#solicitar")
    expect(sitio.p.get_by_text("Solicitud recibida")).to_be_visible()


# ---------------- Panel de administración (RF-10, RF-11) ----------------

@pytest.mark.captura
def test_admin_resumen(sitio):
    """El resumen del panel muestra pedidos por preparar, pendientes de pago y productos por agotarse."""
    sitio.entrar("admin")
    expect(sitio.p.locator(".cifra-tarjeta")).to_have_count(4)
    expect(sitio.p.get_by_text("Productos por agotarse")).to_be_visible()


def test_admin_ajusta_existencias(sitio):
    """El botón + suma una unidad a las existencias de un producto."""
    sitio.entrar("admin")
    sitio.ir("admin.html#productos")
    fila = sitio.p.locator("#tabla-productos tr").first
    antes = int(fila.locator(".ajuste-stock span").inner_text())
    fila.locator("[data-delta='1']").click()
    expect(fila.locator(".ajuste-stock span")).to_have_text(str(antes + 1))


def test_admin_crea_producto_y_aparece_en_catalogo(sitio):
    """Un producto nuevo creado en el panel aparece en el catálogo."""
    sitio.entrar("admin")
    sitio.ir("admin.html#productos")
    sitio.p.click("#nuevo-producto")
    sitio.p.fill("#p-nombre", "Chamoy líquido, botella 500 ml")
    sitio.p.select_option("#p-categoria", "dulceria")
    sitio.p.select_option("#p-tipo", "perecedero")
    sitio.p.fill("#p-precio", "28"); sitio.p.fill("#p-stock", "15")
    sitio.p.click("#guardar-producto")
    expect(sitio.p.locator("#toast")).to_contain_text("Producto agregado")
    sitio.ir("catalogo.html?q=chamoy")
    expect(sitio.p.locator("#productos .producto-nombre")).to_have_text(["Chamoy líquido, botella 500 ml"])


def test_admin_valida_formulario_de_producto(sitio):
    """El formulario de producto no se guarda si falta el precio."""
    sitio.entrar("admin")
    sitio.ir("admin.html#productos")
    sitio.p.click("#nuevo-producto")
    sitio.p.fill("#p-nombre", "Producto sin precio")
    sitio.p.click("#guardar-producto")
    expect(sitio.p.locator("#error-precio")).to_have_text("Escribe un precio mayor que Q0.")


def test_admin_cambia_estado_de_pedido(sitio):
    """La administración cambia un pedido a «Enviado» y el cliente lo ve en su seguimiento."""
    sitio.entrar("admin")
    sitio.ir("admin.html#pedidos")
    sitio.p.select_option("#e-4", "ENVIADO")
    expect(sitio.p.locator("#toast")).to_contain_text("DE-000004: Enviado")
    sitio.ir("seguimiento.html?id=4")
    expect(sitio.p.locator(".encabezado .estado")).to_have_text("Enviado")


def test_admin_aprueba_mayorista(sitio):
    """La administración aprueba la solicitud mayorista de un cliente."""
    sitio.entrar("admin")
    sitio.ir("admin.html#clientes")
    fila = sitio.p.locator("#tabla-clientes tr", has_text="Carlos Méndez")
    expect(fila).to_contain_text("Pide ser mayorista")
    fila.get_by_role("button", name="Aprobar mayorista").click()
    expect(sitio.p.locator("#toast")).to_contain_text("Cuenta mayorista activada")
    expect(sitio.p.locator("#tabla-clientes tr", has_text="Carlos Méndez")).to_contain_text("Mayorista")
