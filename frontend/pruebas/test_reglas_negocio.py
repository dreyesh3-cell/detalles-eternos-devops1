"""
Reglas de negocio del proyecto (RN-01 a RN-04, RF-12, RF-13) probadas sobre DE.cotizar, la misma
función que usan el carrito y el checkout para calcular totales, envío y avisos.
Productos de demostración usados:
  1 Cartera Frida Q1,250 (1.8 lb, stock 3, mayorista Q1,050 desde 3) · 5 Cartera negra (agotada)
  6 Paleta de sombras Q189 (0.4 lb) · 11 Limpiador 3.78 L Q54 (líquido, 8.6 lb)
  12 Jabón para trastes Q32 (líquido, mayorista Q25 desde 12) · 13 Detergente Q38 (2.2 lb)
  16 Mazapán Q65 (perecedero, 1.1 lb)
"""
import pytest


@pytest.fixture
def reglas(sitio):
    sitio.ir("index.html")
    return sitio


def item(producto, cantidad=1):
    return {"producto_id": producto, "cantidad": cantidad}


def pedido(items, entrega="domicilio", departamento="Guatemala", municipio="Guatemala", empaque=False):
    return {"items": items, "entrega": entrega, "departamento": departamento, "municipio": municipio, "empaque_regalo": empaque}


# ---------------- RN-04: envío gratis y empaque de regalo ----------------

def test_rn04_envio_gratis_si_supera_600_y_pesa_hasta_10_lb(reglas):
    """RN-04: compra de Q1,250.00 que pesa 1.8 lb tiene envío a domicilio gratis."""
    c = reglas.cotizar(pedido([item(1)], departamento="Quetzaltenango", municipio="Quetzaltenango"))
    assert c["subtotal"] == 1250 and c["envio"] == 0 and c["envio_gratis"] is True
    assert c["total"] == 1250


def test_rn04_exactamente_600_no_es_gratis(reglas):
    """RN-04: el envío es gratis solo si la compra SUPERA Q600.00; con Q600.00 exactos se cobra."""
    propio = [{"id": 99, "nombre": "Producto de prueba", "precio": 600, "peso_lb": 1, "stock": 10, "tipo": "normal", "categoria": "regalos"}]
    c = reglas.cotizar(pedido([item(99)]), productos=propio)
    assert c["envio_gratis"] is False and c["envio"] == 35
    assert c["faltante_envio_gratis"] == 0.01


def test_rn04_mas_de_10_lb_paga_envio_por_peso(reglas):
    """RN-04: aunque supere Q600.00, si pesa más de 10 lb se cobra Q35 hasta 5 lb + Q4 por libra extra."""
    c = reglas.cotizar(pedido([item(1), item(13, 5)]))       # 1.8 + 11.0 = 12.8 lb
    assert c["subtotal"] == 1440 and c["peso_lb"] == 12.8
    assert c["envio_gratis"] is False
    assert c["envio"] == 35 + 8 * 4                           # 8 libras extra (redondeado hacia arriba)


def test_rn04_compra_menor_a_600_paga_tarifa_base(reglas):
    """RN-04: una compra de Q189.00 paga la tarifa base de envío y se indica cuánto falta para envío gratis."""
    c = reglas.cotizar(pedido([item(6)]))
    assert c["envio"] == 35 and c["total"] == 224
    assert c["faltante_envio_gratis"] == 411.01


def test_rn04_empaque_de_regalo_suma_cargo_fijo(reglas):
    """RN-04: el Empaque de Regalo Especial suma su cargo fijo (Q35.00 de ejemplo) al total."""
    sin = reglas.cotizar(pedido([item(6)], entrega="tienda"))
    con = reglas.cotizar(pedido([item(6)], entrega="tienda", empaque=True))
    assert con["cargo_empaque"] == 35 and con["total"] == sin["total"] + 35


def test_recoger_en_tienda_es_gratis(reglas):
    """Recoger en tienda no tiene costo de envío."""
    c = reglas.cotizar(pedido([item(6)], entrega="tienda"))
    assert c["envio"] == 0 and c["total"] == 189


# ---------------- RN-03: perecederos ----------------

def test_rn03_perecederos_no_permiten_envio_a_domicilio(reglas):
    """RN-03: con dulces o café en el pedido solo se permite recoger en tienda o exprés local."""
    c = reglas.cotizar(pedido([item(16)], entrega=""))
    assert "domicilio" not in c["entregas_permitidas"]
    assert set(c["entregas_permitidas"]) == {"tienda", "expres"}
    assert any(a["tipo"] == "perecedero" for a in c["avisos"])


