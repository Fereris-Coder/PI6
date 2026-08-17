using BalanzasApi.Data;
using BalanzasApi.Models;
using Dapper;

namespace BalanzasApi.Repositories;

public class BalanzaRepository : IBalanzaRepository
{
    private readonly IDbConnectionFactory _factory;

    public BalanzaRepository(IDbConnectionFactory factory)
    {
        _factory = factory;
    }

    public async Task<List<BalanzaOptions>> ObtenerActivasAsync()
    {
        const string sql = """
            SELECT
                bal_Id          AS Id,
                bal_Descripcion AS Nombre,
                bal_Ubicacion   AS Ubicacion,
                bal_Ip          AS Ip,
                bal_Puerto      AS Puerto
            FROM dbo.Balanzas
            WHERE bal_Estado = 1;
            """;

        using var conexion = _factory.CrearConexion();
        var balanzas = await conexion.QueryAsync<BalanzaOptions>(sql);
        return balanzas.ToList();
    }
}
