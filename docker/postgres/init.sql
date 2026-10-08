-- Se ejecuta solo la primera vez que se crea el volumen de PostgreSQL.
-- Patrón "una base de datos por microservicio".
CREATE DATABASE auth_db;
CREATE DATABASE catalogo_db;
CREATE DATABASE pedidos_db;
CREATE DATABASE pagos_db;
