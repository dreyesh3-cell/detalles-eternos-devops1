/* Página 8 · Mi cuenta: datos, tipo de cuenta, puntos de fidelización (RF-12) y últimos pedidos */
DE.iniciar(async () => {
  const sesion = DE.sesion.requerir(); if (!sesion) return;
  const cont = DE.$('#cuenta');
  const R = DE_CONFIG.REGLAS;
  cont.innerHTML = DE.ui.cargando();

  const u = await DE.api.auth.perfil();
  DE.sesion.actualizarUsuario(u);
  let pedidos = { data: [] };
  try { pedidos = await DE.api.pedidos.listar({ por_pagina: 3 }); } catch (e) { if (e.estado === 401) throw e; }

  const tipo = u.rol === 'mayorista' ? `<span class="insignia-rol">${DE.ui.icono('i-tienda', 'ico', 'width:16px;height:16px')}Cuenta mayorista</span>`
    : u.rol === 'admin' ? `<span class="insignia-rol">${DE.ui.icono('i-panel', 'ico', 'width:16px;height:16px')}Administración</span>`
    : '<span class="insignia-rol">Cliente</span>';
  const solicitud = u.solicita_mayorista && u.rol === 'cliente' ? DE.ui.alerta('info', 'Tu solicitud de cuenta mayorista está en revisión. Te avisaremos por WhatsApp.') : '';
  const primerNombre = (u.nombre || '').split(' ')[0];

  cont.innerHTML = `
    <div class="encabezado">
      <h1>${DE.param('nueva') ? '¡Te damos la bienvenida' : '¡Hola'}${primerNombre ? ', ' + DE.esc(primerNombre) : ''}!</h1>
      <p>${tipo}</p>
    </div>
    ${DE.param('nueva') ? `<div style="margin-bottom:16px">${DE.ui.alerta('exito', 'Tu cuenta fue creada. Ya puedes comprar y acumular puntos.')}</div>` : ''}
    <div class="panel-cuenta">
      <div style="display:grid;gap:16px">
        <div class="tarjeta-puntos">
          <span class="etiqueta" style="background:#fff;color:var(--rosa)">Mis puntos</span>
          <p class="cifra">${u.puntos || 0}</p>
          <p>puntos acumulados</p>
          <small>Ganas 1 punto por cada ${DE.dinero(R.puntosCadaQ)} en compras pagadas (regla de ejemplo). Canje: [REGLAS DE PUNTOS POR DEFINIR].</small>
        </div>
        <div class="tarjeta">
          <h2>Mis datos</h2>
          <dl class="ficha">
            <dt>Nombre</dt><dd>${DE.esc(u.nombre || '—')}</dd>
            <dt>Correo</dt><dd>${DE.esc(u.email)}</dd>
            <dt>Teléfono</dt><dd>${DE.esc(u.telefono || '—')}</dd>
            <dt>Tipo</dt><dd>${DE.ROLES[u.rol] || 'Cliente'}</dd>
          </dl>
          ${solicitud ? `<div style="margin-top:12px">${solicitud}</div>` : ''}
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">
            ${u.rol === 'admin' ? `<a class="btn btn-primario btn-pequeno" href="admin.html">${DE.ui.icono('i-panel')}Ir al panel</a>` : ''}
            ${u.rol === 'mayorista' ? `<a class="btn btn-primario btn-pequeno" href="mayoristas.html">Ver precios mayoristas</a>` : ''}
            <button class="btn btn-peligro btn-pequeno" type="button" id="salir">${DE.ui.icono('i-salir')}Cerrar sesión</button>
          </div>
        </div>
      </div>
      <div class="tarjeta">
        <div class="titulo-seccion"><h2 style="margin:0">Mis últimos pedidos</h2><a href="seguimiento.html">Ver todos</a></div>
        ${pedidos.data.length ? `<div class="lista-pedidos">${pedidos.data.map((p) => `
          <a class="pedido-fila" href="seguimiento.html?id=${p.id}">
            <div class="arriba"><span class="num">${DE.numeroPedido(p.id)}</span>${DE.ui.estado(p.estado)}</div>
            <p>${DE.fecha(p.creado_en)} · ${DE.dinero(p.total)}</p>
          </a>`).join('')}</div>`
          : DE.ui.vacio('i-caja', 'Aún no tienes pedidos', 'Tus compras aparecerán aquí.', '<a class="btn btn-primario" href="catalogo.html">Ir al catálogo</a>')}
      </div>
    </div>`;

  DE.$('#salir').addEventListener('click', async () => {
    await DE.api.auth.cerrarSesion();
    DE.sesion.cerrar();
    location.href = 'index.html';
  });
});
