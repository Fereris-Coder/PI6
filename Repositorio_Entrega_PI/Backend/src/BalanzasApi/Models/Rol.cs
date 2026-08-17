namespace BalanzasApi.Models;

public class Rol
{
    public int Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public List<string> Modulos { get; set; } = new();
    public bool Estado { get; set; }
}
