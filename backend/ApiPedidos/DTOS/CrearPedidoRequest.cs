namespace ApiPedidos.Dtos;

public class CrearPedidoRequest
{
    public string nombre { get; set; } = string.Empty;
    public string telefono { get; set; } = string.Empty;

    public string entrega { get; set; } = string.Empty;
    public string departamento { get; set; } = string.Empty;
    public string municipio { get; set; } = string.Empty;
    public string direccion { get; set; } = string.Empty;
    public string mensajeria { get; set; } = string.Empty;

    public string metodo_pago { get; set; } = string.Empty;
    public int cuotas { get; set; } = 1;
    public string banco { get; set; } = string.Empty;

    public bool empaque_regalo { get; set; }
    public string mensaje_regalo { get; set; } = string.Empty;
    public string notas { get; set; } = string.Empty;

    public List<CrearPedidoItemRequest> items { get; set; } = new();
}

public class CrearPedidoItemRequest
{
    public int producto_id { get; set; }
    public int cantidad { get; set; }
}