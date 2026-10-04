"""Microservicio de pedidos: consulta precios al servicio de catálogo."""
import json
import os
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel

from db import get_cursor, health, r

CATALOGO_URL = os.getenv("CATALOGO_URL", "http://catalogo:8002")


@asynccontextmanager
async def lifespan(app: FastAPI):
    with get_cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS pedidos (
                id SERIAL PRIMARY KEY,
                usuario_id INT NOT NULL,
                producto_id INT NOT NULL,
                cantidad INT NOT NULL,
                total NUMERIC(10,2) NOT NULL,
                estado VARCHAR(20) NOT NULL,
                creado_en TIMESTAMP DEFAULT NOW())
        """)
    yield


app = FastAPI(title="Servicio Pedidos", lifespan=lifespan)
app.get("/health")(health)


class NuevoPedido(BaseModel):
    usuario_id: int
    producto_id: int
    cantidad: int = 1


class CambioEstado(BaseModel):
    estado: str


@app.get("/pedidos")
def listar():
    with get_cursor() as cur:
        cur.execute("SELECT * FROM pedidos ORDER BY id DESC")
        return cur.fetchall()


@app.post("/pedidos", status_code=201)
def crear(p: NuevoPedido):
    resp = httpx.get(f"{CATALOGO_URL}/productos/{p.producto_id}", timeout=5)
    if resp.status_code != 200:
        raise HTTPException(404, "Producto no existe en catálogo")
    total = float(resp.json()["precio"]) * p.cantidad

    with get_cursor() as cur:
        cur.execute(
            """INSERT INTO pedidos (usuario_id, producto_id, cantidad, total, estado)
               VALUES (%s, %s, %s, %s, 'PENDIENTE') RETURNING *""",
            (p.usuario_id, p.producto_id, p.cantidad, total),
        )
        pedido = cur.fetchone()
    # Evento para que otros servicios se enteren (pub/sub de Redis)
    r.publish("pedidos:creados", json.dumps(jsonable_encoder(pedido)))
    return pedido


@app.patch("/pedidos/{pedido_id}/estado")
def cambiar_estado(pedido_id: int, cambio: CambioEstado):
    with get_cursor() as cur:
        cur.execute(
            "UPDATE pedidos SET estado = %s WHERE id = %s RETURNING *",
            (cambio.estado, pedido_id),
        )
        pedido = cur.fetchone()
    if not pedido:
        raise HTTPException(404, "Pedido no encontrado")
    return pedido
