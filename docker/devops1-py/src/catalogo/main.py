"""Microservicio de catálogo de productos, con caché en Redis."""
import json
from contextlib import asynccontextmanager
from decimal import Decimal

from fastapi import FastAPI, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel

from db import get_cursor, health, r

CACHE_KEY = "catalogo:productos"


@asynccontextmanager
async def lifespan(app: FastAPI):
    with get_cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS productos (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(150) NOT NULL,
                precio NUMERIC(10,2) NOT NULL,
                stock INT DEFAULT 0)
        """)
    yield


app = FastAPI(title="Servicio Catálogo", lifespan=lifespan)
app.get("/health")(health)


class Producto(BaseModel):
    nombre: str
    precio: Decimal
    stock: int = 0


@app.get("/productos")
def listar():
    cache = r.get(CACHE_KEY)
    if cache:
        return {"origen": "cache", "data": json.loads(cache)}
    with get_cursor() as cur:
        cur.execute("SELECT * FROM productos ORDER BY id")
        data = jsonable_encoder(cur.fetchall())
    r.set(CACHE_KEY, json.dumps(data), ex=60)  # caché de 60 s
    return {"origen": "db", "data": data}


@app.get("/productos/{producto_id}")
def obtener(producto_id: int):
    with get_cursor() as cur:
        cur.execute("SELECT * FROM productos WHERE id = %s", (producto_id,))
        producto = cur.fetchone()
    if not producto:
        raise HTTPException(404, "Producto no encontrado")
    return producto


@app.post("/productos", status_code=201)
def crear(p: Producto):
    with get_cursor() as cur:
        cur.execute(
            "INSERT INTO productos (nombre, precio, stock) VALUES (%s, %s, %s) RETURNING *",
            (p.nombre, p.precio, p.stock),
        )
        nuevo = cur.fetchone()
    r.delete(CACHE_KEY)  # invalidar caché
    return nuevo
