using BalanzasApi.Data;
using BalanzasApi.Models;
using Dapper;

namespace BalanzasApi.Repositories;

public class VehiculoRepository : IVehiculoRepository
{
    private readonly IDbConnectionFactory _factory;
    public VehiculoRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<bool> CrearAsync(Vehiculo entidad)
    {
        const string sql = @"INSERT INTO dbo.Vehiculos
            (veh_Placa, veh_Marca, veh_Modelo, veh_NumeroEjes, veh_TipoConfiguracion, veh_CapacidadToneladas, veh_TipoUso, veh_CliId, veh_ChoferHabitual, veh_Estado)
            VALUES (@Placa, @Marca, @Modelo, @NumeroEjes, @TipoConfiguracion, @CapacidadToneladas, @TipoUso, @CliId, @ChoferHabitual, @Estado)";
        using var c = _factory.CrearConexion();
        var afectados = await c.ExecuteAsync(sql, entidad);
        return afectados > 0;
    }

    public async Task<bool> ActualizarAsync(Vehiculo entidad)
    {
        const string sql = @"UPDATE dbo.Vehiculos SET
            veh_Marca=@Marca, veh_Modelo=@Modelo, veh_NumeroEjes=@NumeroEjes,
            veh_TipoConfiguracion=@TipoConfiguracion, veh_CapacidadToneladas=@CapacidadToneladas,
            veh_TipoUso=@TipoUso, veh_CliId=@CliId, veh_ChoferHabitual=@ChoferHabitual, veh_Estado=@Estado
            WHERE veh_Placa=@Placa";
        using var c = _factory.CrearConexion();
        var afectados = await c.ExecuteAsync(sql, entidad);
        return afectados > 0;
    }

    public async Task<bool> EliminarAsync(string placa)
    {
        const string sql = "DELETE FROM dbo.Vehiculos WHERE veh_Placa = @Placa";
        using var c = _factory.CrearConexion();
        var afectados = await c.ExecuteAsync(sql, new { Placa = placa });
        return afectados > 0;
    }

    private const string ColumnasSelect = @"
        veh_Placa AS Placa, veh_Marca AS Marca, veh_Modelo AS Modelo,
        veh_NumeroEjes AS NumeroEjes, veh_TipoConfiguracion AS TipoConfiguracion,
        veh_CapacidadToneladas AS CapacidadToneladas, veh_TipoUso AS TipoUso, 
        veh_CliId AS CliId, veh_ChoferHabitual AS ChoferHabitual, veh_Estado AS Estado,
        veh_TaraKg AS TaraKg, veh_TaraFecha AS TaraFecha, veh_TaraVigenciaDias AS TaraVigenciaDias,
        CASE
            WHEN veh_TaraKg IS NULL THEN CAST(0 AS BIT)
            WHEN veh_TaraVigenciaDias IS NULL THEN CAST(1 AS BIT)
            WHEN DATEDIFF(DAY, veh_TaraFecha, SYSUTCDATETIME()) <= veh_TaraVigenciaDias THEN CAST(1 AS BIT)
            ELSE CAST(0 AS BIT)
        END AS TaraVigente";

    public async Task<Vehiculo?> ObtenerAsync(string placa)
    {
        var sql = $"SELECT {ColumnasSelect} FROM dbo.Vehiculos WHERE veh_Placa = @Placa";
        using var c = _factory.CrearConexion();
        var veh = await c.QueryFirstOrDefaultAsync<Vehiculo>(sql, new { Placa = placa });
        if (veh != null)
        {
            var taras = await ListarTarasPorProductoAsync(placa);
            veh.TarasPorProducto = taras.ToList();
        }
        return veh;
    }

