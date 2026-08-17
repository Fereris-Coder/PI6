namespace BalanzasApi.Models;

public class Pesaje
{
    public int NumTran { get; set; }
    public DateTime FechaHoraIn { get; set; }
    public DateTime? FechaHoraOut { get; set; }
    public int? DuracionMin { get; set; }
    public decimal PesoBruto { get; set; }
    public decimal PesoTara { get; set; }
    public decimal PesoNeto { get; set; }
    public decimal? PesoOrigen { get; set; }
    public decimal? MermaKg { get; set; }
    public decimal? MermaPct { get; set; }
    public int? NumBins { get; set; }
    public int? NumGavetas { get; set; }
    public string? LoteTraza { get; set; }
    public string? GuiaRemision { get; set; }
    public string? Orden { get; set; }
    public string? Observacion { get; set; }
    public string? NombreChofer { get; set; }
    public string? SelloDigitalHash { get; set; }
    public string EstadoViaje { get; set; } = "VIAJE_COMPLETADO_OK";
    public bool Estado { get; set; } = true;
    public string VehPlaca { get; set; } = null!;
    public int CliId { get; set; }
    public int ProCodigo { get; set; }
    public int BalId { get; set; }
    public int? BalIdSalida { get; set; }
    public int UsuIngId { get; set; }
    public int? UsuSalId { get; set; }
    public string TipoOperacion { get; set; } = "Descarga";
}
