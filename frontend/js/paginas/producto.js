/* Página 3 · Detalle de producto: fotos, descripción, precio, precio mayorista, existencias y avisos RN-02 / RN-03 */
DE.iniciar(async () => {
  const cont = DE.$('#detalle');
  const id = Number(DE.param('id'));
  if (!id) {
    cont.innerHTML = DE.ui.vacio('i-buscar', 'Producto no encontrado', 'El enlace que abriste no es válido.', '<a class="btn btn-primario" href="catalogo.html">Ir al catálogo</a>');
    return;
  }
  cont.innerHTML = DE.ui.cargando('Cargando producto…');

  let p;
  try { p = await DE.api.productos.obtener(id); }
  catch (e) {
    cont.innerHTML = e.estado === 404
      ? DE.ui.vacio('i-buscar', 'Este producto ya no está disponible', 'Puede que se haya agotado o que ya no lo vendamos.', '<a class="btn btn-primario" href="catalogo.html">Ver otros productos</a>')
      : DE.ui.error(e.message);
    return;
  }

  const cat = DE.categoria(p.categoria), st = DE.stockEstado(p);
  const sesion = DE.sesion.obtener(), rol = sesion?.usuario.rol;
  document.title = `${p.nombre} – Detalles Eternos GT`;
  DE.$('#migas').insertAdjacentHTML('beforeend',
    `<li><a href="catalogo.html?categoria=${p.categoria}">${cat.corto}</a></li><li aria-current="page">${DE.esc(p.nombre)}</li>`);

  /* Precio mayorista (RF-13): lo ve completo quien tiene cuenta mayorista; los demás ven cómo acceder. */
  let mayorista = '';
  if (p.precio_mayorista) {
    mayorista = rol === 'mayorista'
      ? `<div class="caja-mayorista"><strong>Tu precio mayorista: ${DE.dinero(p.precio_mayorista)}</strong> c/u comprando ${p.minimo_mayorista} unidades o más.</div>`
      : `<div class="caja-mayorista">¿Compras por volumen? Hay <strong>precio mayorista</strong> desde ${p.minimo_mayorista} unidades para clientes mayoristas. <a href="mayoristas.html">Conoce el portal mayorista</a></div>`;
  }
  const aviso = p.tipo === 'perecedero' ? DE.ui.alerta('perecedero', DE.TEXTOS.perecedero, 'Entrega solo local')
    : p.tipo === 'liquido' ? DE.ui.alerta('liquido', DE.TEXTOS.liquido, 'Restricciones de envío') : '';
  const existencias = st.clase === 'agotado'
    ? '<p class="stock stock--agotado">Agotado por ahora</p>'
    : `<p class="stock stock--${st.clase}">${st.clase === 'bajo' ? `¡Solo quedan ${p.stock} unidades!` : `Disponible · ${p.stock} en tienda`}</p>`;

  const compra = st.clase === 'agotado'
    ? `<div class="comprar">
         <button class="btn btn-primario btn-bloque" type="button" disabled>Sin existencias</button>
         <a class="btn btn-secundario btn-bloque" ${DE.whatsappEnlace(`Hola, ¿me avisan cuando vuelva a haber «${p.nombre}»?`)}>${DE.ui.icono('i-campana')}Avísenme cuando vuelva</a>
       </div>`
    : `<div class="comprar">
         <div class="fila-cantidad"><span class="texto-gris" style="font-weight:700">Cantidad</span>${DE.ui.cantidad('detalle', 1, p.stock)}</div>
         <p id="nota-mayorista" class="texto-gris" style="font-size:.88rem" hidden></p>
         <button class="btn btn-primario btn-bloque" type="button" data-agregar="${p.id}" data-stock="${p.stock}" data-nombre="${DE.esc(p.nombre)}" data-cantidad-de="[data-cantidad='detalle']">${DE.ui.icono('i-carrito')}Agregar al carrito</button>
         <button class="btn btn-secundario btn-bloque" type="button" id="comprar-ahora">Comprar ahora</button>
       </div>`;

  cont.innerHTML = `
    <article class="detalle">
      <div class="detalle-foto">${st.clase === 'agotado' ? '<span class="insignia insignia--oscura">Agotado</span>' : ''}${DE.ui.foto(p)}</div>
      <div class="detalle-info">
        <p class="producto-cat">${cat.nombre}</p>
        <h1>${DE.esc(p.nombre)}</h1>
        <p class="detalle-precio">${DE.dinero(p.precio)}</p>
        ${existencias}
        ${mayorista}
        ${aviso}
        ${compra}
        <div class="tarjeta" style="padding:16px">
          <p class="descripcion">${DE.esc(p.descripcion || 'Descripción pendiente.')}</p>
          <dl class="ficha" style="margin-top:12px">
            <dt>Categoría</dt><dd>${cat.nombre}</dd>
            <dt>Peso aprox.</dt><dd>${Number(p.peso_lb).toFixed(1)} lb</dd>
            <dt>Entrega</dt><dd>${p.tipo === 'perecedero' ? 'Recogida en tienda o exprés local' : 'Domicilio, exprés local o recogida en tienda'}</dd>
            <dt>Código</dt><dd>DE-P${String(p.id).padStart(4, '0')}</dd>
          </dl>
        </div>
        <p class="texto-gris" style="font-size:.88rem">${DE.ui.icono('i-camion', 'ico', 'width:18px;height:18px;vertical-align:-4px;color:var(--verde)')} Envío gratis en compras mayores a ${DE.dinero(DE_CONFIG.REGLAS.envioGratisDesde)} con peso de hasta ${DE_CONFIG.REGLAS.envioGratisMaxLb} lb. <a href="ayuda.html#envios">Ver detalles de envío</a></p>
      </div>
    </article>`;

  const selector = DE.$('[data-cantidad="detalle"]');
  if (selector) {
    const nota = DE.$('#nota-mayorista');
    DE.ui.enlazarCantidad(selector, (cantidad) => {
      const { precio, mayorista: aplica } = DE.precioPara(p, cantidad, rol);
      nota.hidden = !aplica;
      if (aplica) nota.textContent = `Con ${cantidad} unidades pagas ${DE.dinero(precio)} c/u (precio mayorista).`;
    });
    DE.$('#comprar-ahora').addEventListener('click', () => {
      DE.carrito.agregar(p.id, DE.ui.leerCantidad(selector), p.stock);
      location.href = 'carrito.html';
    });
  }

  /* Productos relacionados de la misma categoría */
  try {
    const r = await DE.api.productos.listar({ categoria: p.categoria, disponibles: true, por_pagina: 5 });
    const otros = r.data.filter((x) => x.id !== p.id).slice(0, 4);
    if (otros.length) {
      DE.$('#lista-relacionados').innerHTML = otros.map(DE.ui.tarjeta).join('');
      DE.$('#ver-categoria').href = `catalogo.html?categoria=${p.categoria}`;
      DE.$('#relacionados').hidden = false;
    }
  } catch { /* los relacionados son opcionales */ }
});
