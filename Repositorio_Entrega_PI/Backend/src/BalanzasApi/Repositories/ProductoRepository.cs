using BalanzasApi.Data;
using BalanzasApi.Models;
using Dapper;

namespace BalanzasApi.Repositories;

public class ProductoRepository : IProductoRepository
{
    private readonly IDbConnectionFactory _factory;
    public ProductoRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> CrearAsync(Producto entidad)
    {
        const string sql = @"INSERT INTO dbo.Productos (pro_Nombre, pro_PrecioBase, pro_PesoPorSaco, pro_TipoFlujo, pro_ToleranciaMermaPct, pro_Estado)
VALUES (@Nombre, @PrecioBase, @PesoPorSaco, @TipoFlujo, @ToleranciaMermaPct, @Estado); SELECT CAST(SCOPE_IDENTITY() as int);";
        using var c = _factory.CrearConexion();
        return await c.ExecuteScalarAsync<int>(sql, entidad);
    }

    public async Task<bool> ActualizarAsync(Producto entidad)
    {
        const string sql = @"UPDATE dbo.Productos SET pro_Nombre=@Nombre, pro_PrecioBase=@PrecioBase,
            pro_PesoPorSaco=@PesoPorSaco, pro_TipoFlujo=@TipoFlujo, pro_ToleranciaMermaPct=@ToleranciaMermaPct,
            pro_Estado=@Estado WHERE pro_Codigo=@Codigo";
        using var c = _factory.CrearConexion();
        var afectados = await c.ExecuteAsync(sql, entidad);
        return afectados > 0;
    }

    public async Task<bool> EliminarAsync(int id)
    {
        const string sql = "DELETE FROM dbo.Productos WHERE pro_Codigo = @Id";
        using var c = _factory.CrearConexion();
        var afectados = await c.ExecuteAsync(sql, new { Id = id });
        return afectados > 0;
    }

    public async Task<Producto?> ObtenerAsync(int id)
    {
        const string sql = @"SELECT pro_Codigo AS Codigo, pro_Nombre AS Nombre, pro_PrecioBase AS PrecioBase,
            pro_PesoPorSaco AS PesoPorSaco, pro_TipoFlujo AS TipoFlujo,
            pro_ToleranciaMermaPct AS ToleranciaMermaPct, pro_Estado AS Estado
            FROM dbo.Productos WHERE pro_Codigo = @Id";
        using var c = _factory.CrearConexion();
        return await c.QueryFirstOrDefaultAsync<Producto>(sql, new { Id = id });
    }

    public async Task<IEnumerable<Producto>> ListarAsync()
    {
        const string sql = @"SELECT pro_Codigo AS Codigo, pro_Nombre AS Nombre, pro_PrecioBase AS PrecioBase,
            pro_PesoPorSaco AS PesoPorSaco, pro_TipoFlujo AS TipoFlujo,
            pro_ToleranciaMermaPct AS ToleranciaMermaPct, pro_Estado AS Estado
            FROM dbo.Productos";
        using var c = _factory.CrearConexion();
        return await c.QueryAsync<Producto>(sql);
    }
}
