/* Página 10 · Panel de administración: productos, precios, inventario (RF-10), pedidos y clientes (RF-11) */
DE.iniciar(async () => {
  if (!DE.sesion.requerir('admin')) return;
  const aviso = (texto, ok = true) => DE.ui.toast(`${DE.ui.icono(ok ? 'i-check' : 'i-alerta')}<span>${texto}</span>`);
  const fallo = (e) => {
    if (e.estado === 401) { DE.sesion.cerrar(); location.href = 'login.html?volver=admin.html'; return; }
    aviso(DE.esc(e.message), false);
  };

  /* ---------- Pestañas (la sección activa queda en la dirección: admin.html#pedidos) ---------- */
  const cargadores = {};
  function mostrar(tab) {
    if (!cargadores[tab]) tab = 'resumen';
    DE.$$('[role="tab"]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    DE.$$('[role="tabpanel"]').forEach((p) => { p.hidden = p.id !== 'panel-' + tab; });
    history.replaceState(null, '', '#' + tab);
    cargadores[tab]().catch(fallo);
  }
  DE.$$('[role="tab"]').forEach((b) => b.addEventListener('click', () => mostrar(b.dataset.tab)));

  /* ============ RESUMEN ============ */
  cargadores.resumen = async () => {
    const panel = DE.$('#panel-resumen');
    panel.innerHTML = DE.ui.cargando();
    const [res, alertas, recientes, clientes] = await Promise.all([
      DE.api.pedidos.resumen(), DE.api.productos.alertas(), DE.api.pedidos.listar({ por_pagina: 5 }), DE.api.usuarios.listar(),
    ]);
    const solicitudes = clientes.filter((c) => c.solicita_mayorista && c.rol === 'cliente').length;
    const cifra = (icono, valor, texto, destino) => `<a class="cifra-tarjeta" href="#${destino}" data-ir="${destino}" style="text-decoration:none">${DE.ui.icono(icono)}<strong>${valor}</strong><span>${texto}</span></a>`;
    panel.innerHTML = `
      <div class="cifras">
        ${cifra('i-caja', res.por_preparar, 'Pedidos por preparar', 'pedidos')}
        ${cifra('i-reloj', res.pendientes, 'Esperando pago', 'pedidos')}
        ${cifra('i-efectivo', DE.dinero(res.ventas_hoy), 'Ventas de hoy', 'pedidos')}
        ${cifra('i-personas', solicitudes, 'Solicitudes mayoristas', 'clientes')}
      </div>
      <div class="dos-columnas" style="margin-top:16px">
        <div class="tarjeta">
          <div class="titulo-seccion"><h2 style="margin:0">Pedidos recientes</h2><a href="#pedidos" data-ir="pedidos">Ver todos</a></div>
          ${recientes.data.length ? `<div class="lista-pedidos">${recientes.data.map((p) => `
            <a class="pedido-fila" href="seguimiento.html?id=${p.id}"><div class="arriba"><span class="num">${DE.numeroPedido(p.id)} · ${DE.esc(p.nombre)}</span>${DE.ui.estado(p.estado)}</div>
            <p>${DE.fecha(p.creado_en, true)} · ${DE.dinero(p.total)}</p></a>`).join('')}</div>` : '<p class="texto-gris">Todavía no hay pedidos.</p>'}
        </div>
        <div class="tarjeta">
          <h2>Productos por agotarse</h2>
          ${alertas.length ? `<ul class="mini-lineas" style="max-height:none">${alertas.map((p) => `<li><span style="color:var(--tinta)">${DE.esc(p.nombre)}</span><span class="stock stock--${p.stock ? 'bajo' : 'agotado'}">${p.stock ? `Quedan ${p.stock}` : 'Agotado'}</span></li>`).join('')}</ul>
            <button class="btn btn-borde btn-pequeno" type="button" data-ir="productos" style="margin-top:12px">Actualizar existencias</button>` : '<p class="texto-gris">Todo tiene existencias suficientes.</p>'}
          <p class="texto-gris" style="font-size:.82rem;margin-top:12px">Ventas totales pagadas: <strong>${DE.dinero(res.ventas)}</strong> en ${res.total} pedidos.</p>
        </div>
      </div>`;
  };
  DE.$('#contenido').addEventListener('click', (e) => { const a = e.target.closest('[data-ir]'); if (a) { e.preventDefault(); mostrar(a.dataset.ir); } });

  /* ============ PRODUCTOS ============ */
  const catSelect = DE.$('#cat-prod'), formP = DE.$('#form-producto'), dialogo = DE.$('#dialogo-producto');
  catSelect.insertAdjacentHTML('beforeend', Object.entries(DE.CATEGORIAS).map(([k, c]) => `<option value="${k}">${c.nombre}</option>`).join(''));
  formP.categoria.innerHTML = Object.entries(DE.CATEGORIAS).map(([k, c]) => `<option value="${k}">${c.nombre}</option>`).join('');
  let paginaProductos = 1, productosVisibles = [];

  cargadores.productos = async () => {
    const tbody = DE.$('#tabla-productos');
    tbody.innerHTML = `<tr><td colspan="5">${DE.ui.cargando()}</td></tr>`;
    const r = await DE.api.productos.listar({ q: DE.$('#q-prod').value.trim(), categoria: catSelect.value, orden: 'nombre', pagina: paginaProductos, por_pagina: 15 });
    productosVisibles = r.data;
    tbody.innerHTML = r.data.length ? r.data.map((p) => `<tr>
        <td><div class="mini-foto">${DE.ui.foto(p)}</div></td>
        <td><strong>${DE.esc(p.nombre)}</strong><br><span class="texto-gris" style="font-size:.8rem">${DE.categoria(p.categoria).corto}${p.tipo !== 'normal' ? ` · ${p.tipo === 'perecedero' ? 'Perecedero' : 'Líquido'}` : ''}${p.destacado ? ' · Destacado' : ''}</span></td>
        <td class="num">${DE.dinero(p.precio)}${p.precio_mayorista ? `<br><span class="texto-gris" style="font-size:.78rem">May. ${DE.dinero(p.precio_mayorista)}</span>` : ''}</td>
        <td><div class="ajuste-stock" aria-label="Existencias de ${DE.esc(p.nombre)}">
          <button type="button" data-stock-id="${p.id}" data-delta="-1" aria-label="Restar una unidad">−</button>
          <span class="${p.stock <= DE_CONFIG.REGLAS.stockBajo ? 'stock--bajo' : ''}" aria-live="polite">${p.stock}</span>
          <button type="button" data-stock-id="${p.id}" data-delta="1" aria-label="Sumar una unidad">+</button></div></td>
        <td><div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-borde btn-pequeno" type="button" data-editar="${p.id}">${DE.ui.icono('i-lapiz')}Editar</button>
          <button class="btn btn-peligro btn-pequeno" type="button" data-eliminar="${p.id}" aria-label="Quitar ${DE.esc(p.nombre)} de la tienda">${DE.ui.icono('i-basura')}</button></div></td>
      </tr>`).join('') : `<tr><td colspan="5">${DE.ui.vacio('i-buscar', 'Sin productos', 'No hay productos con esa búsqueda.')}</td></tr>`;
    DE.ui.paginacion(DE.$('#pag-productos'), r, (n) => { paginaProductos = n; cargadores.productos().catch(fallo); });
  };

  DE.$('#tabla-productos').addEventListener('click', async (e) => {
    const s = e.target.closest('[data-stock-id]'), ed = e.target.closest('[data-editar]'), el = e.target.closest('[data-eliminar]');
    try {
      if (s) {
        const p = productosVisibles.find((x) => x.id === Number(s.dataset.stockId));
        const nuevo = Math.max(0, p.stock + Number(s.dataset.delta));
        await DE.api.productos.ajustarStock(p.id, nuevo);
        p.stock = nuevo; s.parentElement.querySelector('span').textContent = nuevo;
      } else if (ed) abrirProducto(productosVisibles.find((x) => x.id === Number(ed.dataset.editar)));
      else if (el) {
        const p = productosVisibles.find((x) => x.id === Number(el.dataset.eliminar));
        if (!confirm(`¿Quitar «${p.nombre}» de la tienda? Ya no aparecerá en el catálogo.`)) return;
        await DE.api.productos.eliminar(p.id); aviso('Producto quitado de la tienda'); cargadores.productos();
      }
    } catch (err) { fallo(err); }
  });
  let esperaP;
  DE.$('#q-prod').addEventListener('input', () => { clearTimeout(esperaP); esperaP = setTimeout(() => { paginaProductos = 1; cargadores.productos().catch(fallo); }, 300); });
  catSelect.addEventListener('change', () => { paginaProductos = 1; cargadores.productos().catch(fallo); });

  function abrirProducto(p) {
    formP.reset();
    DE.$('#error-producto').innerHTML = '';
    DE.$$('.error', formP).forEach((x) => { x.textContent = ''; });
    DE.$('#t-dialogo').textContent = p ? 'Editar producto' : 'Nuevo producto';
    const v = p || { id: '', nombre: '', categoria: 'dulceria', tipo: 'normal', descripcion: '', precio: '', stock: 0, precio_mayorista: '', minimo_mayorista: 12, peso_lb: 1, imagen_url: '', destacado: false };
    ['id', 'nombre', 'categoria', 'tipo', 'descripcion', 'precio', 'stock', 'minimo_mayorista', 'peso_lb', 'imagen_url'].forEach((k) => { formP.elements[k].value = v[k] ?? ''; });
    formP.precio_mayorista.value = v.precio_mayorista ?? '';
    formP.destacado.checked = !!v.destacado;
    dialogo.showModal();
    formP.nombre.focus();
  }
  DE.$('#nuevo-producto').addEventListener('click', () => abrirProducto(null));
  DE.$$('[data-cerrar]', dialogo).forEach((b) => b.addEventListener('click', () => dialogo.close()));

  formP.addEventListener('submit', async (e) => {
    e.preventDefault();
    const num = (v) => Number(v);
    const ok = DE.ui.validar(formP, {
      nombre: (v) => (v.length >= 3 ? '' : 'Escribe el nombre del producto.'),
      precio: (v) => (num(v) > 0 ? '' : 'Escribe un precio mayor que Q0.'),
      stock: (v) => (v !== '' && Number.isInteger(num(v)) && num(v) >= 0 ? '' : 'Escribe un número entero (0 o más).'),
      precio_mayorista: (v, f) => (!v || (num(v) > 0 && num(v) < num(f.precio.value)) ? '' : 'Debe ser menor que el precio normal.'),
      peso_lb: (v) => (num(v) > 0 ? '' : 'Escribe el peso en libras.'),
    });
    if (!ok) return;
    const f = formP.elements;
    const datos = {
      nombre: f.nombre.value.trim(), categoria: f.categoria.value, tipo: f.tipo.value, descripcion: f.descripcion.value.trim(),
      precio: num(f.precio.value), stock: num(f.stock.value), precio_mayorista: f.precio_mayorista.value ? num(f.precio_mayorista.value) : null,
      minimo_mayorista: Math.max(1, parseInt(f.minimo_mayorista.value, 10) || 1), peso_lb: num(f.peso_lb.value),
      imagen_url: f.imagen_url.value.trim(), destacado: f.destacado.checked,
    };
    if (f.id.value) datos.id = Number(f.id.value);
    const b = DE.$('#guardar-producto'); b.disabled = true;
    try {
      await DE.api.productos.guardar(datos);
      dialogo.close(); aviso(datos.id ? 'Cambios guardados' : 'Producto agregado a la tienda');
      cargadores.productos().catch(fallo);
    } catch (err) {
      if (err.estado === 401) return fallo(err);
      DE.$('#error-producto').innerHTML = DE.ui.alerta('error', DE.esc(err.message));
    }
    finally { b.disabled = false; }
  });

  /* ============ PEDIDOS ============ */
  const estadoFiltro = DE.$('#estado-pedidos');
  estadoFiltro.insertAdjacentHTML('beforeend', Object.entries(DE.ESTADOS).map(([k, t]) => `<option value="${k}">${t}</option>`).join(''));
  const opcionesEstado = (actual) => Object.entries(DE.ESTADOS).map(([k, t]) => `<option value="${k}"${k === actual ? ' selected' : ''}>${t}</option>`).join('');

  cargadores.pedidos = async () => {
    const tbody = DE.$('#tabla-pedidos');
    tbody.innerHTML = `<tr><td colspan="5">${DE.ui.cargando()}</td></tr>`;
    const r = await DE.api.pedidos.listar({ estado: estadoFiltro.value, por_pagina: 50 });
    tbody.innerHTML = r.data.length ? r.data.map((p) => `<tr>
        <td><a href="seguimiento.html?id=${p.id}" style="font-weight:800">${DE.numeroPedido(p.id)}</a><br><span class="texto-gris" style="font-size:.8rem">${DE.fecha(p.creado_en, true)}</span></td>
        <td>${DE.esc(p.nombre)}<br><span class="texto-gris" style="font-size:.8rem">${DE.esc(p.telefono)}</span></td>
        <td>${DE.ENTREGAS[p.entrega].nombre}${p.entrega !== 'tienda' ? `<br><span class="texto-gris" style="font-size:.8rem">${DE.esc(p.municipio)}, ${DE.esc(p.departamento)}</span>` : ''}<br><span class="texto-gris" style="font-size:.8rem">${DE.PAGOS[p.metodo_pago]}${p.empaque_regalo ? ' · Con empaque de regalo' : ''}</span></td>
        <td class="num"><strong>${DE.dinero(p.total)}</strong><br><span class="texto-gris" style="font-size:.8rem">${p.items.reduce((s, l) => s + l.cantidad, 0)} productos</span></td>
        <td><label class="sr-only" for="e-${p.id}">Estado del pedido ${DE.numeroPedido(p.id)}</label>
          <select class="selector" id="e-${p.id}" data-pedido="${p.id}" data-anterior="${p.estado}" ${p.estado === 'CANCELADO' ? 'disabled' : ''}>${opcionesEstado(p.estado)}</select></td>
      </tr>`).join('') : `<tr><td colspan="5">${DE.ui.vacio('i-caja', 'No hay pedidos', 'No hay pedidos con ese estado.')}</td></tr>`;
  };
  estadoFiltro.addEventListener('change', () => cargadores.pedidos().catch(fallo));
  DE.$('#tabla-pedidos').addEventListener('change', async (e) => {
    const s = e.target.closest('[data-pedido]'); if (!s) return;
    if (s.value === 'CANCELADO' && !confirm('¿Cancelar este pedido? Las existencias regresarán al inventario.')) { s.value = s.dataset.anterior; return; }
    try {
      await DE.api.pedidos.cambiarEstado(Number(s.dataset.pedido), s.value);
      s.dataset.anterior = s.value; if (s.value === 'CANCELADO') s.disabled = true;
      aviso(`Pedido ${DE.numeroPedido(s.dataset.pedido)}: ${DE.ESTADOS[s.value]}`);
    } catch (err) { s.value = s.dataset.anterior; fallo(err); }
  });

  /* ============ CLIENTES ============ */
  cargadores.clientes = async () => {
    const tbody = DE.$('#tabla-clientes');
    tbody.innerHTML = `<tr><td colspan="5">${DE.ui.cargando()}</td></tr>`;
    const lista = await DE.api.usuarios.listar({ q: DE.$('#q-cli').value.trim() });
    tbody.innerHTML = lista.length ? lista.map((u) => {
      const accion = u.rol === 'admin' ? '<span class="texto-gris">—</span>'
        : u.rol === 'mayorista' ? `<button class="btn btn-borde btn-pequeno" type="button" data-rol="cliente" data-usuario="${u.id}">Cambiar a cliente</button>`
        : `<button class="btn ${u.solicita_mayorista ? 'btn-primario' : 'btn-borde'} btn-pequeno" type="button" data-rol="mayorista" data-usuario="${u.id}">${u.solicita_mayorista ? 'Aprobar mayorista' : 'Hacer mayorista'}</button>`;
      return `<tr>
        <td><strong>${DE.esc(u.nombre)}</strong><br><span class="texto-gris" style="font-size:.8rem">${DE.esc(u.email)}</span></td>
        <td>${DE.esc(u.telefono || '—')}</td>
        <td>${DE.ROLES[u.rol]}${u.solicita_mayorista && u.rol === 'cliente' ? '<br><span class="estado estado--PENDIENTE">Pide ser mayorista</span>' : ''}</td>
        <td class="num">${u.puntos}</td>
        <td>${accion}</td></tr>`;
    }).join('') : `<tr><td colspan="5">${DE.ui.vacio('i-personas', 'Sin clientes', 'No hay clientes con esa búsqueda.')}</td></tr>`;
  };
  let esperaC;
  DE.$('#q-cli').addEventListener('input', () => { clearTimeout(esperaC); esperaC = setTimeout(() => cargadores.clientes().catch(fallo), 300); });
  DE.$('#tabla-clientes').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-usuario]'); if (!b) return;
    b.disabled = true;
    try { await DE.api.usuarios.cambiarRol(Number(b.dataset.usuario), b.dataset.rol); aviso(b.dataset.rol === 'mayorista' ? 'Cuenta mayorista activada' : 'Cuenta cambiada a cliente'); cargadores.clientes().catch(fallo); }
    catch (err) { b.disabled = false; fallo(err); }
  });

  window.addEventListener('hashchange', () => mostrar(location.hash.slice(1)));
  mostrar(location.hash.slice(1) || 'resumen');
});
