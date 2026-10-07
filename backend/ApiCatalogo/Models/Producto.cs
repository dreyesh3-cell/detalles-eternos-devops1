namespace ApiCatalogo.Models;

public class Producto
{
    public int id { get; set; }

    public string nombre { get; set; } = string.Empty;

    public string categoria { get; set; } = string.Empty;

    public decimal precio { get; set; }

    public decimal precio_mayorista { get; set; }

    public int minimo_mayorista { get; set; }

    public int stock { get; set; }

    public decimal peso_lb { get; set; }

    public string tipo { get; set; } = string.Empty;

    public bool destacado { get; set; }

    public int ventas { get; set; }

    public string descripcion { get; set; } = string.Empty;
    public string? imagen_url { get; set; }
    public bool activo { get; set; } = true;

}