using BalanzasApi.Data;
using BalanzasApi.Models;
using Dapper;

namespace BalanzasApi.Repositories;

public class ClienteRepository : IClienteRepository
{
    private readonly IDbConnectionFactory _factory;
    public ClienteRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> CrearAsync(Cliente entidad)
    {
        const string sql = @"INSERT INTO dbo.Clientes (cli_Identificacion, cli_Nombre, cli_Direccion, cli_Correo, cli_Tipo, cli_Estado)
VALUES (@Identificacion, @Nombre, @Direccion, @Correo, @Tipo, @Estado);
SELECT CAST(SCOPE_IDENTITY() as int);";

        using var c = _factory.CrearConexion();
        return await c.ExecuteScalarAsync<int>(sql, entidad);
    }

    public async Task<bool> ActualizarAsync(Cliente entidad)
    {
        const string sql = @"UPDATE dbo.Clientes SET cli_Identificacion=@Identificacion, cli_Nombre=@Nombre, cli_Direccion=@Direccion, cli_Correo=@Correo, cli_Tipo=@Tipo, cli_Estado=@Estado WHERE cli_Id=@Id";
        using var c = _factory.CrearConexion();
        var afectados = await c.ExecuteAsync(sql, entidad);
        return afectados > 0;
    }

    public async Task<bool> EliminarAsync(int id)
    {
        const string sql = "DELETE FROM dbo.Clientes WHERE cli_Id = @Id";
        using var c = _factory.CrearConexion();
        var afectados = await c.ExecuteAsync(sql, new { Id = id });
        return afectados > 0;
    }

    public async Task<Cliente?> ObtenerAsync(int id)
    {
        const string sql = @"SELECT cli_Id AS Id, cli_Identificacion AS Identificacion, cli_Nombre AS Nombre, cli_Direccion AS Direccion, cli_Correo AS Correo, cli_Tipo AS Tipo, cli_Estado AS Estado FROM dbo.Clientes WHERE cli_Id = @Id";
        using var c = _factory.CrearConexion();
        return await c.QueryFirstOrDefaultAsync<Cliente>(sql, new { Id = id });
    }

    public async Task<IEnumerable<Cliente>> ListarAsync()
    {
        const string sql = @"SELECT cli_Id AS Id, cli_Identificacion AS Identificacion, cli_Nombre AS Nombre, cli_Direccion AS Direccion, cli_Correo AS Correo, cli_Tipo AS Tipo, cli_Estado AS Estado FROM dbo.Clientes";
        using var c = _factory.CrearConexion();
        return await c.QueryAsync<Cliente>(sql);
    }
}
