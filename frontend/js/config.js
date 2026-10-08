/* ============================================================
   CONFIGURACIÓN DEL SITIO — Detalles Eternos GT
   Este es el ÚNICO archivo que hay que editar para conectar el
   sitio con la base de datos real o cambiar datos del negocio.
   ============================================================ */
window.DE_CONFIG = {
  /* 'demo' = funciona sin servidor, con datos de ejemplo guardados en el navegador.
     'api'  = usa el backend real (microservicios + base de datos).
     Para conectar la base de datos: cambiar a 'api' y revisar INTEGRACION.md. */
  MODO: 'api',

  /* Dirección base de las APIs. Con el nginx incluido (nginx.conf) basta con '/api'.
     Si las APIs están en otro dominio, poner la URL completa, p. ej. 'https://api.detalleseternos.gt'. */
  API_URL: '/api',

  /* Datos del negocio (pendientes de confirmar con la propietaria). */
  NEGOCIO: {
    nombre: 'Detalles Eternos GT',
    whatsapp: '',                 // [TELÉFONO WHATSAPP] solo números con código de país, p. ej. '50212345678'
    whatsappTexto: '[TELÉFONO WHATSAPP]',
    direccion: '[DIRECCIÓN EXACTA]',
    horario: '[HORARIO]',
    zona: 'Zona 18, Ciudad de Guatemala',
    cuentasBancarias: [           // [CUENTAS BANCARIAS] para pagos por transferencia
      { banco: 'Banco Industrial', cuenta: '[NÚMERO DE CUENTA BI]' },
      { banco: 'Banrural', cuenta: '[NÚMERO DE CUENTA BANRURAL]' },
      { banco: 'G&T Continental', cuenta: '[NÚMERO DE CUENTA G&T]' },
    ],
  },

  /* Reglas de negocio. Los montos marcados "ejemplo" están pendientes de confirmar.
     En modo 'api' el backend debe aplicar estas mismas reglas (ver INTEGRACION.md). */
  REGLAS: {
    envioGratisDesde: 600,        // RN-04: envío gratis si la compra SUPERA Q600.00…
    envioGratisMaxLb: 10,         // …y el peso total no pasa de 10 lb
    tarifaDomicilio: 35,          // ejemplo: envío nacional (incluye hasta 5 lb)
    lbIncluidas: 5,
    tarifaLbExtra: 4,             // ejemplo: por cada libra adicional
    tarifaExpres: 30,             // ejemplo: envío exprés local
    cargoEmpaqueRegalo: 35,       // ejemplo: "Empaque de Regalo Especial" (RN-04, monto por definir)
    puntosCadaQ: 10,              // ejemplo: 1 punto por cada Q10 en compras pagadas
    stockBajo: 5,                 // "Quedan N" cuando hay 5 o menos
    productosPorPagina: 12,
    /* RN-03: municipios con envío exprés local (Ciudad de Guatemala y aledaños). */
    municipiosExpres: ['Guatemala', 'Mixco', 'Villa Nueva', 'Chinautla', 'San Pedro Ayampuc',
      'Santa Catarina Pinula', 'San José Pinula', 'Villa Canales', 'San Miguel Petapa', 'Fraijanes'],
  },

  MENSAJERIAS: ['Cargo Expreso', 'GuateExpres', 'Forza Delivery'],
};
