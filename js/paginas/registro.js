/* Página 7b · Registro de clientes (RF-01), con opción de solicitar cuenta mayorista (RF-13) */
DE.iniciar(() => {
  const form = DE.$('#form-registro');
  const volver = (DE.param('volver') || '').match(/^[a-z0-9-]+\.html(\?[\w=&%.-]*)?$/i) ? DE.param('volver') : '';
  if (volver) DE.$('#ir-login').href = 'login.html?volver=' + encodeURIComponent(volver);
  if (DE.param('mayorista') === '1') form.mayorista.checked = true;
  if (DE.sesion.obtener()) { location.href = volver || 'cuenta.html'; return; }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const V = DE.validaciones;
    const ok = DE.ui.validar(form, {
      nombre: (v) => (v.length >= 2 ? '' : 'Escribe tu nombre completo.'),
      email: V.email, telefono: V.telefono, password: V.password,
      password2: (v, f) => (v === f.password.value ? '' : 'Las contraseñas no coinciden.'),
    });
    if (!ok) return;
    const boton = DE.$('#crear');
    boton.disabled = true; boton.textContent = 'Creando tu cuenta…';
    DE.$('#aviso').innerHTML = '';
    const datos = {
      nombre: form.nombre.value.trim(), email: form.email.value.trim().toLowerCase(), telefono: form.telefono.value.trim(),
      password: form.password.value, mayorista: form.mayorista.checked,
    };
    try {
      await DE.api.auth.registrar(datos);
      const { token, usuario } = await DE.api.auth.iniciarSesion(datos.email, datos.password);
      DE.sesion.guardar(token, { ...usuario, nombre: usuario.nombre || datos.nombre, telefono: usuario.telefono || datos.telefono });
      location.href = volver || 'cuenta.html?nueva=1';
    } catch (err) {
      DE.$('#aviso').innerHTML = DE.ui.alerta('error', DE.esc(err.message) + (err.estado === 409 ? ' <a href="login.html">Iniciar sesión</a>' : ''));
      DE.$('#aviso').scrollIntoView({ block: 'center' });
      boton.disabled = false; boton.textContent = 'Crear mi cuenta';
    }
  });
});
