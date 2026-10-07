namespace ApiPagos.Models;

public class Pago
{
    public int id { get; set; }

    public int pedido_id { get; set; }

    public int usuario_id { get; set; }

    public decimal monto { get; set; }

    public string metodo_pago { get; set; } = string.Empty;

    public int cuotas { get; set; } = 1;

    public string banco { get; set; } = string.Empty;

    public string estado { get; set; } = "PENDIENTE";

    public string referencia { get; set; } = string.Empty;

    public DateTime creado_en { get; set; }

    public DateTime actualizado_en { get; set; }
}