def test_rn03_perecedero_a_domicilio_da_error(reglas):
    """RN-03: si se intenta enviar un perecedero a domicilio, la cotización devuelve un error y no se puede pagar."""
    c = reglas.cotizar(pedido([item(16)], entrega="domicilio", departamento="Zacapa", municipio="Zacapa"))
    assert any("perecederos no se envían" in e for e in c["errores"])


@pytest.mark.parametrize("municipio", ["Guatemala", "Mixco", "Villa Nueva", "San Miguel Petapa"])
def test_rn03_expres_en_capital_y_municipios_cercanos(reglas, municipio):
    """RN-03: el envío exprés local está disponible en la Ciudad de Guatemala y municipios aledaños."""
    c = reglas.cotizar(pedido([item(16)], entrega="expres", municipio=municipio))
    assert c["errores"] == [] and c["envio"] == 30


def test_rn03_expres_fuera_del_area_da_error(reglas):
    """RN-03: el envío exprés no llega a otros departamentos."""
    c = reglas.cotizar(pedido([item(16)], entrega="expres", departamento="Quetzaltenango", municipio="Quetzaltenango"))
    assert "expres" not in c["entregas_permitidas"]
    assert any("exprés solo llega" in e for e in c["errores"])


# ---------------- RN-02: líquidos ----------------

def test_rn02_liquido_a_otro_departamento_muestra_aviso(reglas):
    """RN-02: un líquido enviado a otro departamento genera un aviso de restricciones de envío."""
    c = reglas.cotizar(pedido([item(11)], departamento="Petén", municipio="Flores"))
    assert any(a["tipo"] == "liquido" for a in c["avisos"])
    assert c["errores"] == []


def test_rn02_liquido_dentro_de_guatemala_sin_aviso(reglas):
    """RN-02: el mismo líquido enviado dentro del departamento de Guatemala no muestra aviso de restricción."""
    c = reglas.cotizar(pedido([item(11)]))
    assert not any(a["tipo"] == "liquido" for a in c["avisos"])


# ---------------- RN-01: inventario ----------------

def test_rn01_no_se_puede_pedir_mas_que_las_existencias(reglas):
    """RN-01: pedir 4 carteras cuando solo quedan 3 devuelve un error claro."""
    c = reglas.cotizar(pedido([item(1, 4)]))
    assert c["errores"] == ["Solo quedan 3 unidades de «Cartera de piel Frida, color vino»."]


def test_rn01_producto_agotado_bloquea_la_compra(reglas):
    """RN-01: un producto agotado no se puede comprar."""
    c = reglas.cotizar(pedido([item(5)]))
    assert any("está agotado" in e for e in c["errores"])


# ---------------- RF-13 mayoristas y RF-12 puntos ----------------

def test_rf13_precio_mayorista_desde_la_cantidad_minima(reglas):
    """RF-13: una cuenta mayorista paga Q25.00 por jabón al comprar 12 o más unidades."""
    c = reglas.cotizar(pedido([item(12, 12)], entrega="tienda"), rol="mayorista")
    linea = c["lineas"][0]
    assert linea["precio_unitario"] == 25 and linea["precio_mayorista_aplicado"] is True
    assert c["subtotal"] == 300


def test_rf13_bajo_el_minimo_se_cobra_precio_normal(reglas):
    """RF-13: con 11 unidades (menos del mínimo) la cuenta mayorista paga el precio normal."""
    c = reglas.cotizar(pedido([item(12, 11)], entrega="tienda"), rol="mayorista")
    assert c["lineas"][0]["precio_unitario"] == 32


def test_rf13_cliente_normal_no_recibe_precio_mayorista(reglas):
    """RF-13: un cliente minorista paga el precio normal aunque compre 12 unidades."""
    c = reglas.cotizar(pedido([item(12, 12)], entrega="tienda"), rol="cliente")
    assert c["lineas"][0]["precio_unitario"] == 32 and c["subtotal"] == 384


def test_rf12_puntos_por_cada_10_quetzales(reglas):
    """RF-12: se gana 1 punto por cada Q10.00 del subtotal (regla de ejemplo): Q189.00 → 18 puntos."""
    c = reglas.cotizar(pedido([item(6)], entrega="tienda"))
    assert c["puntos_estimados"] == 18


def test_total_del_recorrido_de_compra(reglas):
    """Caso completo: 2 mazapanes + limpiador, exprés local y empaque de regalo = Q249.00."""
    c = reglas.cotizar(pedido([item(16, 2), item(11)], entrega="expres", empaque=True))
    assert (c["subtotal"], c["envio"], c["cargo_empaque"], c["total"]) == (184, 30, 35, 249)
