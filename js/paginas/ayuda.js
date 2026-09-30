/* Página de ayuda: los montos salen de config.js para que siempre coincidan con el checkout */
DE.iniciar(() => {
  const R = DE_CONFIG.REGLAS, N = DE_CONFIG.NEGOCIO;
  DE.$('#tabla-envios').innerHTML = `
    <tr><td><strong>Recoger en tienda</strong></td><td>Zona 18, Ciudad de Guatemala</td><td>Te avisamos cuando esté listo</td><td class="num">Gratis</td></tr>
    <tr><td><strong>Envío exprés local</strong></td><td>Ciudad de Guatemala y municipios cercanos</td><td>El mismo día o al siguiente</td><td class="num">${DE.dinero(R.tarifaExpres)}</td></tr>
    <tr><td><strong>Envío a domicilio</strong></td><td>Todo el país</td><td>2 a 4 días hábiles</td><td class="num">${DE.dinero(R.tarifaDomicilio)} hasta ${R.lbIncluidas} lb<br><span class="texto-gris" style="font-size:.8rem">+ ${DE.dinero(R.tarifaLbExtra)} por libra extra</span></td></tr>`;
  DE.$('#nota-envio').innerHTML = DE.ui.alerta('exito', `Si tu compra <strong>supera ${DE.dinero(R.envioGratisDesde)}</strong> y pesa <strong>${R.envioGratisMaxLb} lb o menos</strong>, el envío a domicilio es gratis. Las tarifas son de ejemplo mientras se confirman con las mensajerías.`, 'Envío gratis');
  DE.$('#texto-puntos').textContent = `Por cada ${DE.dinero(R.puntosCadaQ)} en compras pagadas ganas 1 punto (regla de ejemplo). Puedes ver tus puntos en Mi cuenta.`;
  DE.$('#texto-empaque').textContent = `${DE.TEXTOS.empaque} Tiene un costo adicional de ${DE.dinero(R.cargoEmpaqueRegalo)}.`;
  DE.$('#c-whatsapp').textContent = N.whatsappTexto;
  DE.$('#c-direccion').textContent = N.direccion;
  DE.$('#c-horario').textContent = N.horario;
});
