using BalanzasApi.Models;

namespace BalanzasApi.Repositories;

public interface IRolRepository
{
    Task<int> CrearAsync(Rol entidad);
    Task<bool> ActualizarAsync(Rol entidad);
    Task<bool> EliminarAsync(int id);
    Task<Rol?> ObtenerAsync(int id);
    Task<IEnumerable<Rol>> ListarAsync();
}
