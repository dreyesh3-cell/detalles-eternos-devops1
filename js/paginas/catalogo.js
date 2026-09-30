/* Página 2 · Catálogo: filtros por categoría, búsqueda, precio, disponibilidad y paginación (RF-03, RF-09) */
DE.iniciar(async () => {
  const form = DE.$('#form-filtros'), panel = DE.$('#filtros');

  /* El estado de los filtros vive en la dirección (URL): se puede compartir y el botón "atrás" funciona. */
  const leerEstado = () => {
    const p = new URLSearchParams(location.search);
    return {
      q: p.get('q') || '',
      categoria: (p.get('categoria') || '').split(',').filter((c) => DE.CATEGORIAS[c]),
      min: p.get('min') || '', max: p.get('max') || '',
      disponibles: p.get('disponibles') === '1', envio_nacional: p.get('envio_nacional') === '1',
      orden: p.get('orden') || 'vendidos', pagina: Number(p.get('pagina')) || 1,
    };
  };
  let estado = leerEstado();

  const escribirEstado = (cambios, reiniciarPagina = true) => {
    estado = { ...estado, ...cambios };
    if (reiniciarPagina && !('pagina' in cambios)) estado.pagina = 1;
    const p = new URLSearchParams();
    if (estado.q) p.set('q', estado.q);
    if (estado.categoria.length) p.set('categoria', estado.categoria.join(','));
    if (estado.min) p.set('min', estado.min);
    if (estado.max) p.set('max', estado.max);
    if (estado.disponibles) p.set('disponibles', '1');
    if (estado.envio_nacional) p.set('envio_nacional', '1');
    if (estado.orden !== 'vendidos') p.set('orden', estado.orden);
    if (estado.pagina > 1) p.set('pagina', estado.pagina);
    history.pushState(null, '', p.toString() ? '?' + p : location.pathname.split('/').pop());
    cargar();
  };

  /* ---------- Categorías (con cantidad de productos) ---------- */
  let conteos = [];
  try { conteos = await DE.api.productos.categorias(); } catch { conteos = []; }
  const cuenta = (c) => conteos.find((x) => x.categoria === c)?.total;
  DE.$('#lista-categorias').innerHTML = Object.entries(DE.CATEGORIAS).map(([clave, c]) =>
    `<label class="opcion"><input type="checkbox" name="categoria" value="${clave}">${c.nombre}${cuenta(clave) !== undefined ? `<span class="cuenta">${cuenta(clave)}</span>` : ''}</label>`).join('');

  const pintarControles = () => {
    DE.$$('input[name="categoria"]', form).forEach((i) => { i.checked = estado.categoria.includes(i.value); });
    form.elements.min.value = estado.min; form.elements.max.value = estado.max;
    form.elements.disponibles.checked = estado.disponibles; form.elements.envio_nacional.checked = estado.envio_nacional;
    DE.$('#orden').value = estado.orden;
    DE.$$('[data-rango]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.rango === `${estado.min}-${estado.max}`)));
    const soloUna = estado.categoria.length === 1 ? estado.categoria[0] : '';
    DE.$('#chips').innerHTML = `<a href="catalogo.html"${!estado.categoria.length ? ' aria-current="true"' : ''} data-chip="">Todas</a>` +
      Object.entries(DE.CATEGORIAS).map(([k, c]) => `<a href="?categoria=${k}" data-chip="${k}"${soloUna === k ? ' aria-current="true"' : ''}>${c.corto}</a>`).join('');
    DE.$('#titulo-catalogo').textContent = estado.q ? `Resultados para «${estado.q}»` : soloUna ? DE.CATEGORIAS[soloUna].nombre : 'Catálogo';
    document.title = `${DE.$('#titulo-catalogo').textContent} – Detalles Eternos GT`;
  };

  const pintarActivos = (total) => {
    const chips = [];
    const chip = (texto, quitar) => chips.push(`<button class="chip" type="button" data-quitar="${DE.esc(JSON.stringify(quitar))}" aria-label="Quitar filtro: ${DE.esc(texto)}">${DE.esc(texto)}${DE.ui.icono('i-cerrar')}</button>`);
    if (estado.q) chip(`Búsqueda: ${estado.q}`, { q: '' });
    estado.categoria.forEach((c) => chip(DE.CATEGORIAS[c].corto, { categoria: estado.categoria.filter((x) => x !== c) }));
    if (estado.min || estado.max) chip(`Precio: ${estado.min ? DE.dinero(estado.min) : 'Q0'} – ${estado.max ? DE.dinero(estado.max) : 'sin límite'}`, { min: '', max: '' });
    if (estado.disponibles) chip('Solo disponibles', { disponibles: false });
    if (estado.envio_nacional) chip('Envío a todo el país', { envio_nacional: false });
    DE.$('#num-filtros').textContent = chips.length || '';
    DE.$('#activos').innerHTML = chips.join('') + (chips.length ? '<button class="btn-texto" type="button" id="limpiar-todo">Limpiar todo</button>' : '') +
      `<p class="resultado" role="status">${total === 1 ? '1 producto' : `${total} productos`}</p>`;
    DE.$('#ver-resultados').textContent = `Ver ${total} ${total === 1 ? 'producto' : 'productos'}`;
  };

  /* ---------- Carga de productos ---------- */
  let peticion = 0;
  async function cargar() {
    pintarControles();
    const miPeticion = ++peticion;
    const cont = DE.$('#productos');
    cont.innerHTML = '<div class="esqueleto"></div>'.repeat(6);
    try {
      const r = await DE.api.productos.listar({ ...estado, categoria: estado.categoria.join(','), por_pagina: DE_CONFIG.REGLAS.productosPorPagina });
      if (miPeticion !== peticion) return;                    // llegó una respuesta más nueva
      pintarActivos(r.total);
      cont.innerHTML = r.data.length ? r.data.map(DE.ui.tarjeta).join('')
        : `<div style="grid-column:1/-1">${DE.ui.vacio('i-buscar', 'No encontramos productos', 'Prueba con otra palabra o quita algunos filtros.', '<button class="btn btn-primario" type="button" id="limpiar-vacio">Quitar filtros</button>')}</div>`;
      DE.ui.paginacion(DE.$('#paginacion'), r, (pagina) => { escribirEstado({ pagina }, false); DE.$('#contenido').scrollIntoView(); });
    } catch (e) {
      if (miPeticion !== peticion) return;
      cont.innerHTML = `<div style="grid-column:1/-1">${DE.ui.error(e.message)}</div>`;
      DE.$('#paginacion').innerHTML = '';
    }
  }

  /* ---------- Eventos ---------- */
  const limpiar = () => escribirEstado({ q: '', categoria: [], min: '', max: '', disponibles: false, envio_nacional: false });
  form.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'categoria') escribirEstado({ categoria: DE.$$('input[name="categoria"]:checked', form).map((i) => i.value) });
    else if (t.name === 'min' || t.name === 'max') escribirEstado({ [t.name]: t.value && Number(t.value) >= 0 ? String(Math.round(Number(t.value))) : '' });
    else if (t.name === 'disponibles' || t.name === 'envio_nacional') escribirEstado({ [t.name]: t.checked });
  });
  form.addEventListener('submit', (e) => e.preventDefault());
  DE.$$('[data-rango]').forEach((b) => b.addEventListener('click', () => {
    const [min, max] = b.dataset.rango.split('-');
    const activo = b.getAttribute('aria-pressed') === 'true';
    escribirEstado(activo ? { min: '', max: '' } : { min, max });
  }));
  DE.$('#orden').addEventListener('change', (e) => escribirEstado({ orden: e.target.value }));
  DE.$('#chips').addEventListener('click', (e) => {
    const a = e.target.closest('[data-chip]'); if (!a) return;
    e.preventDefault(); escribirEstado({ categoria: a.dataset.chip ? [a.dataset.chip] : [] });
  });
  DE.$('#activos').addEventListener('click', (e) => {
    const b = e.target.closest('[data-quitar]');
    if (b) escribirEstado(JSON.parse(b.dataset.quitar));
    if (e.target.id === 'limpiar-todo') limpiar();
  });
  DE.$('#productos').addEventListener('click', (e) => { if (e.target.id === 'limpiar-vacio') limpiar(); });
  DE.$('#limpiar-hoja').addEventListener('click', limpiar);
  window.addEventListener('popstate', () => { estado = leerEstado(); cargar(); });

  /* Panel de filtros en celular */
  const abrir = DE.$('#abrir-filtros');
  const cerrarPanel = () => { panel.classList.remove('abierto'); abrir.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; abrir.focus(); };
  abrir.addEventListener('click', () => {
    panel.classList.add('abierto'); abrir.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden';
    DE.$('[data-cerrar-filtros].btn-icono').focus();
  });
  DE.$$('[data-cerrar-filtros]').forEach((b) => b.addEventListener('click', cerrarPanel));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('abierto')) cerrarPanel(); });

  cargar();
});
