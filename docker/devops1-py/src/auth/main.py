"""Microservicio de autenticación: registro, login y validación de sesión."""
import hashlib
import secrets
from contextlib import asynccontextmanager

import psycopg2
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from db import get_cursor, health, r


@asynccontextmanager
async def lifespan(app: FastAPI):
    with get_cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                email VARCHAR(150) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                creado_en TIMESTAMP DEFAULT NOW())
        """)
    yield


app = FastAPI(title="Servicio Auth", lifespan=lifespan)
app.get("/health")(health)


class Credenciales(BaseModel):
    email: str
    password: str


def hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000).hex()


@app.post("/register", status_code=201)
def register(datos: Credenciales):
    salt = secrets.token_hex(16)
    try:
        with get_cursor() as cur:
            cur.execute(
                "INSERT INTO usuarios (email, password_hash, salt) VALUES (%s, %s, %s) RETURNING id, email",
                (datos.email, hash_password(datos.password, salt), salt),
            )
            return cur.fetchone()
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(409, "El usuario ya existe")


@app.post("/login")
def login(datos: Credenciales):
    with get_cursor() as cur:
        cur.execute("SELECT * FROM usuarios WHERE email = %s", (datos.email,))
        user = cur.fetchone()
    if not user or hash_password(datos.password, user["salt"]) != user["password_hash"]:
        raise HTTPException(401, "Credenciales inválidas")
    token = secrets.token_hex(32)
    r.set(f"session:{token}", user["id"], ex=3600)  # sesión de 1 hora en Redis
    return {"token": token}


@app.get("/validate/{token}")
def validate(token: str):
    user_id = r.get(f"session:{token}")
    if not user_id:
        raise HTTPException(401, "Token inválido o expirado")
    return {"valid": True, "userId": int(user_id)}
