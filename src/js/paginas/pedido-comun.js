/* Piezas compartidas por Confirmación, Seguimiento y Mi cuenta: línea de tiempo y detalle del pedido */
(function () {
  const pasos = (pedido) => {
    const envio = pedido.entrega === 'tienda'
      ? [['LISTO_PARA_RECOGER', 'Listo para recoger', 'Te avisamos por WhatsApp; recógelo en zona 18']]
      : [['ENVIADO', 'Enviado', pedido.entrega === 'expres' ? 'En camino con nuestro mensajero' : `En camino con ${pedido.mensajeria || 'la mensajería'}`]];
    return [
      ['PENDIENTE', 'Pedido recibido', 'Registramos tu pedido'],
      ['PAGADO', pedido.metodo_pago === 'contra_entrega' ? 'Pago al entregar' : 'Pago confirmado',
        pedido.metodo_pago === 'transferencia' ? 'Confirmamos tu transferencia' : pedido.metodo_pago === 'contra_entrega' ? 'Pagarás al recibir' : 'Pago con tarjeta aprobado'],
      ['EN_PREPARACION', 'En preparación', 'Estamos empacando tus productos'],
      ...envio,
      ['ENTREGADO', 'Entregado', '¡Que lo disfrutes!'],
    ];
  };

  /** Línea de tiempo del estado del pedido (RF-07). */
  DE.ui.lineaTiempo = (pedido) => {
    if (pedido.estado === 'CANCELADO') return DE.ui.alerta('error', 'Este pedido fue cancelado. Si tienes dudas, escríbenos por WhatsApp.', 'Pedido cancelado');
    const lista = pasos(pedido);
    let actual = lista.findIndex(([e]) => e === pedido.estado);
    if (pedido.metodo_pago === 'contra_entrega' && pedido.estado === 'EN_PREPARACION') actual = 2;
    const fechaDe = (estado) => (pedido.historial || []).find((h) => h.estado === estado)?.fecha;
    return `<ol class="linea-tiempo">${lista.map(([estado, titulo, texto], i) => {
      const clase = i < actual ? 'hecho' : i === actual ? 'actual' : '';
      const fecha = fechaDe(estado);
      return `<li class="${clase}"><span class="punto">${i <= actual ? DE.ui.icono('i-check') : ''}</span>
        <div><strong>${titulo}</strong><small>${texto}${fecha ? ' · ' + DE.fecha(fecha, true) : ''}</small></div></li>`;
    }).join('')}</ol>`;
  };

  /** Resumen de productos, entrega y pago de un pedido. */
  DE.ui.detallePedido = (p) => {
    const entrega = p.entrega === 'tienda' ? 'Recoger en tienda · Zona 18'
      : `${DE.ENTREGAS[p.entrega].nombre}${p.mensajeria ? ' · ' + DE.esc(p.mensajeria) : ''}<br><span class="texto-gris">${DE.esc(p.direccion)}, ${DE.esc(p.municipio)}, ${DE.esc(p.departamento)}</span>`;
    const pago = DE.PAGOS[p.metodo_pago] + (p.metodo_pago === 'tarjeta' && p.cuotas > 1 ? ` · ${p.cuotas} cuotas` : '');
    return `
      <div class="tarjeta">
        <h2>Productos</h2>
        <ul class="mini-lineas" style="max-height:none">${p.items.map((l) => `<li><span>${l.cantidad} × ${DE.esc(l.nombre)}</span><span>${DE.dinero(l.subtotal)}</span></li>`).join('')}</ul>
        <div class="resumen" style="border:0;padding:12px 0 0">
          <dl>
            <dt>Subtotal</dt><dd>${DE.dinero(p.subtotal)}</dd>
            <dt>Envío</dt><dd>${p.envio ? DE.dinero(p.envio) : 'Gratis'}</dd>
            ${p.cargo_empaque ? `<dt>Empaque de regalo</dt><dd>${DE.dinero(p.cargo_empaque)}</dd>` : ''}
            <dt class="total">Total</dt><dd class="total" style="color:var(--rosa)">${DE.dinero(p.total)}</dd>
          </dl>
        </div>
      </div>
      <div class="tarjeta">
        <h2>Entrega y pago</h2>
        <dl class="ficha">
          <dt>Recibe</dt><dd>${DE.esc(p.nombre)} · ${DE.esc(p.telefono)}</dd>
          <dt>Entrega</dt><dd>${entrega}</dd>
          <dt>Pago</dt><dd>${pago}</dd>
          ${p.empaque_regalo ? `<dt>Regalo</dt><dd>Empaque especial${p.mensaje_regalo ? ` · «${DE.esc(p.mensaje_regalo)}»` : ''}</dd>` : ''}
          <dt>Fecha</dt><dd>${DE.fecha(p.creado_en, true)}</dd>
        </dl>
      </div>`;
  };

  /** Instrucciones de transferencia con las cuentas configuradas. */
  DE.ui.instruccionesTransferencia = (p) => `
    <div class="tarjeta">
      <h2>Datos para tu transferencia</h2>
      <p>Transfiere <strong>${DE.dinero(p.total)}</strong> a cualquiera de estas cuentas a nombre de <strong>Detalles Eternos GT</strong> y envíanos el comprobante por WhatsApp indicando el pedido <strong>${DE.numeroPedido(p.id)}</strong>.</p>
      <ul class="mini-lineas" style="margin-top:10px">${DE_CONFIG.NEGOCIO.cuentasBancarias.map((c) => `<li><span>${c.banco}</span><span class="marcador">${DE.esc(c.cuenta)}</span></li>`).join('')}</ul>
    </div>`;
})();
