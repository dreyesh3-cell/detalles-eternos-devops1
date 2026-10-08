namespace ApiPedidos.Dtos;

public class CotizarPedidoResponse
{
    public List<CotizarLineaResponse> lineas { get; set; } = new();

    public decimal subtotal { get; set; }

    public decimal peso_lb { get; set; }

    public decimal envio { get; set; }

    public bool envio_gratis { get; set; }

    public decimal cargo_empaque { get; set; }

    public decimal total { get; set; }

    public List<string> entregas_permitidas { get; set; } = new();

    public List<CotizarAvisoResponse> avisos { get; set; } = new();

    public List<string> errores { get; set; } = new();

    public bool califica_envio_gratis { get; set; }

    public decimal faltante_envio_gratis { get; set; }

    public int puntos_estimados { get; set; }
}

public class CotizarLineaResponse
{
    public int producto_id { get; set; }

    public string nombre { get; set; } = string.Empty;

    public string categoria { get; set; } = string.Empty;

    public string tipo { get; set; } = string.Empty;

    public string imagen_url { get; set; } = string.Empty;

    public int cantidad { get; set; }

    public int stock { get; set; }

    public decimal precio_unitario { get; set; }

    public decimal precio_normal { get; set; }

    public bool precio_mayorista_aplicado { get; set; }

    public decimal subtotal { get; set; }

    public decimal peso_lb { get; set; }
}

public class CotizarAvisoResponse
{
    public string tipo { get; set; } = string.Empty;

    public string texto { get; set; } = string.Empty;
}