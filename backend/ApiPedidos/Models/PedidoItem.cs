namespace ApiPedidos.Models;

public class PedidoItem
{
    public int id { get; set; }

    public int pedido_id { get; set; }
    public int producto_id { get; set; }

    public string nombre { get; set; } = string.Empty;

    public int cantidad { get; set; }

    public decimal precio_unitario { get; set; }
    public decimal subtotal { get; set; }

    public Pedido? pedido { get; set; }
}