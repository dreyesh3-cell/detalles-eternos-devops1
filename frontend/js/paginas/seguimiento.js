/* Página 6b · Mis pedidos y seguimiento: lista de pedidos del cliente y detalle con su estado (RF-07) */
DE.iniciar(async () => {
  if (!DE.sesion.requerir()) return;
  const cont = DE.$('#seguimiento');
  const id = DE.param('id');
  cont.innerHTML = DE.ui.cargando();

  /* ---------- Detalle de un pedido ---------- */
  if (id) {
    try {
      const p = await DE.api.pedidos.obtener(id);
      document.title = `Pedido ${DE.numeroPedido(p.id)} – Detalles Eternos GT`;
      DE.$('#migas').insertAdjacentHTML('beforeend', `<li aria-current="page">${DE.numeroPedido(p.id)}</li>`);
      cont.innerHTML = `
        <div class="encabezado">
          <h1>Pedido ${DE.numeroPedido(p.id)}</h1>
          <p>Realizado el ${DE.fecha(p.creado_en, true)} · ${DE.ui.estado(p.estado)}</p>
        </div>
        <div style="display:grid;gap:16px">
          <div class="tarjeta"><h2>¿Dónde está mi pedido?</h2>${DE.ui.lineaTiempo(p)}</div>
          ${p.metodo_pago === 'transferencia' && p.estado === 'PENDIENTE' ? DE.ui.instruccionesTransferencia(p) : ''}
          ${DE.ui.detallePedido(p)}
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <a class="btn btn-secundario" ${DE.whatsappEnlace(`Hola, tengo una consulta sobre mi pedido ${DE.numeroPedido(p.id)}`)}>${DE.ui.icono('i-chat')}Preguntar por WhatsApp</a>
            <a class="btn btn-borde" href="seguimiento.html">Ver todos mis pedidos</a>
          </div>
        </div>`;
    } catch (e) {
      if (e.estado === 401) throw e;
      cont.innerHTML = e.estado === 404
        ? DE.ui.vacio('i-caja', 'No encontramos ese pedido', 'Revisa el número o elige uno de tu lista.', '<a class="btn btn-primario" href="seguimiento.html">Ver mis pedidos</a>')
        : DE.ui.error(e.message);
    }
    return;
  }

  /* ---------- Lista de pedidos ---------- */
  DE.$('#migas').lastElementChild.innerHTML = 'Mis pedidos';
  DE.$('#migas').lastElementChild.setAttribute('aria-current', 'page');
  try {
    const r = await DE.api.pedidos.listar({ por_pagina: 50 });
    const buscador = `
      <form class="tarjeta" id="buscar-pedido" style="display:flex;gap:10px;flex-wrap:wrap;align-items:end;margin-bottom:16px">
        <div class="campo" style="flex:1 1 200px"><label for="numero">Buscar por número de pedido</label><input id="numero" name="numero" placeholder="DE-000123" inputmode="text"></div>
        <button class="btn btn-primario" type="submit">Buscar</button>
      </form>`;
    cont.innerHTML = `
      <div class="encabezado"><h1>Mis pedidos</h1><p>Consulta en qué va cada uno de tus pedidos.</p></div>
      ${buscador}
      ${r.data.length ? `<div class="lista-pedidos">${r.data.map((p) => `
        <a class="pedido-fila" href="seguimiento.html?id=${p.id}">
          <div class="arriba"><span class="num">${DE.numeroPedido(p.id)}</span>${DE.ui.estado(p.estado)}</div>
          <p>${DE.fecha(p.creado_en)} · ${p.items.reduce((s, l) => s + l.cantidad, 0)} productos · ${DE.ENTREGAS[p.entrega].nombre}</p>
          <p style="color:var(--tinta);font-weight:800">${DE.dinero(p.total)}</p>
        </a>`).join('')}</div>`
        : DE.ui.vacio('i-caja', 'Aún no tienes pedidos', 'Cuando compres, aquí podrás seguir cada pedido paso a paso.', '<a class="btn btn-primario" href="catalogo.html">Ir al catálogo</a>')}`;
    DE.$('#buscar-pedido').addEventListener('submit', (e) => {
      e.preventDefault();
      const n = parseInt(String(e.target.numero.value).replace(/\D/g, ''), 10);
      if (n) location.href = `seguimiento.html?id=${n}`;
    });
  } catch (e) {
    if (e.estado === 401) throw e;
    cont.innerHTML = DE.ui.error(e.message);
  }
});
