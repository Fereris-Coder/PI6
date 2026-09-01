using BalanzasApi.Hubs;
using BalanzasApi.Models;
using Microsoft.AspNetCore.SignalR;

namespace BalanzasApi.Services;

/// <summary>
/// Crea y supervisa un BalanzaClient por cada balanza configurada, guarda la última
/// lectura de cada una y la retransmite a los clientes suscritos por SignalR.
/// </summary>
public class BalanzaConnectionManager : BackgroundService
{
    private readonly List<BalanzaOptions> _configuracion;
    private readonly IHubContext<PesajeHub> _hub;
    private readonly ILoggerFactory _loggerFactory;
    private readonly ILogger<BalanzaConnectionManager> _logger;

    private readonly Dictionary<int, EstadoConexion> _estados = new();
    private readonly Dictionary<int, PesajeReading> _ultimasLecturas = new();
    private readonly object _lock = new();

    public BalanzaConnectionManager(
        List<BalanzaOptions> configuracion,
        IHubContext<PesajeHub> hub,
        ILoggerFactory loggerFactory,
        ILogger<BalanzaConnectionManager> logger)
    {
        _configuracion = configuracion;
        _hub = hub;
        _loggerFactory = loggerFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var tareas = new List<Task>();

        foreach (var opciones in _configuracion)
        {
            lock (_lock)
            {
                _estados[opciones.Id] = EstadoConexion.Desconectada;
            }

            var cliente = new BalanzaClient(opciones, _loggerFactory.CreateLogger($"Balanza.{opciones.Id}"));

            cliente.CambioEstado += estado =>
            {
                lock (_lock)
                {
                    _estados[opciones.Id] = estado;
                }
            };

            cliente.NuevaLectura += lectura =>
            {
                lock (_lock)
                {
                    _ultimasLecturas[opciones.Id] = lectura;
                }

                _ = NotificarAsync(opciones.Id, lectura, stoppingToken);
            };

            tareas.Add(cliente.EjecutarAsync(stoppingToken));
        }

        await Task.WhenAll(tareas);
    }

    private async Task NotificarAsync(int balanzaId, PesajeReading lectura, CancellationToken cancellationToken)
    {
        try
        {
            await _hub.Clients.Group(balanzaId.ToString()).SendAsync("NuevaLectura", lectura, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo notificar la lectura de {BalanzaId} por SignalR", balanzaId);
        }
    }

    public IReadOnlyList<EstadoBalanza> ObtenerEstados()
    {
        lock (_lock)
        {
            return _configuracion
                .Select(o => new EstadoBalanza(
                    o.Id,
                    o.Nombre,
                    o.Ubicacion,
                    o.Ip,
                    o.Puerto,
                    _estados.GetValueOrDefault(o.Id, EstadoConexion.Desconectada),
                    _ultimasLecturas.GetValueOrDefault(o.Id)))
                .ToList();
        }
    }

    public PesajeReading? ObtenerUltimaLectura(int balanzaId)
    {
        lock (_lock)
        {
            return _ultimasLecturas.GetValueOrDefault(balanzaId);
        }
    }
}
