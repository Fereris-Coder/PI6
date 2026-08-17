using BalanzasApi.Models;

namespace BalanzasApi.Repositories;

public interface IBalanzaRepository
{
    Task<List<BalanzaOptions>> ObtenerActivasAsync();
}
