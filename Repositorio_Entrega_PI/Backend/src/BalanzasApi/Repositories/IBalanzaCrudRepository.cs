using BalanzasApi.Models;

namespace BalanzasApi.Repositories;

public interface IBalanzaCrudRepository
{
    Task<int> CrearAsync(Balanza entidad);
    Task<bool> ActualizarAsync(Balanza entidad);
    Task<bool> EliminarAsync(int id);
    Task<Balanza?> ObtenerAsync(int id);
    Task<IEnumerable<Balanza>> ListarAsync();
}
