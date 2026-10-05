/* Página 4 · Carrito: agregar, modificar y eliminar productos (RF-04) con avisos RN-01 a RN-04 */
DE.iniciar(async () => {
  const cont = DE.$('#carrito');
  const R = DE_CONFIG.REGLAS;

  async function pintar() {
    const items = DE.carrito.comoItems();
    if (!items.length) {
      DE.$('#subtitulo').textContent = 'Todavía no has agregado productos.';
      cont.innerHTML = DE.ui.vacio('i-carrito', 'Tu carrito está vacío', 'Explora el catálogo y agrega tus productos favoritos.', '<a class="btn btn-primario" href="catalogo.html">Ir al catálogo</a>');
      return;
    }
    if (!cont.children.length) cont.innerHTML = DE.ui.cargando('Revisando precios y existencias…');

    let c;
    try { c = await DE.api.pedidos.cotizar({ items }); }
    catch (e) { cont.innerHTML = DE.ui.error(e.message); return; }

    // Si un producto ya no existe en el catálogo, se quita del carrito.
    const vigentes = new Set(c.lineas.map((l) => l.producto_id));
    const quitados = items.filter((i) => !vigentes.has(i.producto_id));
    if (quitados.length) { quitados.forEach((i) => DE.carrito.quitar(i.producto_id)); return; }

    const unidades = c.lineas.reduce((s, l) => s + l.cantidad, 0);
    DE.$('#subtitulo').textContent = `${unidades} ${unidades === 1 ? 'producto' : 'productos'} en tu carrito.`;

    const lineas = c.lineas.map((l) => {
      const url = `producto.html?id=${l.producto_id}`;
      const falta = l.stock <= 0 ? DE.ui.alerta('error', 'Este producto se agotó. Quítalo para continuar.')
        : l.cantidad > l.stock ? DE.ui.alerta('error', `Solo quedan ${l.stock} unidades. Ajusta la cantidad.`) : '';
      return `<article class="linea">
        <a href="${url}" tabindex="-1" aria-hidden="true">${DE.ui.foto(l)}</a>
        <div class="linea-info">
          <p class="producto-cat">${DE.categoria(l.categoria).corto}</p>
          <h2><a href="${url}">${DE.esc(l.nombre)}</a></h2>
          <p style="font-size:.88rem">${DE.dinero(l.precio_unitario)} c/u${l.precio_mayorista_aplicado ? ' <span class="insignia-rol">Precio mayorista</span>' : ''}</p>
          ${DE.ui.avisoCorto(l)}
          ${falta}
          <div class="linea-pie">
            ${DE.ui.cantidad('l' + l.producto_id, Math.max(1, Math.min(l.cantidad, Math.max(l.stock, 1))), Math.max(l.stock, 1), `Cantidad de ${DE.esc(l.nombre)}`)}
            <span class="linea-subtotal">${DE.dinero(l.subtotal)}</span>
          </div>
          <div><button class="btn-texto" type="button" data-quitar="${l.producto_id}" style="color:var(--rojo-error)">Eliminar</button></div>
        </div>
      </article>`;
    }).join('');

    const pct = Math.min(100, Math.round((c.subtotal / R.envioGratisDesde) * 100));
    const progreso = c.subtotal > R.envioGratisDesde
      ? (c.peso_lb <= R.envioGratisMaxLb
        ? `<p><strong style="color:var(--verde)">¡Tu compra tiene envío gratis a domicilio!</strong></p>`
        : `<p>Tu compra supera ${DE.dinero(R.envioGratisDesde)}, pero pesa ${c.peso_lb} lb: el envío gratis aplica hasta ${R.envioGratisMaxLb} lb.</p>`)
      : `<p>Te faltan <strong>${DE.dinero(c.faltante_envio_gratis)}</strong> para tener envío gratis.</p>`;

    const bloqueado = c.errores.length > 0;
    cont.innerHTML = `
      <div class="dos-columnas">
        <div class="lineas">${lineas}
          <a class="btn btn-borde" href="catalogo.html" style="justify-self:start">${DE.ui.icono('i-flecha-izq')}Seguir comprando</a>
        </div>
        <aside class="resumen" aria-labelledby="t-resumen">
          <h2 id="t-resumen">Resumen</h2>
          <div class="progreso-envio">${progreso}<div class="barra" aria-hidden="true"><span style="width:${pct}%"></span></div></div>
          <dl>
            <dt>Subtotal</dt><dd>${DE.dinero(c.subtotal)}</dd>
            <dt>Envío</dt><dd class="texto-gris" style="font-weight:600">Se calcula al pagar</dd>
            <div class="total" style="display:contents"><dt class="total">Total estimado</dt><dd class="total">${DE.dinero(c.subtotal)}</dd></div>
          </dl>
          ${c.avisos.map((a) => DE.ui.alerta(a.tipo, a.texto)).join('')}
          ${bloqueado ? DE.ui.alerta('error', 'Corrige los productos marcados en rojo para continuar.') : ''}
          <a class="btn btn-primario btn-bloque" href="checkout.html" ${bloqueado ? 'aria-disabled="true" tabindex="-1" onclick="return false"' : ''}>Continuar con la compra</a>
          <p class="texto-gris" style="font-size:.82rem">Ganarás aproximadamente <strong>${c.puntos_estimados} puntos</strong> con esta compra.</p>
        </aside>
      </div>`;

    DE.$$('.cantidad', cont).forEach((el) => {
      const pid = Number(el.dataset.cantidad.slice(1));
      DE.ui.enlazarCantidad(el, (v) => DE.carrito.cambiar(pid, v));
    });
  }

  cont.addEventListener('click', (e) => {
    const b = e.target.closest('[data-quitar]');
    if (b) { DE.carrito.quitar(Number(b.dataset.quitar)); DE.ui.toast(`${DE.ui.icono('i-check')}<span>Producto eliminado del carrito</span>`); }
  });

  let espera;
  document.addEventListener('carrito:cambio', () => { clearTimeout(espera); espera = setTimeout(pintar, 250); });
  await pintar();
});
