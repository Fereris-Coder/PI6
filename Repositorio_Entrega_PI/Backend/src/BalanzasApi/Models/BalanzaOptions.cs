namespace BalanzasApi.Models;

public class BalanzaOptions
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Ubicacion { get; set; }
    public string Ip { get; set; } = string.Empty;
    public int Puerto { get; set; }
    public bool UsaChecksum { get; set; }
}
