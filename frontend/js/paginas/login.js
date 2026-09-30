/* Página 7a · Iniciar sesión (RF-02) */
DE.iniciar(() => {
  const form = DE.$('#form-login');
  /* Solo se aceptan destinos internos (evita redirecciones a otros sitios). */
  const volver = (DE.param('volver') || '').match(/^[a-z0-9-]+\.html(\?[\w=&%.-]*)?$/i) ? DE.param('volver') : '';
  if (volver) DE.$('#ir-registro').href = 'registro.html?volver=' + encodeURIComponent(volver);
  if (DE_CONFIG.MODO === 'demo') DE.$('#cuentas-demo').hidden = false;
  if (volver === 'checkout.html') DE.$('#aviso').innerHTML = DE.ui.alerta('info', 'Inicia sesión o crea tu cuenta para terminar tu compra. Tu carrito se conserva.');
  if (DE.sesion.obtener()) { location.href = volver || 'cuenta.html'; return; }

  DE.$('#ver-clave').addEventListener('change', (e) => { form.password.type = e.target.checked ? 'text' : 'password'; });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!DE.ui.validar(form, { email: DE.validaciones.email, password: DE.validaciones.requerido('Escribe tu contraseña.') })) return;
    const boton = DE.$('#entrar');
    boton.disabled = true; boton.textContent = 'Entrando…';
    DE.$('#aviso').innerHTML = '';
    try {
      const { token, usuario } = await DE.api.auth.iniciarSesion(form.email.value.trim(), form.password.value);
      DE.sesion.guardar(token, usuario);
      location.href = volver || (usuario.rol === 'admin' ? 'admin.html' : 'cuenta.html');
    } catch (err) {
      DE.$('#aviso').innerHTML = DE.ui.alerta('error', DE.esc(err.message));
      boton.disabled = false; boton.textContent = 'Iniciar sesión';
      form.password.value = ''; form.password.focus();
    }
  });
});
