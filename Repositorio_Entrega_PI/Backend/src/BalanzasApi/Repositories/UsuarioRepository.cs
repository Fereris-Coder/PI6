using BalanzasApi.Data;
using BalanzasApi.Models;
using Dapper;

namespace BalanzasApi.Repositories;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly IDbConnectionFactory _factory;
    public UsuarioRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> CrearAsync(Usuario entidad)
    {
        const string sql = @"INSERT INTO dbo.Usuarios (usu_NombreUsuario, usu_NombreCompleto, usu_PasswordHash, usu_Correo, usu_Turno, usu_RolId, usu_Estado)
VALUES (@NombreUsuario, @NombreCompleto, @PasswordHash, @Correo, @Turno, @RolId, @Estado); SELECT CAST(SCOPE_IDENTITY() as int);";
        using var c = _factory.CrearConexion();
        return await c.ExecuteScalarAsync<int>(sql, entidad);
    }

    public async Task<bool> ActualizarAsync(Usuario entidad)
    {
        const string sql = @"UPDATE dbo.Usuarios SET usu_NombreUsuario=@NombreUsuario, usu_NombreCompleto=@NombreCompleto, usu_PasswordHash=@PasswordHash, usu_Correo=@Correo, usu_Turno=@Turno, usu_RolId=@RolId, usu_Estado=@Estado WHERE usu_Id=@Id";
        using var c = _factory.CrearConexion();
        var afectados = await c.ExecuteAsync(sql, entidad);
        return afectados > 0;
    }

    public async Task<bool> EliminarAsync(int id)
    {
        const string sql = "DELETE FROM dbo.Usuarios WHERE usu_Id = @Id";
        using var c = _factory.CrearConexion();
        var afectados = await c.ExecuteAsync(sql, new { Id = id });
        return afectados > 0;
    }

    public async Task<Usuario?> ObtenerAsync(int id)
    {
        const string sql = @"SELECT usu_Id AS Id, usu_NombreUsuario AS NombreUsuario, usu_NombreCompleto AS NombreCompleto, usu_PasswordHash AS PasswordHash, usu_Correo AS Correo, usu_Turno AS Turno, usu_RolId AS RolId, usu_Estado AS Estado FROM dbo.Usuarios WHERE usu_Id = @Id";
        using var c = _factory.CrearConexion();
        return await c.QueryFirstOrDefaultAsync<Usuario>(sql, new { Id = id });
    }

    public async Task<Usuario?> ObtenerPorNombreAsync(string nombreUsuario)
    {
        const string sql = @"SELECT usu_Id AS Id, usu_NombreUsuario AS NombreUsuario, usu_NombreCompleto AS NombreCompleto, usu_PasswordHash AS PasswordHash, usu_Correo AS Correo, usu_Turno AS Turno, usu_RolId AS RolId, usu_Estado AS Estado FROM dbo.Usuarios WHERE usu_NombreUsuario = @NombreUsuario";
        using var c = _factory.CrearConexion();
        return await c.QueryFirstOrDefaultAsync<Usuario>(sql, new { NombreUsuario = nombreUsuario });
    }

    public async Task<IEnumerable<Usuario>> ListarAsync()
    {
        const string sql = @"SELECT usu_Id AS Id, usu_NombreUsuario AS NombreUsuario, usu_NombreCompleto AS NombreCompleto, usu_PasswordHash AS PasswordHash, usu_Correo AS Correo, usu_Turno AS Turno, usu_RolId AS RolId, usu_Estado AS Estado FROM dbo.Usuarios";
        using var c = _factory.CrearConexion();
        return await c.QueryAsync<Usuario>(sql);
    }
}
