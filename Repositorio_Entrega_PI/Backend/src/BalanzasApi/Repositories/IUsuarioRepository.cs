// IUsuarioRepository interface
using BalanzasApi.Models;

namespace BalanzasApi.Repositories;

public interface IUsuarioRepository
{
    Task<int> CrearAsync(Usuario entidad);
    Task<bool> ActualizarAsync(Usuario entidad);
    Task<bool> EliminarAsync(int id);
    Task<Usuario?> ObtenerAsync(int id);
    Task<Usuario?> ObtenerPorNombreAsync(string nombreUsuario);
    Task<IEnumerable<Usuario>> ListarAsync();
}
