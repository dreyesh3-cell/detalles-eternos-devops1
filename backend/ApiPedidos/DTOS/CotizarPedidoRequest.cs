namespace ApiPedidos.Dtos;

public class CotizarPedidoRequest
{
    public List<CotizarItemRequest> items { get; set; } = new();

    public string entrega { get; set; } = string.Empty;

    public string departamento { get; set; } = string.Empty;

    public string municipio { get; set; } = string.Empty;

    public bool empaque_regalo { get; set; }
}

public class CotizarItemRequest
{
    public int producto_id { get; set; }

    public int cantidad { get; set; }
}