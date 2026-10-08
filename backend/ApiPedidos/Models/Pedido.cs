namespace ApiPedidos.Models;

public class Pedido
{
    public int id { get; set; }

    public int usuario_id { get; set; }

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

    public decimal subtotal { get; set; }
    public decimal envio { get; set; }
    public decimal cargo_empaque { get; set; }
    public decimal total { get; set; }
    public decimal peso_lb { get; set; }

    public string estado { get; set; } = "PENDIENTE";

    public DateTime creado_en { get; set; }
    public DateTime actualizado_en { get; set; }

    public List<PedidoItem> items { get; set; } = new();
    public List<PedidoHistorial> historial { get; set; } = new();
}