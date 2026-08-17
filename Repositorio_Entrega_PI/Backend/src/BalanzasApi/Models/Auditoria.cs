using System;

namespace BalanzasApi.Models;

public class Auditoria
{
    public int Id { get; set; }
    public string TablaAfectada { get; set; } = null!;
    public string Accion { get; set; } = null!;
    public int UsuId { get; set; }
    public DateTime? Fecha { get; set; }
    public string? Detalle { get; set; }
    public bool Estado { get; set; }
}
