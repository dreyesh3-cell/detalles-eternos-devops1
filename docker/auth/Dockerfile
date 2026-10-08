# syntax=docker/dockerfile:1
# Microservicio: auth  (Python 3.12 + FastAPI)
# Contexto de build: raíz del repositorio (ver docker-compose.yml)

# ---------- Etapa 1: dependencias ----------
FROM python:3.12-slim AS deps
WORKDIR /app
COPY src/auth/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ---------- Etapa 2: imagen final ----------
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    SERVICE_NAME=auth
WORKDIR /app
COPY --from=deps /install /usr/local
COPY src/auth/ .

# Seguridad: no ejecutar como root
RUN useradd --create-home --uid 1000 appuser
USER appuser

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/health', timeout=4)" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
