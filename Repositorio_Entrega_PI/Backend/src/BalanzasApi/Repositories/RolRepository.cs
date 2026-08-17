using BalanzasApi.Data;
using BalanzasApi.Models;
using Dapper;

namespace BalanzasApi.Repositories;

public class RolRepository : IRolRepository
{
    private readonly IDbConnectionFactory _factory;
    public RolRepository(IDbConnectionFactory factory) => _factory = factory;

    private const string Columnas = "rol_Id AS Id, rol_Nombre AS Nombre, rol_Descripcion AS Descripcion, rol_Modulos AS ModulosCsv, rol_Estado AS Estado";

    public async Task<int> CrearAsync(Rol entidad)
    {
        const string sql = @"INSERT INTO dbo.Roles (rol_Nombre, rol_Descripcion, rol_Modulos, rol_Estado) VALUES (@Nombre, @Descripcion, @ModulosCsv, @Estado); SELECT CAST(SCOPE_IDENTITY() as int);";
        using var c = _factory.CrearConexion();
        return await c.ExecuteScalarAsync<int>(sql, ParametrosDesde(entidad));
    }

    public async Task<bool> ActualizarAsync(Rol entidad)
    {
        const string sql = @"UPDATE dbo.Roles SET rol_Nombre=@Nombre, rol_Descripcion=@Descripcion, rol_Modulos=@ModulosCsv, rol_Estado=@Estado WHERE rol_Id=@Id";
        using var c = _factory.CrearConexion();
        var afectados = await c.ExecuteAsync(sql, ParametrosDesde(entidad));
        return afectados > 0;
    }

    public async Task<bool> EliminarAsync(int id)
    {
        const string sql = "DELETE FROM dbo.Roles WHERE rol_Id = @Id";
        using var c = _factory.CrearConexion();
        var afectados = await c.ExecuteAsync(sql, new { Id = id });
        return afectados > 0;
    }

    public async Task<Rol?> ObtenerAsync(int id)
    {
        var sql = $"SELECT {Columnas} FROM dbo.Roles WHERE rol_Id = @Id";
        using var c = _factory.CrearConexion();
        var fila = await c.QueryFirstOrDefaultAsync<RolFila>(sql, new { Id = id });
        return fila?.ARol();
    }

    public async Task<IEnumerable<Rol>> ListarAsync()
    {
        var sql = $"SELECT {Columnas} FROM dbo.Roles";
        using var c = _factory.CrearConexion();
        var filas = await c.QueryAsync<RolFila>(sql);
        return filas.Select(f => f.ARol());
    }

    private static object ParametrosDesde(Rol entidad) => new
    {
        entidad.Id,
        entidad.Nombre,
        entidad.Descripcion,
        entidad.Estado,
        ModulosCsv = string.Join(',', entidad.Modulos)
    };

    // Dapper no convierte automáticamente una columna VARCHAR (CSV) a List<string>,
    // así que se lee a esta forma intermedia y se parte manualmente.
    private class RolFila
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public string? Descripcion { get; set; }
        public string? ModulosCsv { get; set; }
        public bool Estado { get; set; }

        public Rol ARol() => new()
        {
            Id = Id,
            Nombre = Nombre,
            Descripcion = Descripcion,
            Estado = Estado,
            Modulos = string.IsNullOrWhiteSpace(ModulosCsv)
                ? new List<string>()
                : ModulosCsv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
        };
    }
}
