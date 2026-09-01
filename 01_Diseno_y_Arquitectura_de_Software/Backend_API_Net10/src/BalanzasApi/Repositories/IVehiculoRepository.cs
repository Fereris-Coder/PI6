using BalanzasApi.Models;

namespace BalanzasApi.Repositories;

public interface IVehiculoRepository
{
    Task<bool> CrearAsync(Vehiculo entidad);
    Task<bool> ActualizarAsync(Vehiculo entidad);
    Task<bool> EliminarAsync(string placa);
    Task<Vehiculo?> ObtenerAsync(string placa);
    Task<IEnumerable<Vehiculo>> ListarAsync();
    Task<bool> ActualizarTaraAsync(string placa, decimal taraKg, int? vigenciaDias);
    Task<IEnumerable<VehiculoTaraProducto>> ListarTarasPorProductoAsync(string? placa = null);
    Task<bool> GuardarTaraProductoAsync(string placa, int proCodigo, decimal taraKg, int vigenciaDias);
}
