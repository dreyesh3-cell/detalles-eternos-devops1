namespace ApiAuth.Models;

public class Usuario
{
    public int id { get; set; }

    public string nombre { get; set; } = string.Empty;

    public string email { get; set; } = string.Empty;

    public string telefono { get; set; } = string.Empty;

    public string password_hash { get; set; } = string.Empty;

    public string rol { get; set; } = "cliente";

    public int puntos { get; set; } = 0;

    public bool solicita_mayorista { get; set; } = false;

    public bool activo { get; set; } = true;
}