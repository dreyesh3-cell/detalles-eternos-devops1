/* Página 1 · Inicio: categorías y productos destacados */
DE.iniciar(async () => {
  DE.$('#papel-picado').outerHTML = DE.papelPicado();
  DE.$('#hero-whatsapp').outerHTML = `<a class="btn btn-secundario" ${DE.whatsappEnlace('Hola, quiero información sobre las canastas navideñas')}>${DE.ui.icono('i-chat')}Pedir por WhatsApp</a>`;
  if (DE.sesion.obtener()) {
    const b = DE.$('#banner-cuenta'); b.href = 'cuenta.html'; b.textContent = 'Ver mis puntos';
  }

  DE.$('#categorias').innerHTML = Object.entries(DE.CATEGORIAS).map(([clave, c]) =>
    `<li><a href="catalogo.html?categoria=${clave}"><span class="cat-icono" style="background:${c.color}">${DE.ui.icono(c.icono)}</span>${c.corto === 'Hogar y limpieza' ? c.corto : c.nombre}</a></li>`).join('');

  const cont = DE.$('#destacados');
  cont.innerHTML = '<div class="esqueleto"></div>'.repeat(4);
  try {
    const r = await DE.api.productos.listar({ destacado: true, por_pagina: 8, orden: 'vendidos' });
    cont.innerHTML = r.data.length ? r.data.map(DE.ui.tarjeta).join('')
      : DE.ui.vacio('i-regalo', 'Pronto tendremos productos destacados', 'Mientras tanto, explora todo el catálogo.', '<a class="btn btn-primario" href="catalogo.html">Ver catálogo</a>');
  } catch (e) {
    cont.classList.remove('productos--carrusel');
    cont.innerHTML = DE.ui.error(e.message);
  }
});
