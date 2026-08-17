using BalanzasApi.Models;

namespace BalanzasApi.Repositories;

public interface IPesajeQueryRepository
{
    Task<IEnumerable<Pesaje>> ListarAsync(DateTime? fechaDesde = null, DateTime? fechaHasta = null);
    Task<Pesaje?> ObtenerAsync(int numTran);
    Task<bool> MarcarSalidaAsync(int numTran, DateTime fechaOut, decimal? pesoMedido, bool usarTaraGuardada, int? usuSalId, int? balIdSalida);
    Task<IEnumerable<dynamic>> ResumenHoyAsync();
}
