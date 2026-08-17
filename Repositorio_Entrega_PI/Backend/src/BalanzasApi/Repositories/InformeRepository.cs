using BalanzasApi.Data;
using BalanzasApi.Models;
using Dapper;

namespace BalanzasApi.Repositories;

public class InformeRepository : IInformeRepository
{
    private readonly IDbConnectionFactory _factory;
    public InformeRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> CrearAsync(Informe entidad)
    {
        const string sql = @"INSERT INTO dbo.Informes (inf_Titulo, inf_Contenido, inf_FechaGeneracion, inf_Estado) VALUES (@Titulo, @Contenido, @FechaGeneracion, @Estado); SELECT CAST(SCOPE_IDENTITY() as int);";
        using var c = _factory.CrearConexion();
        return await c.ExecuteScalarAsync<int>(sql, entidad);
    }

    public async Task<bool> ActualizarAsync(Informe entidad)
    {
        const string sql = @"UPDATE dbo.Informes SET inf_Titulo=@Titulo, inf_Contenido=@Contenido, inf_FechaGeneracion=@FechaGeneracion, inf_Estado=@Estado WHERE inf_Id=@Id";
        using var c = _factory.CrearConexion();
        var afectados = await c.ExecuteAsync(sql, entidad);
        return afectados > 0;
    }

    public async Task<bool> EliminarAsync(int id)
    {
        const string sql = "DELETE FROM dbo.Informes WHERE inf_Id = @Id";
        using var c = _factory.CrearConexion();
        var afectados = await c.ExecuteAsync(sql, new { Id = id });
        return afectados > 0;
    }

    public async Task<Informe?> ObtenerAsync(int id)
    {
        const string sql = @"SELECT inf_Id AS Id, inf_Titulo AS Titulo, inf_Contenido AS Contenido, inf_FechaGeneracion AS FechaGeneracion, inf_Estado AS Estado FROM dbo.Informes WHERE inf_Id = @Id";
        using var c = _factory.CrearConexion();
        return await c.QueryFirstOrDefaultAsync<Informe>(sql, new { Id = id });
    }

    public async Task<IEnumerable<Informe>> ListarAsync()
    {
        const string sql = @"SELECT inf_Id AS Id, inf_Titulo AS Titulo, inf_Contenido AS Contenido, inf_FechaGeneracion AS FechaGeneracion, inf_Estado AS Estado FROM dbo.Informes";
        using var c = _factory.CrearConexion();
        return await c.QueryAsync<Informe>(sql);
    }
}
