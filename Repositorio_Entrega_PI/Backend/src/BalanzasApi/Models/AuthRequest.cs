namespace BalanzasApi.Models;

public class AuthRequest
{
    public string NombreUsuario { get; set; } = null!;
    public string Password { get; set; } = null!;
}
