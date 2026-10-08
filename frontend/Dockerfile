# Imagen del sitio web (nginx + páginas estáticas)
# Construir:  docker build -t devops1/frontend frontend
# Probar:     docker run -d --name devops1-frontend --network devops1_backend -p 8080:80 devops1/frontend:latest→  http://localhost:8080
FROM nginx:1.27-alpine

COPY nginx.conf        /etc/nginx/conf.d/default.conf
COPY proxy_comun.inc   /etc/nginx/conf.d/proxy_comun.inc
COPY index.html catalogo.html producto.html carrito.html checkout.html confirmacion.html \
     seguimiento.html login.html registro.html cuenta.html mayoristas.html ayuda.html admin.html 404.html \
     robots.txt sitemap.xml /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/  /usr/share/nginx/html/js/
COPY img/ /usr/share/nginx/html/img/

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
