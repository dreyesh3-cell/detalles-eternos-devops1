"""Conexiones compartidas a PostgreSQL y Redis."""
import os
from contextlib import contextmanager

import psycopg2
import psycopg2.extras
import redis
from fastapi.responses import JSONResponse

DATABASE_URL = os.environ["DATABASE_URL"]
SERVICE_NAME = os.getenv("SERVICE_NAME", "servicio")

r = redis.Redis.from_url(os.environ["REDIS_URL"], decode_responses=True)


@contextmanager
def get_cursor():
    """Abre una conexión, hace commit al terminar y la cierra."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                yield cur
    finally:
        conn.close()


def health():
    try:
        with get_cursor() as cur:
            cur.execute("SELECT 1")
        r.ping()
        return {"service": SERVICE_NAME, "status": "ok"}
    except Exception as err:  # noqa: BLE001
        return JSONResponse(
            status_code=503,
            content={"service": SERVICE_NAME, "status": "error", "error": str(err)},
        )
