namespace BalanzasApi.Models;

public class Configuracion
{
    public int Id { get; set; }
    public string Parametro { get; set; } = null!;
    public string Valor { get; set; } = null!;
    public bool Estado { get; set; }
}
