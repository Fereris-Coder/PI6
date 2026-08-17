using System;

namespace BalanzasApi.Models;

public class Informe
{
    public int Id { get; set; }
    public string Titulo { get; set; } = null!;
    public string? Contenido { get; set; }
    public DateTime? FechaGeneracion { get; set; }
    public bool Estado { get; set; }
}
