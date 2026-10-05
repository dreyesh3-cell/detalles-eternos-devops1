/* Página 6a · Confirmación del pedido: resultado del pago, número de pedido y próximos pasos */
DE.iniciar(async () => {
  if (!DE.sesion.requerir()) return;
  const cont = DE.$('#confirmacion');
  const id = DE.param('id');
  if (!id) { location.href = 'seguimiento.html'; return; }
  cont.innerHTML = DE.ui.cargando('Cargando tu pedido…');

  async function pintar() {
    const p = await DE.api.pedidos.obtener(id);
    const pendienteTarjeta = p.estado === 'PENDIENTE' && p.metodo_pago === 'tarjeta';
    const titulo = {
      tarjeta: pendienteTarjeta ? 'Tu pedido está registrado, falta el pago' : '¡Gracias! Tu pago fue aprobado',
      transferencia: '¡Pedido registrado! Solo falta tu transferencia',
      contra_entrega: p.entrega === 'tienda' ? '¡Pedido confirmado! Pagas al recoger' : '¡Pedido confirmado! Pagas al recibir',
    }[p.metodo_pago];
    const listo = !pendienteTarjeta && p.metodo_pago !== 'transferencia';
    const puntos = Math.floor(p.subtotal / DE_CONFIG.REGLAS.puntosCadaQ);
    document.title = `Pedido ${DE.numeroPedido(p.id)} – Detalles Eternos GT`;

    cont.innerHTML = `
      <div class="confirmacion">
        <div class="sello${listo ? '' : ' sello--pendiente'}">${DE.ui.icono(listo ? 'i-check' : 'i-reloj')}</div>
        <h1>${titulo}</h1>
        <p>Número de pedido</p>
        <p class="numero-pedido">${DE.numeroPedido(p.id)}</p>
        <p class="texto-gris">Te enviaremos las actualizaciones por WhatsApp al ${DE.esc(p.telefono)}.</p>
      </div>
      <div style="display:grid;gap:16px;margin-top:16px">
        ${pendienteTarjeta ? `<div class="alerta alerta--aviso">${DE.ui.icono('i-alerta')}<div><strong class="alerta-titulo">El pago no se completó</strong>Puedes intentarlo de nuevo; tus productos quedan apartados.
          <div style="margin-top:10px"><button class="btn btn-primario btn-pequeno" type="button" id="reintentar">Pagar ${DE.dinero(p.total)}</button></div></div></div>` : ''}
        ${p.metodo_pago === 'transferencia' && p.estado === 'PENDIENTE' ? DE.ui.instruccionesTransferencia(p) : ''}
        ${p.metodo_pago === 'tarjeta' && !pendienteTarjeta ? DE.ui.alerta('exito', `Ganaste <strong>${puntos} puntos</strong> con esta compra.`) : ''}
        <div class="tarjeta"><h2>Estado del pedido</h2>${DE.ui.lineaTiempo(p)}</div>
        ${DE.ui.detallePedido(p)}
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
          <a class="btn btn-primario" href="seguimiento.html?id=${p.id}">Seguir mi pedido</a>
          <a class="btn btn-borde" href="catalogo.html">Seguir comprando</a>
        </div>
      </div>`;

    const r = DE.$('#reintentar');
    if (r) r.addEventListener('click', async () => {
      r.disabled = true; r.textContent = 'Procesando pago…';
      try { await DE.api.pagos.pagar(p.id); await pintar(); }
      catch (e) { r.disabled = false; r.textContent = 'Intentar de nuevo'; DE.ui.toast(`${DE.ui.icono('i-alerta')}<span>${DE.esc(e.message)}</span>`); }
    });
  }

  try { await pintar(); }
  catch (e) {
    if (e.estado === 401) throw e;
    cont.innerHTML = e.estado === 404
      ? DE.ui.vacio('i-caja', 'No encontramos ese pedido', 'Revisa el número o busca en tus pedidos.', '<a class="btn btn-primario" href="seguimiento.html">Ver mis pedidos</a>')
      : DE.ui.error(e.message);
  }
});
