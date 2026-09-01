namespace BalanzasApi.Models;

public class Usuario
{
    public int Id { get; set; }
    public string NombreUsuario { get; set; } = null!;
    public string NombreCompleto { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string? Correo { get; set; }
    public string? Turno { get; set; }
    public int RolId { get; set; }
    public bool Estado { get; set; }
}
