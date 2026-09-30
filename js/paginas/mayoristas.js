/* Página 9 · Portal mayorista: precios por volumen y pedido por cantidad (RF-13) */
DE.iniciar(async () => {
  const zona = DE.$('#zona-mayorista');
  const sesion = DE.sesion.obtener();

  /* ---------- Visitante o cliente sin acceso ---------- */
  if (!sesion) {
    zona.innerHTML = `<div class="tarjeta" style="text-align:center;display:grid;gap:12px;justify-items:center">
      <h2>¿Quieres comprar por mayor?</h2>
      <p class="texto-gris">Crea tu cuenta de negocio para ver la lista de precios mayoristas.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        <a class="btn btn-primario" href="registro.html?mayorista=1&volver=mayoristas.html">Crear cuenta de negocio</a>
        <a class="btn btn-borde" href="login.html?volver=mayoristas.html">Ya tengo cuenta</a>
      </div></div>`;
    return;
  }

  const u = await DE.api.auth.perfil();
  DE.sesion.actualizarUsuario(u);
  if (u.rol === 'cliente') {
    zona.innerHTML = u.solicita_mayorista
      ? `<div class="tarjeta">${DE.ui.alerta('info', 'Tu solicitud de cuenta mayorista está en revisión. Te avisaremos por WhatsApp cuando esté activa.', 'Solicitud recibida')}</div>`
      : `<div class="tarjeta" style="display:grid;gap:12px">
          <h2>Solicita tu acceso mayorista</h2>
          <p class="texto-gris">Tu cuenta actual es de cliente. Envía tu solicitud y la revisaremos.</p>
          <div><button class="btn btn-primario" type="button" id="solicitar">Solicitar acceso mayorista</button></div>
        </div>`;
    const b = DE.$('#solicitar');
    if (b) b.addEventListener('click', async () => {
      b.disabled = true;
      try { await DE.api.auth.solicitarMayorista(); DE.sesion.actualizarUsuario({ solicita_mayorista: true }); location.reload(); }
      catch (e) { b.disabled = false; DE.ui.toast(`${DE.ui.icono('i-alerta')}<span>${DE.esc(e.message)}</span>`); }
    });
    return;
  }

  /* ---------- Mayorista (o administradora): lista de precios ---------- */
  zona.innerHTML = `
    ${u.rol === 'admin' ? `<div style="margin-bottom:12px">${DE.ui.alerta('info', 'Estás viendo la lista con tu cuenta de administración. Las solicitudes se aprueban en el <a href="admin.html#clientes">panel</a>.')}</div>` : ''}
    <div class="barra-admin">
      <form class="buscador" role="search" id="buscar-mayorista" onsubmit="return false">
        <label class="sr-only" for="q-may">Buscar en la lista</label>
        <input id="q-may" type="search" placeholder="Buscar producto">
        <button type="submit" aria-label="Buscar">${DE.ui.icono('i-buscar')}</button>
      </form>
      <label class="sr-only" for="cat-may">Categoría</label>
      <select id="cat-may" class="selector"><option value="">Todas las categorías</option>${Object.entries(DE.CATEGORIAS).map(([k, c]) => `<option value="${k}">${c.nombre}</option>`).join('')}</select>
      <a class="btn btn-primario btn-pequeno" href="carrito.html">${DE.ui.icono('i-carrito')}Ver carrito</a>
    </div>
    <div class="tabla-contenedor"><table class="tabla" id="tabla-precios">
      <caption class="sr-only">Lista de precios mayoristas</caption>
      <thead><tr><th scope="col">Producto</th><th scope="col" class="num">Existencias</th><th scope="col" class="num">Precio normal</th><th scope="col" class="num">Precio mayorista</th><th scope="col" class="num">Mínimo</th><th scope="col">Cantidad</th><th scope="col"><span class="sr-only">Acción</span></th></tr></thead>
      <tbody><tr><td colspan="7">${DE.ui.cargando()}</td></tr></tbody>
    </table></div>
    <p class="texto-gris" style="font-size:.85rem;margin-top:10px">El precio mayorista se aplica automáticamente en el carrito cuando llegas a la cantidad mínima. Precios de ejemplo: [LISTA DE PRECIOS MAYORISTA].</p>`;

  async function cargar() {
    const tbody = DE.$('#tabla-precios tbody');
    const r = await DE.api.productos.listar({ q: DE.$('#q-may').value.trim(), categoria: DE.$('#cat-may').value, con_mayorista: true, orden: 'nombre', por_pagina: 200 });
    const filas = r.data.filter((p) => p.precio_mayorista);
    tbody.innerHTML = filas.length ? filas.map((p) => {
      const agotado = p.stock <= 0, min = Math.min(p.minimo_mayorista, Math.max(p.stock, 1));
      return `<tr>
        <td><a href="producto.html?id=${p.id}" style="font-weight:700">${DE.esc(p.nombre)}</a><br><span class="texto-gris" style="font-size:.8rem">${DE.categoria(p.categoria).corto}</span></td>
        <td class="num">${agotado ? '<span class="stock stock--agotado" style="justify-content:flex-end">Agotado</span>' : p.stock}</td>
        <td class="num">${DE.dinero(p.precio)}</td>
        <td class="num" style="color:var(--rosa);font-weight:800">${DE.dinero(p.precio_mayorista)}</td>
        <td class="num">${p.minimo_mayorista} u.</td>
        <td>${agotado ? '—' : `<label class="sr-only" for="c-${p.id}">Cantidad de ${DE.esc(p.nombre)}</label><input id="c-${p.id}" type="number" min="1" max="${p.stock}" value="${min}">`}</td>
        <td>${agotado ? '' : `<button class="btn btn-primario btn-pequeno" type="button" data-agregar-may="${p.id}" data-stock="${p.stock}" data-nombre="${DE.esc(p.nombre)}">Agregar</button>`}</td>
      </tr>`;
    }).join('') : `<tr><td colspan="7">${DE.ui.vacio('i-buscar', 'Sin resultados', 'Prueba con otra búsqueda o categoría.')}</td></tr>`;
  }

  DE.$('#tabla-precios').addEventListener('click', (e) => {
    const b = e.target.closest('[data-agregar-may]'); if (!b) return;
    const id = Number(b.dataset.agregarMay), stock = Number(b.dataset.stock);
    const cantidad = Math.min(Math.max(1, parseInt(DE.$(`#c-${id}`).value, 10) || 1), stock);
    const agregados = DE.carrito.agregar(id, cantidad, stock);
    DE.ui.toast(agregados > 0
      ? `${DE.ui.icono('i-check')}<span>${agregados} × «${DE.esc(b.dataset.nombre)}» en tu carrito</span><a href="carrito.html">Ver carrito</a>`
      : `${DE.ui.icono('i-alerta')}<span>Ya tienes todas las unidades disponibles en tu carrito</span>`);
  });
  let espera;
  DE.$('#q-may').addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(cargar, 300); });
  DE.$('#cat-may').addEventListener('change', cargar);
  await cargar();
});
