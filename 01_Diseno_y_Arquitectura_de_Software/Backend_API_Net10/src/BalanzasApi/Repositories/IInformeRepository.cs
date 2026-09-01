using BalanzasApi.Models;

namespace BalanzasApi.Repositories;

public interface IInformeRepository
{
    Task<int> CrearAsync(Informe entidad);
    Task<bool> ActualizarAsync(Informe entidad);
    Task<bool> EliminarAsync(int id);
    Task<Informe?> ObtenerAsync(int id);
    Task<IEnumerable<Informe>> ListarAsync();
}
