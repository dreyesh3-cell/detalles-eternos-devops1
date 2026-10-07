using ApiPedidos.Configuracion;
using ApiPedidos.Data;
using ApiPedidos.Dtos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ApiPedidos.Services;

public class CotizacionService
{
    private readonly CatalogoDbContext _catalogo;
    private readonly ReglasNegocioOptions _reglas;

    public CotizacionService(
        CatalogoDbContext catalogo,
        IOptions<ReglasNegocioOptions> reglas)
    {
        _catalogo = catalogo;
        _reglas = reglas.Value;
    }

    public async Task<CotizarPedidoResponse> Cotizar(
        CotizarPedidoRequest request,
        string? rol)
    {
        var respuesta = new CotizarPedidoResponse();

        if (request.items == null || request.items.Count == 0)
        {
            respuesta.errores.Add("El carrito está vacío.");
            return respuesta;
        }

        // Agrupar productos repetidos del carrito.
        var cantidades = request.items
            .GroupBy(i => i.producto_id)
            .ToDictionary(
                g => g.Key,
                g => g.Sum(i => i.cantidad)
            );

        var ids = cantidades.Keys.ToList();

        // Consultar los productos del catálogo.
        var productos = await _catalogo.Productos
            .Where(p => ids.Contains(p.id))
            .ToDictionaryAsync(p => p.id);

        decimal subtotal = 0;
        decimal peso = 0;
        bool hayPerecederos = false;
        bool hayLiquidos = false;

        foreach (var item in cantidades)
        {
            var productoId = item.Key;
            var cantidad = item.Value;

            if (!productos.TryGetValue(productoId, out var producto) ||
                !producto.activo)
            {
                respuesta.errores.Add(
                    "Un producto de tu carrito ya no está disponible."
                );

                continue;
            }

            if (cantidad <= 0)
            {
                respuesta.errores.Add(
                    $"La cantidad de «{producto.nombre}» no es válida."
                );

                continue;
            }

            if (producto.stock <= 0)
            {
                respuesta.errores.Add(
                    $"«{producto.nombre}» está agotado."
                );
            }
            else if (producto.stock < cantidad)
            {
                respuesta.errores.Add(
                    $"Solo quedan {producto.stock} unidades de «{producto.nombre}»."
                );
            }

            // Precio mayorista cuando corresponde.
            var usaMayorista =
                rol == "mayorista" &&
                producto.precio_mayorista > 0 &&
                cantidad >= producto.minimo_mayorista;

            var precioUnitario = usaMayorista
                ? producto.precio_mayorista
                : producto.precio;

            var subtotalLinea = Math.Round(
                precioUnitario * cantidad,
                2
            );

            subtotal += subtotalLinea;

            peso += producto.peso_lb * cantidad;
            hayPerecederos = hayPerecederos || producto.tipo == "perecedero";
            hayLiquidos = hayLiquidos || producto.tipo == "liquido";

            respuesta.lineas.Add(new CotizarLineaResponse
            {
                producto_id = producto.id,
                nombre = producto.nombre,
                categoria = producto.categoria,
                tipo = producto.tipo,
                imagen_url = producto.imagen_url ?? string.Empty,
                cantidad = cantidad,
                stock = producto.stock,
                precio_unitario = precioUnitario,
                precio_normal = producto.precio,
                precio_mayorista_aplicado = usaMayorista,
                subtotal = subtotalLinea,
                peso_lb = producto.peso_lb
            });
        }

        // Entregas permitidas
        var municipioLocal = request.departamento == "Guatemala"
            && _reglas.MunicipiosExpres.Any(m =>
                Normalizar(m) == Normalizar(request.municipio));

        var entregasPermitidas = new List<string>
{
    "tienda"
};

        if (municipioLocal || string.IsNullOrWhiteSpace(request.departamento))
        {
            entregasPermitidas.Add("expres");
        }

        if (!hayPerecederos)
        {
            entregasPermitidas.Add("domicilio");
        }

        // Aviso para productos perecederos
        if (hayPerecederos)
        {
            respuesta.avisos.Add(new CotizarAvisoResponse
            {
                tipo = "perecedero",
                texto = "Tu pedido tiene productos perecederos (dulces o café): solo puedes elegir Recoger en tienda o Envío exprés local."
            });
        }

        // Aviso para líquidos
        if (hayLiquidos &&
            request.entrega == "domicilio" &&
            !string.IsNullOrWhiteSpace(request.departamento) &&
            request.departamento != "Guatemala")
        {
            respuesta.avisos.Add(new CotizarAvisoResponse
            {
                tipo = "liquido",
                texto = "Tu pedido tiene líquidos o aerosoles y va a otro departamento: pueden aplicar restricciones de la mensajería o un tiempo de entrega mayor."
            });
        }
        else if (hayLiquidos && string.IsNullOrWhiteSpace(request.entrega))
        {
            respuesta.avisos.Add(new CotizarAvisoResponse
            {
                tipo = "liquido",
                texto = "Tu pedido tiene líquidos o aerosoles, con restricciones para envío departamental."
            });
        }

        // Validaciones de entrega
        if (request.entrega == "expres" &&
            !string.IsNullOrWhiteSpace(request.departamento) &&
            !municipioLocal)
        {
            respuesta.errores.Add(
                "El envío exprés solo llega a la Ciudad de Guatemala y municipios cercanos."
            );
        }

        if (request.entrega == "domicilio" && hayPerecederos)
        {
            respuesta.errores.Add(
                "Los productos perecederos no se envían a domicilio nacional. Elige Recoger en tienda o Envío exprés local."
            );
        }

        respuesta.entregas_permitidas = entregasPermitidas;
        // Cálculo del envío
        decimal envio = 0;
        bool envioGratis = false;

        var calificaEnvioGratis =
            subtotal > _reglas.EnvioGratisDesde &&
            peso <= _reglas.EnvioGratisMaxLb;

        if (request.entrega == "domicilio")
        {
            if (calificaEnvioGratis)
            {
                envioGratis = true;
            }
            else
            {
                var librasExtra = Math.Max(
                    0,
                    Math.Ceiling(peso - _reglas.LibrasIncluidas)
                );

                envio = _reglas.TarifaDomicilio +
                         librasExtra * _reglas.TarifaLibraExtra;
            }
        }
        else if (request.entrega == "expres")
        {
            envio = _reglas.TarifaExpres;
        }

        // Empaque de regalo
        var cargoEmpaque = request.empaque_regalo
            ? _reglas.CargoEmpaqueRegalo
            : 0;

        // Total
        var total = Math.Round(
            subtotal + envio + cargoEmpaque,
            2
        );

        respuesta.envio = envio;
        respuesta.envio_gratis = envioGratis;
        respuesta.cargo_empaque = cargoEmpaque;
        respuesta.total = total;
        respuesta.califica_envio_gratis = calificaEnvioGratis;

        // envío gratis
        respuesta.faltante_envio_gratis =
            subtotal > _reglas.EnvioGratisDesde
                ? 0
                : Math.Round(
                    _reglas.EnvioGratisDesde - subtotal + 0.01m,
                    2
                );

        // Puntos estimados
        respuesta.puntos_estimados =
            (int)Math.Floor(
                subtotal / _reglas.PuntosCadaQ
            );

        respuesta.subtotal = Math.Round(subtotal, 2);
        respuesta.peso_lb = Math.Round(peso, 2);

        return respuesta;
    }

    private static string Normalizar(string texto)
    {
        return texto
            .Trim()
            .ToLowerInvariant()
            .Normalize(System.Text.NormalizationForm.FormD)
            .Where(c =>
                System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c)
                != System.Globalization.UnicodeCategory.NonSpacingMark)
            .ToArray()
            .Aggregate(
                new System.Text.StringBuilder(),
                (sb, c) => sb.Append(c))
            .ToString();
    }
}