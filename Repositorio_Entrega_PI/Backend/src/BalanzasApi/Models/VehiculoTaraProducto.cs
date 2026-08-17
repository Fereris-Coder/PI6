namespace BalanzasApi.Models;

public class VehiculoTaraProducto
{
    public int Id { get; set; }
    public string VehPlaca { get; set; } = null!;
    public int ProCodigo { get; set; }
    public string? ProductoNombre { get; set; }
    public decimal TaraKg { get; set; }
    public DateTime TaraFecha { get; set; }
    public int VigenciaDias { get; set; } = 30;
    public int DiasRestantes { get; set; }
    public bool TaraVigente { get; set; }
    public bool Estado { get; set; } = true;
}
