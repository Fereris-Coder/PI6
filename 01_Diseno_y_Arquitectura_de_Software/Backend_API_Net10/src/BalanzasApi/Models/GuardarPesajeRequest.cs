namespace BalanzasApi.Models;

public class GuardarPesajeRequest
{
    public string VehPlaca { get; set; } = string.Empty;
    public int CliId { get; set; }
    public int ProCodigo { get; set; }
    public int BalId { get; set; }
    public decimal PesoBruto { get; set; }
    public string? NombreChofer { get; set; }
    public string? GuiaRemision { get; set; }
    public string? Orden { get; set; }
    public string? Observacion { get; set; }
    public int UsuIngId { get; set; }
}
