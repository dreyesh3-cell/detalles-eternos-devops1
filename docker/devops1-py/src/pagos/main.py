"""Microservicio de pagos (simulado): aprueba el pago y marca el pedido como PAGADO."""
import os
from contextlib import asynccontextmanager
from decimal import Decimal

import httpx
from fastapi import FastAPI
from pydantic import BaseModel

from db import get_cursor, health

PEDIDOS_URL = os.getenv("PEDIDOS_URL", "http://pedidos:8003")


@asynccontextmanager
async def lifespan(app: FastAPI):
    with get_cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS pagos (
                id SERIAL PRIMARY KEY,
                pedido_id INT NOT NULL,
                monto NUMERIC(10,2) NOT NULL,
                metodo VARCHAR(20) NOT NULL,
                estado VARCHAR(20) NOT NULL,
                creado_en TIMESTAMP DEFAULT NOW())
        """)
    yield


app = FastAPI(title="Servicio Pagos", lifespan=lifespan)
app.get("/health")(health)


class NuevoPago(BaseModel):
    pedido_id: int
    monto: Decimal
    metodo: str = "TARJETA"


@app.get("/pagos")
def listar():
    with get_cursor() as cur:
        cur.execute("SELECT * FROM pagos ORDER BY id DESC")
        return cur.fetchall()


@app.post("/pagos", status_code=201)
def pagar(p: NuevoPago):
    with get_cursor() as cur:
        cur.execute(
            """INSERT INTO pagos (pedido_id, monto, metodo, estado)
               VALUES (%s, %s, %s, 'APROBADO') RETURNING *""",
            (p.pedido_id, p.monto, p.metodo),
        )
        pago = cur.fetchone()
    try:
        httpx.patch(f"{PEDIDOS_URL}/pedidos/{p.pedido_id}/estado",
                    json={"estado": "PAGADO"}, timeout=5)
    except httpx.HTTPError as err:
        print("No se pudo actualizar el pedido:", err)
    return pago
