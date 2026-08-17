using BalanzasApi.Models;

namespace BalanzasApi.Repositories;

public interface IProductoRepository
{
    Task<int> CrearAsync(Producto entidad);
    Task<bool> ActualizarAsync(Producto entidad);
    Task<bool> EliminarAsync(int id);
    Task<Producto?> ObtenerAsync(int id);
    Task<IEnumerable<Producto>> ListarAsync();
}
