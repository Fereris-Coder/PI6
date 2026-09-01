using BalanzasApi.Data;
using BalanzasApi.Models;
using Dapper;

namespace BalanzasApi.Repositories;

public class AuditoriaRepository : IAuditoriaRepository
{
    private readonly IDbConnectionFactory _factory;
    public AuditoriaRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> CrearAsync(Auditoria entidad)
    {
        const string sql = @"INSERT INTO dbo.Auditoria (aud_TablaAfectada, aud_Accion, aud_UsuId, aud_Detalle, aud_Estado) VALUES (@TablaAfectada, @Accion, @UsuId, @Detalle, @Estado); SELECT CAST(SCOPE_IDENTITY() as int);";
        using var c = _factory.CrearConexion();
        return await c.ExecuteScalarAsync<int>(sql, entidad);
    }

    public async Task<IEnumerable<Auditoria>> ListarAsync()
    {
        const string sql = @"SELECT aud_Id AS Id, aud_TablaAfectada AS TablaAfectada, aud_Accion AS Accion, aud_UsuId AS UsuId, aud_Fecha AS Fecha, aud_Detalle AS Detalle, aud_Estado AS Estado FROM dbo.Auditoria";
        using var c = _factory.CrearConexion();
        return await c.QueryAsync<Auditoria>(sql);
    }
}
