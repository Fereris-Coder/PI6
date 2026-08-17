using System.Net.Sockets;
using BalanzasApi.Models;
using BalanzasApi.Protocolo;

namespace BalanzasApi.Services;

/// <summary>
/// Mantiene una conexión TCP persistente contra una balanza y reconecta automáticamente
/// si el enlace se cae. La balanza empuja tramas sin que el cliente las solicite (salida continua),
/// así que este cliente solo necesita quedarse leyendo el stream.
/// </summary>
public class BalanzaClient
{
    private static readonly TimeSpan BackoffInicial = TimeSpan.FromSeconds(2);
    private static readonly TimeSpan BackoffMaximo = TimeSpan.FromSeconds(30);

    private readonly BalanzaOptions _opciones;
    private readonly ILogger _logger;
    private readonly TramaContinuaParser _parser = new();

    public event Action<PesajeReading>? NuevaLectura;
    public event Action<EstadoConexion>? CambioEstado;

    public BalanzaClient(BalanzaOptions opciones, ILogger logger)
    {
        _opciones = opciones;
        _logger = logger;
    }

    public async Task EjecutarAsync(CancellationToken cancellationToken)
    {
        var backoff = BackoffInicial;

        while (!cancellationToken.IsCancellationRequested)
        {
            CambioEstado?.Invoke(EstadoConexion.Conectando);

            try
            {
                using var cliente = new TcpClient();
                await cliente.ConnectAsync(_opciones.Ip, _opciones.Puerto, cancellationToken);

                _logger.LogInformation(
                    "Balanza {Id} conectada en {Ip}:{Puerto}", _opciones.Id, _opciones.Ip, _opciones.Puerto);
                CambioEstado?.Invoke(EstadoConexion.Conectada);
                backoff = BackoffInicial;

                await using var stream = cliente.GetStream();
                var buffer = new byte[1024];

                while (!cancellationToken.IsCancellationRequested)
                {
                    int leidos = await stream.ReadAsync(buffer, cancellationToken);
                    if (leidos == 0)
                    {
                        _logger.LogWarning("Balanza {Id} cerró la conexión", _opciones.Id);
                        break;
                    }

                    foreach (var lectura in _parser.AgregarDatos(buffer, leidos, _opciones.Id, _opciones.UsaChecksum))
                    {
                        NuevaLectura?.Invoke(lectura);
                    }
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex, "Error de conexión con balanza {Id} ({Ip}:{Puerto})", _opciones.Id, _opciones.Ip, _opciones.Puerto);
            }

            CambioEstado?.Invoke(EstadoConexion.Desconectada);

            try
            {
                await Task.Delay(backoff, cancellationToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            backoff = TimeSpan.FromSeconds(Math.Min(backoff.TotalSeconds * 2, BackoffMaximo.TotalSeconds));
        }
    }
}
