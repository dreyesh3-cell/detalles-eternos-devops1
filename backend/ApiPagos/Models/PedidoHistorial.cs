namespace ApiPagos.Models;

public class PedidoHistorial
{
    public int id { get; set; }
    public int pedido_id { get; set; }
    public string estado { get; set; } = string.Empty;
    public DateTime fecha { get; set; }
}