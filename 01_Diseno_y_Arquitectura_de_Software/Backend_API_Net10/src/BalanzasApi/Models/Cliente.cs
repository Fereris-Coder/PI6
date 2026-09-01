namespace BalanzasApi.Models;

public class Cliente
{
    public int Id { get; set; }
    public string Identificacion { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public string? Direccion { get; set; }
    public string? Correo { get; set; }
    public string Tipo { get; set; } = "Cliente";
    public bool Estado { get; set; }
}
