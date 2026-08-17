using BalanzasApi.Models;

namespace BalanzasApi.Repositories;

public interface IConfiguracionRepository
{
    Task<int> CrearAsync(Configuracion entidad);
    Task<bool> ActualizarAsync(Configuracion entidad);
    Task<bool> EliminarAsync(int id);
    Task<Configuracion?> ObtenerAsync(int id);
    Task<IEnumerable<Configuracion>> ListarAsync();
}
