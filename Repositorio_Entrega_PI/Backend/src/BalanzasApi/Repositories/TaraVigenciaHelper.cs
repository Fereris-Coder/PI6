namespace BalanzasApi.Repositories;

internal class VehiculoTaraInfo
{
    public decimal? TaraKg { get; set; }
    public DateTime? TaraFecha { get; set; }
    public int? TaraVigenciaDias { get; set; }
}

internal static class TaraVigenciaHelper
{
    public const string SqlSelectTara = "SELECT veh_TaraKg AS TaraKg, veh_TaraFecha AS TaraFecha, veh_TaraVigenciaDias AS TaraVigenciaDias FROM dbo.Vehiculos WHERE veh_Placa = @VehPlaca";

    public static bool EsVigente(VehiculoTaraInfo? vehiculo) =>
        vehiculo?.TaraKg is not null
        && (vehiculo.TaraVigenciaDias is null || (DateTime.UtcNow - vehiculo.TaraFecha!.Value).TotalDays <= vehiculo.TaraVigenciaDias.Value);
}
