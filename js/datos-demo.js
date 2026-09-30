/* ============================================================
   DATOS DE EJEMPLO (solo para MODO: 'demo')
   Productos y precios realistas en quetzales mientras no existan
   los datos reales del negocio. No se usan en MODO: 'api'.
   Cada producto sigue el mismo formato que debe devolver la API
   (ver INTEGRACION.md).
   ============================================================ */
window.DE_DEMO = {
  version: 3, // subir este número para reiniciar los datos guardados en el navegador

  productos: [
    // ---------- Carteras ----------
    { id: 1, nombre: 'Cartera de piel Frida, color vino', categoria: 'carteras', precio: 1250, precio_mayorista: 1050, minimo_mayorista: 3, stock: 3, peso_lb: 1.8, tipo: 'normal', destacado: true, ventas: 41,
      descripcion: 'Cartera de piel genuina con acabado artesanal, forro de tela y cierre metálico. Incluye correa ajustable para usar al hombro o cruzada. Disponible en vino, negro y camel.' },
    { id: 2, nombre: 'Cartera tipo sobre bordada, color mostaza', categoria: 'carteras', precio: 385, precio_mayorista: 320, minimo_mayorista: 6, stock: 14, peso_lb: 0.8, tipo: 'normal', destacado: false, ventas: 22,
      descripcion: 'Cartera de mano tipo sobre con bordado de flores inspirado en Oaxaca. Ideal para bodas y eventos.' },
    { id: 3, nombre: 'Bolso tote de palma tejida', categoria: 'carteras', precio: 295, precio_mayorista: 245, minimo_mayorista: 6, stock: 9, peso_lb: 1.1, tipo: 'normal', destacado: false, ventas: 18,
      descripcion: 'Bolso amplio de palma natural tejida a mano, con asas de piel sintética. Perfecto para el mercado o la playa.' },
    { id: 4, nombre: 'Monedero de piel con grabado de catrina', categoria: 'carteras', precio: 145, precio_mayorista: 115, minimo_mayorista: 12, stock: 25, peso_lb: 0.3, tipo: 'normal', destacado: false, ventas: 30,
      descripcion: 'Monedero compacto de piel con grabado de catrina hecho a mano. Cierre de broche.' },
    { id: 5, nombre: 'Cartera cruzada de piel, color negro', categoria: 'carteras', precio: 690, precio_mayorista: 590, minimo_mayorista: 3, stock: 0, peso_lb: 1.2, tipo: 'normal', destacado: false, ventas: 27,
      descripcion: 'Cartera cruzada de piel con dos compartimentos y bolsillo interior con cierre.' },

    // ---------- Belleza y maquillaje ----------
    { id: 6, nombre: 'Paleta de sombras Catrina, 18 tonos', categoria: 'belleza', precio: 189, precio_mayorista: 155, minimo_mayorista: 12, stock: 32, peso_lb: 0.4, tipo: 'normal', destacado: true, ventas: 64,
      descripcion: 'Paleta de 18 sombras mate y metálicas en tonos cálidos. Alta pigmentación y larga duración.' },
    { id: 7, nombre: 'Crema corporal de coco, 250 ml', categoria: 'belleza', precio: 72, precio_mayorista: 58, minimo_mayorista: 12, stock: 40, peso_lb: 0.7, tipo: 'liquido', destacado: true, ventas: 52,
      descripcion: 'Crema hidratante con aceite de coco y manteca de karité. Aroma suave, absorción rápida.' },
    { id: 8, nombre: 'Laca para cabello en aerosol, 400 ml', categoria: 'belleza', precio: 59, precio_mayorista: 47, minimo_mayorista: 12, stock: 28, peso_lb: 0.9, tipo: 'liquido', destacado: false, ventas: 35,
      descripcion: 'Laca de fijación extra fuerte en aerosol. No deja residuos.' },
    { id: 9, nombre: 'Labial mate de larga duración, rojo carmín', categoria: 'belleza', precio: 65, precio_mayorista: 52, minimo_mayorista: 12, stock: 4, peso_lb: 0.1, tipo: 'normal', destacado: false, ventas: 48,
      descripcion: 'Labial mate en barra con acabado aterciopelado, hasta 8 horas de duración.' },
    { id: 10, nombre: 'Agua de rosas en atomizador, 120 ml', categoria: 'belleza', precio: 48, precio_mayorista: 38, minimo_mayorista: 12, stock: 22, peso_lb: 0.4, tipo: 'liquido', destacado: false, ventas: 19,
      descripcion: 'Tónico facial refrescante de agua de rosas. Ideal para fijar el maquillaje.' },

    // ---------- Hogar y limpieza ----------
    { id: 11, nombre: 'Limpiador multiusos lavanda, 3.78 L', categoria: 'hogar', precio: 54, precio_mayorista: 43, minimo_mayorista: 6, stock: 36, peso_lb: 8.6, tipo: 'liquido', destacado: true, ventas: 77,
      descripcion: 'Limpiador líquido multiusos con aroma a lavanda. Rinde para pisos, baños y cocina. Presentación de galón.' },
    { id: 12, nombre: 'Jabón líquido para trastes, limón, 1 L', categoria: 'hogar', precio: 32, precio_mayorista: 25, minimo_mayorista: 12, stock: 45, peso_lb: 2.3, tipo: 'liquido', destacado: false, ventas: 58,
      descripcion: 'Lavatrastes concentrado con aroma a limón que corta la grasa desde la primera pasada.' },
    { id: 13, nombre: 'Detergente en polvo, 1 kg', categoria: 'hogar', precio: 38, precio_mayorista: 30, minimo_mayorista: 12, stock: 30, peso_lb: 2.2, tipo: 'normal', destacado: false, ventas: 40,
      descripcion: 'Detergente en polvo para ropa blanca y de color, con aroma floral.' },
    { id: 14, nombre: 'Aromatizante en aerosol, canela, 400 ml', categoria: 'hogar', precio: 35, precio_mayorista: 27, minimo_mayorista: 12, stock: 18, peso_lb: 0.9, tipo: 'liquido', destacado: false, ventas: 21,
      descripcion: 'Aromatizante de ambiente con fragancia de canela, ideal para temporada navideña.' },
    { id: 15, nombre: 'Juego de 3 fibras de cocina', categoria: 'hogar', precio: 22, precio_mayorista: 17, minimo_mayorista: 12, stock: 60, peso_lb: 0.2, tipo: 'normal', destacado: false, ventas: 33,
      descripcion: 'Fibras de doble cara: una suave para teflón y otra abrasiva para ollas.' },

    // ---------- Dulcería mexicana (perecedero) ----------
    { id: 16, nombre: 'Mazapán de cacahuate, caja de 30 piezas', categoria: 'dulceria', precio: 65, precio_mayorista: 52, minimo_mayorista: 6, stock: 24, peso_lb: 1.1, tipo: 'perecedero', destacado: true, ventas: 90,
      descripcion: 'El clásico mazapán mexicano de cacahuate que se deshace en la boca. Caja con 30 piezas.' },
    { id: 17, nombre: 'Tamarindo enchilado, bolsa de 20 piezas', categoria: 'dulceria', precio: 38, precio_mayorista: 30, minimo_mayorista: 12, stock: 5, peso_lb: 0.6, tipo: 'perecedero', destacado: false, ventas: 45,
      descripcion: 'Dulces de pulpa de tamarindo con chile, agridulces y picositos.' },
    { id: 18, nombre: 'Obleas con cajeta, paquete de 10', categoria: 'dulceria', precio: 42, precio_mayorista: 34, minimo_mayorista: 12, stock: 16, peso_lb: 0.5, tipo: 'perecedero', destacado: false, ventas: 26,
      descripcion: 'Obleas crujientes rellenas de cajeta de leche de cabra.' },
    { id: 19, nombre: 'Glorias de nuez, caja de 12', categoria: 'dulceria', precio: 58, precio_mayorista: 47, minimo_mayorista: 6, stock: 11, peso_lb: 0.7, tipo: 'perecedero', destacado: false, ventas: 29,
      descripcion: 'Dulces de leche quemada con nuez, envueltos en celofán rojo. Receta de Linares, Nuevo León.' },
    { id: 20, nombre: 'Paletas de chile con mango, bolsa de 40', categoria: 'dulceria', precio: 49, precio_mayorista: 39, minimo_mayorista: 12, stock: 0, peso_lb: 1.0, tipo: 'perecedero', destacado: false, ventas: 37,
      descripcion: 'Paletas de caramelo sabor mango cubiertas de chile en polvo.' },

    // ---------- Café (fresco, perecedero) ----------
    { id: 21, nombre: 'Café de olla molido, 340 g', categoria: 'cafe', precio: 78, precio_mayorista: 64, minimo_mayorista: 12, stock: 20, peso_lb: 0.8, tipo: 'perecedero', destacado: true, ventas: 55,
      descripcion: 'Café molido con canela y piloncillo, listo para preparar café de olla tradicional.' },
    { id: 22, nombre: 'Café de altura en grano, 454 g', categoria: 'cafe', precio: 115, precio_mayorista: 95, minimo_mayorista: 12, stock: 12, peso_lb: 1.0, tipo: 'perecedero', destacado: false, ventas: 31,
      descripcion: 'Café de altura tostado medio, notas a chocolate y caramelo. Grano entero para moler en casa.' },
    { id: 23, nombre: 'Café soluble con canela, frasco 200 g', categoria: 'cafe', precio: 69, precio_mayorista: 56, minimo_mayorista: 12, stock: 17, peso_lb: 0.6, tipo: 'perecedero', destacado: false, ventas: 20,
      descripcion: 'Café instantáneo con un toque de canela. Se prepara en segundos.' },

    // ---------- Regalos y canastas ----------
    { id: 24, nombre: 'Canasta Sabores de México', categoria: 'regalos', precio: 450, precio_mayorista: 390, minimo_mayorista: 3, stock: 0, peso_lb: 6.5, tipo: 'perecedero', destacado: true, ventas: 23,
      descripcion: 'Canasta de mimbre con mazapanes, glorias, obleas, café de olla y una taza de barro. Ideal para regalar.' },
    { id: 25, nombre: 'Set de regalo Frida: cosmetiquera y espejo', categoria: 'regalos', precio: 210, precio_mayorista: 175, minimo_mayorista: 6, stock: 13, peso_lb: 0.9, tipo: 'normal', destacado: true, ventas: 34,
      descripcion: 'Cosmetiquera de tela estampada con espejo de bolsillo a juego, en caja de regalo.' },
    { id: 26, nombre: 'Taza de barro artesanal con plato', categoria: 'regalos', precio: 95, precio_mayorista: 78, minimo_mayorista: 6, stock: 21, peso_lb: 1.4, tipo: 'normal', destacado: false, ventas: 16,
      descripcion: 'Taza de barro pintada a mano con plato a juego. Pieza única, puede variar el diseño.' },
    { id: 27, nombre: 'Canasta navideña Tradición', categoria: 'regalos', precio: 575, precio_mayorista: 495, minimo_mayorista: 3, stock: 7, peso_lb: 7.8, tipo: 'perecedero', destacado: false, ventas: 12,
      descripcion: 'Canasta con café de altura, dulces típicos, taza de barro y adornos navideños.' },
    { id: 28, nombre: 'Set de belleza Día de la Madre', categoria: 'regalos', precio: 320, precio_mayorista: 270, minimo_mayorista: 3, stock: 10, peso_lb: 1.6, tipo: 'liquido', destacado: false, ventas: 14,
      descripcion: 'Crema corporal, agua de rosas, labial y cosmetiquera en caja de regalo con moño.' },
  ],

  /* Cuentas de prueba (solo en modo demo). Las contraseñas se guardan cifradas (SHA-256 con sal). */
  usuarios: [
    { id: 1, nombre: 'Administración', email: 'admin@detalleseternos.gt', password: 'Admin12345', telefono: '', rol: 'admin', solicita_mayorista: false, puntos: 0 },
    { id: 2, nombre: 'Ana López', email: 'ana@test.com', password: 'Cliente123', telefono: '5555-1234', rol: 'cliente', solicita_mayorista: false, puntos: 120 },
    { id: 3, nombre: 'Tienda La Bendición', email: 'mayorista@test.com', password: 'Mayorista123', telefono: '5555-9876', rol: 'mayorista', solicita_mayorista: false, puntos: 340 },
    { id: 4, nombre: 'Carlos Méndez', email: 'carlos@test.com', password: 'Cliente123', telefono: '4444-2020', rol: 'cliente', solicita_mayorista: true, puntos: 15 },
  ],

  /* Pedidos de ejemplo para que el panel de administrador y "Mis pedidos" no estén vacíos. */
  pedidos: [
    { id: 1, usuario_id: 2, nombre: 'Ana López', telefono: '5555-1234', entrega: 'domicilio', departamento: 'Quetzaltenango', municipio: 'Quetzaltenango', direccion: '4a calle 12-30 zona 1', mensajeria: 'Cargo Expreso',
      metodo_pago: 'tarjeta', cuotas: 3, empaque_regalo: false, mensaje_regalo: '', estado: 'ENVIADO', dias: 3,
      items: [{ producto_id: 1, cantidad: 1 }] },
    { id: 2, usuario_id: 2, nombre: 'Ana López', telefono: '5555-1234', entrega: 'tienda', departamento: 'Guatemala', municipio: 'Guatemala', direccion: '', mensajeria: '',
      metodo_pago: 'contra_entrega', cuotas: 1, empaque_regalo: true, mensaje_regalo: '¡Feliz cumpleaños, mamá!', estado: 'LISTO_PARA_RECOGER', dias: 1,
      items: [{ producto_id: 16, cantidad: 2 }, { producto_id: 21, cantidad: 1 }] },
    { id: 3, usuario_id: 3, nombre: 'Tienda La Bendición', telefono: '5555-9876', entrega: 'expres', departamento: 'Guatemala', municipio: 'Mixco', direccion: 'Calzada San Juan 10-45 zona 7 de Mixco', mensajeria: '',
      metodo_pago: 'transferencia', cuotas: 1, empaque_regalo: false, mensaje_regalo: '', estado: 'PENDIENTE', dias: 0,
      items: [{ producto_id: 12, cantidad: 24 }, { producto_id: 15, cantidad: 12 }] },
    { id: 4, usuario_id: 4, nombre: 'Carlos Méndez', telefono: '4444-2020', entrega: 'domicilio', departamento: 'Escuintla', municipio: 'Escuintla', direccion: '3a avenida 5-10 zona 2', mensajeria: 'Forza Delivery',
      metodo_pago: 'tarjeta', cuotas: 1, empaque_regalo: false, mensaje_regalo: '', estado: 'PAGADO', dias: 0,
      items: [{ producto_id: 6, cantidad: 1 }, { producto_id: 25, cantidad: 1 }] },
  ],
};
