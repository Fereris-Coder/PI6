namespace BalanzasApi.Models;

public class Balanza
{
    public int Id { get; set; }
    public string Descripcion { get; set; } = null!;
    public string Ip { get; set; } = null!;
    public int Puerto { get; set; }
    public string? Ubicacion { get; set; }
    public bool Estado { get; set; }
}
