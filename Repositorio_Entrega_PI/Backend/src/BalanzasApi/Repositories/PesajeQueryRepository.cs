using BalanzasApi.Data;
using BalanzasApi.Models;
using Dapper;

namespace BalanzasApi.Repositories;

public class PesajeQueryRepository : IPesajeQueryRepository
{
    private readonly IDbConnectionFactory _factory;
    public PesajeQueryRepository(IDbConnectionFactory factory) => _factory = factory;

    private const string ColumnasSelect = @"
        pes_NumTran AS NumTran, pes_FechaHoraIn AS FechaHoraIn, pes_FechaHoraOut AS FechaHoraOut,
        pes_DuracionMin AS DuracionMin, pes_PesoBruto AS PesoBruto, pes_PesoTara AS PesoTara,
        pes_PesoNeto AS PesoNeto, pes_PesoOrigen AS PesoOrigen, pes_MermaKg AS MermaKg,
        pes_MermaPct AS MermaPct, pes_NumBins AS NumBins, pes_NumGavetas AS NumGavetas,
        pes_LoteTraza AS LoteTraza, pes_GuiaRemision AS GuiaRemision, pes_Orden AS Orden,
        pes_Observacion AS Observacion, pes_NombreChofer AS NombreChofer,
        pes_SelloDigitalHash AS SelloDigitalHash, pes_EstadoViaje AS EstadoViaje,
        pes_Estado AS Estado, pes_VehPlaca AS VehPlaca, pes_CliId AS CliId,
        pes_ProCodigo AS ProCodigo, pes_BalId AS BalId, pes_BalIdSalida AS BalIdSalida,
        pes_UsuIngId AS UsuIngId, pes_UsuSalId AS UsuSalId, pes_TipoOperacion AS TipoOperacion";

    public async Task<IEnumerable<Pesaje>> ListarAsync(DateTime? fechaDesde = null, DateTime? fechaHasta = null)
    {
        var sql = $"SELECT {ColumnasSelect} FROM dbo.Pesajes WHERE 1=1";
        var parameters = new DynamicParameters();
        if (fechaDesde.HasValue)
        {
            sql += " AND CAST(pes_FechaHoraIn AS DATE) >= @Desde";
            parameters.Add("Desde", fechaDesde.Value.Date);
        }
        if (fechaHasta.HasValue)
        {
            sql += " AND CAST(pes_FechaHoraIn AS DATE) <= @Hasta";
            parameters.Add("Hasta", fechaHasta.Value.Date);
        }
        using var c = _factory.CrearConexion();
        return await c.QueryAsync<Pesaje>(sql, parameters);
    }

    public async Task<Pesaje?> ObtenerAsync(int numTran)
    {
        var sql = $"SELECT {ColumnasSelect} FROM dbo.Pesajes WHERE pes_NumTran = @NumTran";
        using var c = _factory.CrearConexion();
        return await c.QueryFirstOrDefaultAsync<Pesaje>(sql, new { NumTran = numTran });
    }

    public async Task<bool> MarcarSalidaAsync(int numTran, DateTime fechaOut, decimal? pesoMedido, bool usarTaraGuardada, int? usuSalId, int? balIdSalida)
    {
        using var c = _factory.CrearConexion();

        decimal pesoTaraFinal;
        string tipoOperacionFinal;

        if (usarTaraGuardada)
        {
            var vehPlaca = await c.ExecuteScalarAsync<string?>(
                "SELECT pes_VehPlaca FROM dbo.Pesajes WHERE pes_NumTran = @NumTran",
                new { NumTran = numTran });
            if (vehPlaca is null) return false;

            var vehiculo = await c.QueryFirstOrDefaultAsync<VehiculoTaraInfo>(
                TaraVigenciaHelper.SqlSelectTara,
                new { VehPlaca = vehPlaca });

            if (!TaraVigenciaHelper.EsVigente(vehiculo))
                throw new InvalidOperationException("El vehículo no tiene una tara vigente registrada.");

            pesoTaraFinal = vehiculo!.TaraKg!.Value;
            tipoOperacionFinal = "Carga";
        }
        else
        {
            if (pesoMedido is null)
                throw new InvalidOperationException("Debe indicar el peso medido en la báscula.");

            pesoTaraFinal = pesoMedido.Value;
            tipoOperacionFinal = "Descarga";
        }

        const string sql = @"
            UPDATE dbo.Pesajes SET
                pes_FechaHoraOut = @FechaOut,
                pes_PesoTara = @PesoTara,
                pes_PesoNeto = pes_PesoBruto - @PesoTara,
                pes_TipoOperacion = @TipoOperacion,
                pes_DuracionMin = DATEDIFF(MINUTE, pes_FechaHoraIn, @FechaOut),
                pes_UsuSalId = @UsuSalId,
                pes_BalIdSalida = @BalIdSalida
            WHERE pes_NumTran = @NumTran";

        var afectados = await c.ExecuteAsync(sql, new
        {
            FechaOut = fechaOut,
            PesoTara = pesoTaraFinal,
            TipoOperacion = tipoOperacionFinal,
            UsuSalId = usuSalId,
            BalIdSalida = balIdSalida,
            NumTran = numTran
        });
        return afectados > 0;
    }

    public async Task<IEnumerable<dynamic>> ResumenHoyAsync()
    {
        const string sql = @"SELECT p.pes_NumTran, p.pes_FechaHoraIn, v.veh_Placa, p.pes_NombreChofer,
            c.cli_Nombre, c.cli_Tipo, pr.pro_Nombre, pr.pro_TipoFlujo, p.pes_PesoNeto,
            p.pes_MermaPct, p.pes_TipoOperacion, p.pes_EstadoViaje
            FROM dbo.Pesajes p
            INNER JOIN dbo.Vehiculos v ON p.pes_VehPlaca = v.veh_Placa
            INNER JOIN dbo.Clientes c ON p.pes_CliId = c.cli_Id
            INNER JOIN dbo.Productos pr ON p.pes_ProCodigo = pr.pro_Codigo
            WHERE CAST(p.pes_FechaHoraIn AS DATE) = CAST(GETDATE() AS DATE) AND p.pes_Estado = 1";
        using var c = _factory.CrearConexion();
        return await c.QueryAsync(sql);
    }
}
