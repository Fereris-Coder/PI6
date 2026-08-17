using BalanzasApi.Data;
using BalanzasApi.Models;
using Dapper;

namespace BalanzasApi.Repositories;

public class PesajeRepository : IPesajeRepository
{
    private readonly IDbConnectionFactory _factory;

    public PesajeRepository(IDbConnectionFactory factory)
    {
        _factory = factory;
    }

    public async Task<int> GuardarAsync(GuardarPesajeRequest registro)
    {
        using var conexion = _factory.CrearConexion();

        // Si la placa no existe todavía en el catálogo (placa digitada libremente),
        // se crea un registro mínimo para poder cumplir la llave foránea.
        await conexion.ExecuteAsync(
            "IF NOT EXISTS (SELECT 1 FROM dbo.Vehiculos WHERE veh_Placa = @VehPlaca) INSERT INTO dbo.Vehiculos (veh_Placa, veh_Estado) VALUES (@VehPlaca, 1)",
            new { registro.VehPlaca });

        // La entrada siempre se pesa en vivo: el peso bruto es lo único que se conoce
        // en este momento. La tara y el neto se completan al marcar la salida (ver
        // IPesajeQueryRepository.MarcarSalidaAsync), donde se puede reutilizar la tara
        // guardada del vehículo o pesar en vivo.
        const string sql = """
            INSERT INTO dbo.Pesajes
                (pes_FechaHoraIn, pes_PesoBruto, pes_PesoTara, pes_PesoNeto, pes_NombreChofer,
                 pes_GuiaRemision, pes_Orden, pes_Observacion, pes_Estado,
                 pes_VehPlaca, pes_CliId, pes_ProCodigo, pes_BalId, pes_UsuIngId)
            OUTPUT INSERTED.pes_NumTran
            VALUES
                (SYSUTCDATETIME(), @PesoBruto, 0, @PesoBruto, @NombreChofer,
                 @GuiaRemision, @Orden, @Observacion, 1,
                 @VehPlaca, @CliId, @ProCodigo, @BalId, @UsuIngId);
            """;

        return await conexion.ExecuteScalarAsync<int>(sql, registro);
    }

    public async Task<int> GuardarDirectoAsync(GuardarPesajeDirectoRequest registro)
    {
        using var conexion = _factory.CrearConexion();

        var vehiculo = await conexion.QueryFirstOrDefaultAsync<VehiculoTaraInfo>(
            TaraVigenciaHelper.SqlSelectTara,
            new { registro.VehPlaca });

        if (!TaraVigenciaHelper.EsVigente(vehiculo))
            throw new InvalidOperationException("El vehículo no tiene una tara vigente registrada.");

        // Registro de un solo paso: el vehículo llegó vacío con tara ya conocida, así que
        // no hubo una entrada previa que pesar. Todo (datos del tercero y el único pesaje,
        // el bruto en vivo del camión ya cargado) se captura y se cierra en este mismo momento.
        const string sql = """
            INSERT INTO dbo.Pesajes
                (pes_FechaHoraIn, pes_FechaHoraOut, pes_DuracionMin, pes_PesoBruto, pes_PesoTara, pes_PesoNeto,
                 pes_TipoOperacion, pes_NombreChofer, pes_Observacion, pes_Estado,
                 pes_VehPlaca, pes_CliId, pes_ProCodigo, pes_BalId, pes_BalIdSalida, pes_UsuIngId, pes_UsuSalId)
            OUTPUT INSERTED.pes_NumTran
            VALUES
                (SYSUTCDATETIME(), SYSUTCDATETIME(), 0, @PesoBruto, @PesoTara, @PesoBruto - @PesoTara,
                 'Carga', @NombreChofer, @Observacion, 1,
                 @VehPlaca, @CliId, @ProCodigo, @BalId, @BalId, @UsuIngId, @UsuIngId);
            """;

        return await conexion.ExecuteScalarAsync<int>(sql, new
        {
            registro.PesoBruto,
            PesoTara = vehiculo!.TaraKg!.Value,
            registro.NombreChofer,
            registro.Observacion,
            registro.VehPlaca,
            registro.CliId,
            registro.ProCodigo,
            registro.BalId,
            registro.UsuIngId
        });
    }
}
