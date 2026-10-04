/* Página 5 · Checkout: datos de entrega, tipo de entrega, empaque de regalo, forma de pago y resumen (RF-05, RF-06, RF-08) */
DE.iniciar(async () => {
  const sesion = DE.sesion.requerir(); if (!sesion) return;
  if (!DE.carrito.unidades()) { location.href = 'carrito.html'; return; }

  const R = DE_CONFIG.REGLAS;
  const form = DE.$('#form-checkout');
  const el = form.elements;
  const guardada = DE.almacen.leer('de_ultima_entrega', {});

  /* ---------- Valores iniciales ---------- */
  el.nombre.value = guardada.nombre || sesion.usuario.nombre || '';
  el.telefono.value = guardada.telefono || sesion.usuario.telefono || '';
  DE.$('#departamento').innerHTML = DE.DEPARTAMENTOS.map((d) => `<option${d === (guardada.departamento || 'Guatemala') ? ' selected' : ''}>${d}</option>`).join('');
  DE.$('#mensajeria').innerHTML = DE_CONFIG.MENSAJERIAS.map((m) => `<option>${m}</option>`).join('');
  el.direccion.value = guardada.direccion || '';
  DE.$('#precio-empaque').textContent = '+' + DE.dinero(R.cargoEmpaqueRegalo);
  DE.$('#texto-empaque').textContent = DE.TEXTOS.empaque;
  DE.$('[data-precio="expres"]').textContent = DE.dinero(R.tarifaExpres);

  function pintarMunicipio() {
    const dep = el.departamento.value, previo = el.municipio ? el.municipio.value : guardada.municipio || '';
    DE.$('#campo-municipio').innerHTML = dep === 'Guatemala'
      ? `<label for="municipio">Municipio</label><select id="municipio" name="municipio" autocomplete="address-level2">${DE.MUNICIPIOS_GUATEMALA.map((m) => `<option${m === previo ? ' selected' : ''}>${m}</option>`).join('')}</select>`
      : `<label for="municipio">Municipio</label><input id="municipio" name="municipio" autocomplete="address-level2" value="${DE.esc(DE.MUNICIPIOS_GUATEMALA.includes(previo) ? '' : previo)}"><p class="error" id="error-municipio"></p>`;
  }
  pintarMunicipio();

  /* Solo se envían los datos que aplican a la opción elegida (p. ej. la mensajería solo para envío a domicilio). */
  const leer = () => {
    const entrega = (form.querySelector('input[name="entrega"]:checked') || {}).value || '';
    const metodo = form.querySelector('input[name="metodo_pago"]:checked').value;
    const tienda = entrega === 'tienda';
    return {
      items: DE.carrito.comoItems(),
      nombre: el.nombre.value.trim(), telefono: el.telefono.value.trim(), entrega,
      departamento: tienda ? 'Guatemala' : el.departamento.value, municipio: tienda ? 'Guatemala' : (el.municipio.value || '').trim(),
      direccion: tienda ? '' : el.direccion.value.trim(), mensajeria: entrega === 'domicilio' ? el.mensajeria.value : '',
      notas: el.notas.value.trim(), empaque_regalo: el.empaque_regalo.checked,
      mensaje_regalo: el.empaque_regalo.checked ? el.mensaje_regalo.value.trim() : '',
      metodo_pago: metodo, cuotas: metodo === 'tarjeta' ? Number(el.cuotas.value) : 1, banco: metodo === 'transferencia' ? el.banco.value : '',
    };
  };

  /* ---------- Mostrar u ocultar campos según las opciones ---------- */
  function ajustarCampos() {
    const d = leer();
    DE.$('#datos-direccion').hidden = d.entrega === 'tienda';
    DE.$('#campo-mensajeria').hidden = d.entrega !== 'domicilio';
    DE.$('#campo-mensaje').hidden = !d.empaque_regalo;
    DE.$('#campo-cuotas').hidden = d.metodo_pago !== 'tarjeta';
    DE.$('#campo-banco').hidden = d.metodo_pago !== 'transferencia';
    DE.$('#titulo-contra').textContent = d.entrega === 'tienda' ? 'Pagar al recoger en tienda' : 'Pago contra entrega';
    DE.$('#texto-contra').textContent = d.entrega === 'tienda' ? 'Pagas en efectivo o con tarjeta cuando recojas tu pedido.' : 'Pagas en efectivo al recibir tu pedido.';
  }

  /* ---------- Resumen con envío calculado (RN-04) ---------- */
  let ultima = null, turno = 0;
  async function recalcular() {
    ajustarCampos();
    const d = leer(), miTurno = ++turno;
    let c;
    try { c = await DE.api.pedidos.cotizar(d); }
    catch (e) { DE.$('#resumen-cuerpo').innerHTML = DE.ui.error(e.message); return; }
    if (miTurno !== turno) return;
    ultima = c;

    // RN-03: deshabilitar las entregas que no aplican y explicar por qué
    ['domicilio', 'expres'].forEach((tipo) => {
      const input = form.querySelector(`input[name="entrega"][value="${tipo}"]`);
      const permitido = c.entregas_permitidas.includes(tipo);
      input.disabled = !permitido;
      DE.$(`[data-motivo="${tipo}"]`).textContent = permitido ? ''
        : tipo === 'domicilio' ? 'No disponible: tu pedido tiene productos perecederos.' : 'No disponible para el municipio seleccionado.';
      if (!permitido && input.checked) { input.checked = false; }
    });
    DE.$('[data-precio="domicilio"]').textContent = c.califica_envio_gratis ? 'Gratis' : `Desde ${DE.dinero(R.tarifaDomicilio)}`;
    if (!form.querySelector('input[name="entrega"]:checked')) {
      form.querySelector(`input[name="entrega"][value="${c.entregas_permitidas.includes('domicilio') ? 'domicilio' : 'tienda'}"]`).checked = true;
      return recalcular();
    }

    const d2 = leer();
    const envio = d2.entrega === 'tienda' ? 'Gratis' : c.envio_gratis ? '<span style="color:var(--verde)">Gratis</span>' : DE.dinero(c.envio);
    DE.$('#resumen-cuerpo').innerHTML = `
      <ul class="mini-lineas">${c.lineas.map((l) => `<li><span>${l.cantidad} × ${DE.esc(l.nombre)}</span><span>${DE.dinero(l.subtotal)}</span></li>`).join('')}</ul>
      <dl style="margin-top:12px">
        <dt>Subtotal</dt><dd>${DE.dinero(c.subtotal)}</dd>
        <dt>Envío (${DE.ENTREGAS[d2.entrega].nombre.toLowerCase()})</dt><dd>${envio}</dd>
        ${c.cargo_empaque ? `<dt>Empaque de regalo</dt><dd>${DE.dinero(c.cargo_empaque)}</dd>` : ''}
        <dt class="total">Total</dt><dd class="total" style="color:var(--rosa);font-family:var(--font-titulo);font-size:1.35rem">${DE.dinero(c.total)}</dd>
      </dl>
      <p class="texto-gris" style="font-size:.82rem;margin-top:6px">Peso aproximado: ${c.peso_lb} lb${d2.entrega === 'domicilio' && !c.envio_gratis ? ` · Tarifa: ${DE.dinero(R.tarifaDomicilio)} hasta ${R.lbIncluidas} lb + ${DE.dinero(R.tarifaLbExtra)} por libra extra` : ''}</p>
      ${d2.entrega === 'domicilio' && !c.envio_gratis && c.faltante_envio_gratis > 0 ? `<p style="font-size:.88rem;margin-top:8px">Agrega <strong>${DE.dinero(c.faltante_envio_gratis)}</strong> más para tener envío gratis.</p>` : ''}
      <div style="display:grid;gap:8px;margin-top:12px">${c.avisos.map((a) => DE.ui.alerta(a.tipo, a.texto)).join('')}${c.errores.map((e) => DE.ui.alerta('error', DE.esc(e))).join('')}</div>
      <button class="btn btn-primario btn-bloque" type="submit" id="confirmar" style="margin-top:14px" ${c.errores.length ? 'disabled' : ''}>Confirmar pedido · ${DE.dinero(c.total)}</button>
      <p class="texto-gris" style="font-size:.8rem;margin-top:8px">Al confirmar aceptas que te contactemos por WhatsApp para coordinar la entrega. Ganarás ${c.puntos_estimados} puntos al pagar.</p>
      <a class="btn-texto" href="carrito.html">Modificar carrito</a>`;
  }

  let espera;
  const programar = () => { clearTimeout(espera); espera = setTimeout(recalcular, 200); };
  form.addEventListener('change', (e) => { if (e.target.name === 'departamento') pintarMunicipio(); programar(); });
  form.addEventListener('input', (e) => { if (e.target.name === 'municipio') programar(); });

  /* ---------- Confirmar pedido y pagar ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const V = DE.validaciones;
    const d = leer();
    const reglas = { nombre: V.requerido('Escribe el nombre de quien recibe.'), telefono: V.telefono };
    if (d.entrega !== 'tienda') {
      reglas.direccion = (v) => (v.length >= 8 ? '' : 'Escribe la dirección completa (calle, número y zona).');
      if (el.municipio.tagName === 'INPUT') reglas.municipio = V.requerido('Escribe el municipio.');
    }
    if (!DE.ui.validar(form, reglas)) return;
    if (!ultima || ultima.errores.length) return;

    const boton = DE.$('#confirmar');
    boton.disabled = true; boton.textContent = 'Procesando tu pedido…';
    DE.$('#mensaje-error').innerHTML = '';
    try {
      const pedido = await DE.api.pedidos.crear(d);
      DE.almacen.guardar('de_ultima_entrega', { nombre: d.nombre, telefono: d.telefono, departamento: d.departamento, municipio: d.municipio, direccion: d.direccion });
      DE.carrito.vaciar();
      try { await DE.api.pagos.pagar(pedido.id); } catch { /* el pago se puede reintentar desde la confirmación */ }
      location.href = `confirmacion.html?id=${pedido.id}`;
    } catch (err) {
      DE.$('#mensaje-error').innerHTML = DE.ui.alerta('error', DE.esc(err.message), 'No pudimos crear tu pedido');
      DE.$('#mensaje-error').scrollIntoView({ block: 'center' });
      recalcular();
    }
  });

  await recalcular();
});
