using BalanzasApi.Models;

namespace BalanzasApi.Repositories;

public interface IClienteRepository
{
    Task<int> CrearAsync(Cliente entidad);
    Task<bool> ActualizarAsync(Cliente entidad);
    Task<bool> EliminarAsync(int id);
    Task<Cliente?> ObtenerAsync(int id);
    Task<IEnumerable<Cliente>> ListarAsync();
}
