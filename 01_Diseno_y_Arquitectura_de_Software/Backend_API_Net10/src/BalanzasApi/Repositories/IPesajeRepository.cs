using BalanzasApi.Models;

namespace BalanzasApi.Repositories;

public interface IPesajeRepository
{
    Task<int> GuardarAsync(GuardarPesajeRequest registro);
    Task<int> GuardarDirectoAsync(GuardarPesajeDirectoRequest registro);
}
