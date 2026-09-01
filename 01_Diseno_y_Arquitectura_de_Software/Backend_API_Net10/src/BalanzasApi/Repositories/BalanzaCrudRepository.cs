using BalanzasApi.Data;
using BalanzasApi.Models;
using Dapper;

namespace BalanzasApi.Repositories;

public class BalanzaCrudRepository : IBalanzaCrudRepository
{
    private readonly IDbConnectionFactory _factory;
    public BalanzaCrudRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> CrearAsync(Balanza entidad)
    {
        const string sql = @"INSERT INTO dbo.Balanzas (bal_Descripcion, bal_Ip, bal_Puerto, bal_Ubicacion, bal_Estado) VALUES (@Descripcion, @Ip, @Puerto, @Ubicacion, @Estado); SELECT CAST(SCOPE_IDENTITY() as int);";
        using var c = _factory.CrearConexion();
        return await c.ExecuteScalarAsync<int>(sql, entidad);
    }

    public async Task<bool> ActualizarAsync(Balanza entidad)
    {
        const string sql = @"UPDATE dbo.Balanzas SET bal_Descripcion=@Descripcion, bal_Ip=@Ip, bal_Puerto=@Puerto, bal_Ubicacion=@Ubicacion, bal_Estado=@Estado WHERE bal_Id=@Id";
        using var c = _factory.CrearConexion();
        var afectados = await c.ExecuteAsync(sql, entidad);
        return afectados > 0;
    }

    public async Task<bool> EliminarAsync(int id)
    {
        const string sql = "DELETE FROM dbo.Balanzas WHERE bal_Id = @Id";
        using var c = _factory.CrearConexion();
        var afectados = await c.ExecuteAsync(sql, new { Id = id });
        return afectados > 0;
    }

    public async Task<Balanza?> ObtenerAsync(int id)
    {
        const string sql = @"SELECT bal_Id AS Id, bal_Descripcion AS Descripcion, bal_Ip AS Ip, bal_Puerto AS Puerto, bal_Ubicacion AS Ubicacion, bal_Estado AS Estado FROM dbo.Balanzas WHERE bal_Id = @Id";
        using var c = _factory.CrearConexion();
        return await c.QueryFirstOrDefaultAsync<Balanza>(sql, new { Id = id });
    }

    public async Task<IEnumerable<Balanza>> ListarAsync()
    {
        const string sql = @"SELECT bal_Id AS Id, bal_Descripcion AS Descripcion, bal_Ip AS Ip, bal_Puerto AS Puerto, bal_Ubicacion AS Ubicacion, bal_Estado AS Estado FROM dbo.Balanzas";
        using var c = _factory.CrearConexion();
        return await c.QueryAsync<Balanza>(sql);
    }
}
