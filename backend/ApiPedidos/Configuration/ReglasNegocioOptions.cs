namespace ApiPedidos.Configuracion;

public class ReglasNegocioOptions
{
    public decimal EnvioGratisDesde { get; set; }

    public decimal EnvioGratisMaxLb { get; set; }

    public decimal TarifaDomicilio { get; set; }

    public decimal LibrasIncluidas { get; set; }

    public decimal TarifaLibraExtra { get; set; }

    public decimal TarifaExpres { get; set; }

    public decimal CargoEmpaqueRegalo { get; set; }

    public int PuntosCadaQ { get; set; }

    public int StockBajo { get; set; }

    public string[] MunicipiosExpres { get; set; } = [];
}