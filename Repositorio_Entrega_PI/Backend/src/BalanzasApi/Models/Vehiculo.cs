namespace BalanzasApi.Models;

public class Vehiculo
{
    public string Placa { get; set; } = null!;
    public string? Marca { get; set; }
    public string? Modelo { get; set; }
    public int NumeroEjes { get; set; } = 2; // 2, 3, 4, 5, 6 ejes
    public string TipoConfiguracion { get; set; } = "2S - Camión 2 Ejes (18T)";
    public decimal? CapacidadToneladas { get; set; } = 18.00m;
    public decimal? TaraKg { get; set; }
    public DateTime? TaraFecha { get; set; }
    public int? TaraVigenciaDias { get; set; } = 30;
    public bool TaraVigente { get; set; }
    public string TipoUso { get; set; } = "Proveedor";
    public int? CliId { get; set; }
    public string? ChoferHabitual { get; set; }
    public bool Estado { get; set; } = true;
    public List<VehiculoTaraProducto> TarasPorProducto { get; set; } = new();
}