    public async Task<IEnumerable<Vehiculo>> ListarAsync()
    {
        var sql = $"SELECT {ColumnasSelect} FROM dbo.Vehiculos";
        using var c = _factory.CrearConexion();
        var vehiculos = (await c.QueryAsync<Vehiculo>(sql)).ToList();

        var todasTaras = (await ListarTarasPorProductoAsync()).ToList();
        foreach (var v in vehiculos)
        {
            v.TarasPorProducto = todasTaras.Where(t => t.VehPlaca.Equals(v.Placa, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        return vehiculos;
    }

    public async Task<bool> ActualizarTaraAsync(string placa, decimal taraKg, int? vigenciaDias)
    {
        const string sql = @"UPDATE dbo.Vehiculos SET veh_TaraKg = @TaraKg, veh_TaraFecha = SYSUTCDATETIME(), veh_TaraVigenciaDias = @VigenciaDias WHERE veh_Placa = @Placa";
        using var c = _factory.CrearConexion();
        var afectados = await c.ExecuteAsync(sql, new { Placa = placa, TaraKg = taraKg, VigenciaDias = vigenciaDias });
        return afectados > 0;
    }

    public async Task<IEnumerable<VehiculoTaraProducto>> ListarTarasPorProductoAsync(string? placa = null)
    {
        var sql = @"
            SELECT 
                vtp.vtp_Id AS Id,
                vtp.vtp_VehPlaca AS VehPlaca,
                vtp.vtp_ProCodigo AS ProCodigo,
                p.pro_Nombre AS ProductoNombre,
                vtp.vtp_TaraKg AS TaraKg,
                vtp.vtp_TaraFecha AS TaraFecha,
                vtp.vtp_VigenciaDias AS VigenciaDias,
                CASE 
                    WHEN vtp.vtp_VigenciaDias - DATEDIFF(DAY, vtp.vtp_TaraFecha, GETDATE()) < 0 THEN 0
                    ELSE vtp.vtp_VigenciaDias - DATEDIFF(DAY, vtp.vtp_TaraFecha, GETDATE())
                END AS DiasRestantes,
                CASE 
                    WHEN DATEDIFF(DAY, vtp.vtp_TaraFecha, GETDATE()) <= vtp.vtp_VigenciaDias THEN CAST(1 AS BIT)
                    ELSE CAST(0 AS BIT)
                END AS TaraVigente,
                vtp.vtp_Estado AS Estado
            FROM dbo.VehiculoTarasProducto vtp
            INNER JOIN dbo.Productos p ON vtp.vtp_ProCodigo = p.pro_Codigo
            WHERE (@Placa IS NULL OR vtp.vtp_VehPlaca = @Placa)
            ORDER BY vtp.vtp_VehPlaca, p.pro_Nombre";

        using var c = _factory.CrearConexion();
        return await c.QueryAsync<VehiculoTaraProducto>(sql, new { Placa = placa });
    }

    public async Task<bool> GuardarTaraProductoAsync(string placa, int proCodigo, decimal taraKg, int vigenciaDias)
    {
        const string sql = @"
            IF EXISTS (SELECT 1 FROM dbo.VehiculoTarasProducto WHERE vtp_VehPlaca = @Placa AND vtp_ProCodigo = @ProCodigo)
            BEGIN
                UPDATE dbo.VehiculoTarasProducto
                SET vtp_TaraKg = @TaraKg, vtp_TaraFecha = GETDATE(), vtp_VigenciaDias = @VigenciaDias, vtp_Estado = 1
                WHERE vtp_VehPlaca = @Placa AND vtp_ProCodigo = @ProCodigo
            END
            ELSE
            BEGIN
                INSERT INTO dbo.VehiculoTarasProducto (vtp_VehPlaca, vtp_ProCodigo, vtp_TaraKg, vtp_TaraFecha, vtp_VigenciaDias, vtp_Estado)
                VALUES (@Placa, @ProCodigo, @TaraKg, GETDATE(), @VigenciaDias, 1)
            END";

        using var c = _factory.CrearConexion();
        var afectados = await c.ExecuteAsync(sql, new { Placa = placa, ProCodigo = proCodigo, TaraKg = taraKg, VigenciaDias = vigenciaDias });
        return afectados > 0;
    }
}
