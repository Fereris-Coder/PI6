using BalanzasApi.Data;
using BalanzasApi.Models;
using Dapper;

namespace BalanzasApi.Repositories;

public class ConfiguracionRepository : IConfiguracionRepository
{
    private readonly IDbConnectionFactory _factory;
    public ConfiguracionRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> CrearAsync(Configuracion entidad)
    {
        const string sql = @"INSERT INTO dbo.Configuraciones (cnf_Parametro, cnf_Valor, cnf_Estado) VALUES (@Parametro, @Valor, @Estado); SELECT CAST(SCOPE_IDENTITY() as int);";
        using var c = _factory.CrearConexion();
        return await c.ExecuteScalarAsync<int>(sql, entidad);
    }

    public async Task<bool> ActualizarAsync(Configuracion entidad)
    {
        const string sql = @"UPDATE dbo.Configuraciones SET cnf_Parametro=@Parametro, cnf_Valor=@Valor, cnf_Estado=@Estado WHERE cnf_Id=@Id";
        using var c = _factory.CrearConexion();
        var afectados = await c.ExecuteAsync(sql, entidad);
        return afectados > 0;
    }

    public async Task<bool> EliminarAsync(int id)
    {
        const string sql = "DELETE FROM dbo.Configuraciones WHERE cnf_Id = @Id";
        using var c = _factory.CrearConexion();
        var afectados = await c.ExecuteAsync(sql, new { Id = id });
        return afectados > 0;
    }

    public async Task<Configuracion?> ObtenerAsync(int id)
    {
        const string sql = @"SELECT cnf_Id AS Id, cnf_Parametro AS Parametro, cnf_Valor AS Valor, cnf_Estado AS Estado FROM dbo.Configuraciones WHERE cnf_Id = @Id";
        using var c = _factory.CrearConexion();
        return await c.QueryFirstOrDefaultAsync<Configuracion>(sql, new { Id = id });
    }

    public async Task<IEnumerable<Configuracion>> ListarAsync()
    {
        const string sql = @"SELECT cnf_Id AS Id, cnf_Parametro AS Parametro, cnf_Valor AS Valor, cnf_Estado AS Estado FROM dbo.Configuraciones";
        using var c = _factory.CrearConexion();
        return await c.QueryAsync<Configuracion>(sql);
    }
}
