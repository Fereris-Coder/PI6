using BalanzasApi.Models;

namespace BalanzasApi.Repositories;

public interface IAuditoriaRepository
{
    Task<int> CrearAsync(Auditoria entidad);
    Task<IEnumerable<Auditoria>> ListarAsync();
}
