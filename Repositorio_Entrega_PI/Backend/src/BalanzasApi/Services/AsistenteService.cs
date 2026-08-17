using System.ComponentModel;
using System.Globalization;
using System.Text.Json;
using Anthropic;
using BalanzasApi.Models;
using BalanzasApi.Repositories;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Options;

namespace BalanzasApi.Services;

public class AsistenteService : IAsistenteService
{
    private const string SystemPrompt =
        "Eres el asistente del Sistema de Balanza Camionera. Respondes siempre en español, " +
        "de forma breve y concreta. Para cualquier pregunta sobre pesajes, producción, " +
        "clientes/proveedores/transportistas o básculas, usa SIEMPRE las herramientas " +
        "disponibles para obtener datos reales antes de responder; nunca inventes cifras. " +
        "Si una herramienta no devuelve datos para el período preguntado, dilo explícitamente. " +
        "Redondea los pesos a 2 decimales e indica que están en kilogramos (kg).";

    private readonly IPesajeQueryRepository _pesajeRepo;
    private readonly IClienteRepository _clienteRepo;
    private readonly IProductoRepository _productoRepo;
    private readonly IBalanzaCrudRepository _balanzaRepo;
    private readonly ClaudeApiOptions _opciones;

    public AsistenteService(
        IPesajeQueryRepository pesajeRepo,
        IClienteRepository clienteRepo,
        IProductoRepository productoRepo,
        IBalanzaCrudRepository balanzaRepo,
        IOptions<ClaudeApiOptions> opciones)
    {
        _pesajeRepo = pesajeRepo;
        _clienteRepo = clienteRepo;
        _productoRepo = productoRepo;
        _balanzaRepo = balanzaRepo;
        _opciones = opciones.Value;
    }

    public async Task<string> ConsultarAsync(string pregunta)
    {
        if (string.IsNullOrWhiteSpace(_opciones.ApiKey))
        {
            throw new InvalidOperationException(
                "No hay una API key de Claude configurada. Definela en ClaudeApi:ApiKey " +
                "(user-secrets o variable de entorno ANTHROPIC_API_KEY) y reinicia la API.");
        }

        var anthropicClient = new AnthropicClient { ApiKey = _opciones.ApiKey };

        IChatClient chatClient = anthropicClient
            .AsIChatClient(_opciones.Model)
            .AsBuilder()
            .UseFunctionInvocation()
            .Build();

        var opciones = new ChatOptions
        {
            Tools =
            [
                AIFunctionFactory.Create(BuscarPesajesAsync),
                AIFunctionFactory.Create(TopProductosAsync),
                AIFunctionFactory.Create(TopTercerosAsync),
                AIFunctionFactory.Create(ProduccionPorPeriodoAsync),
                AIFunctionFactory.Create(UtilizacionBasculasAsync),
            ],
        };

        var mensajes = new List<ChatMessage>
        {
            new(ChatRole.System, SystemPrompt),
            new(ChatRole.User, pregunta),
        };

        var respuesta = await chatClient.GetResponseAsync(mensajes, opciones);
        return respuesta.Text;
    }

    // ---------------------------------------------------------------------
    // Herramientas expuestas al modelo. Cada una consulta los repositorios
    // reales (no hay motor de reportes en el backend todavia: Top
    // productos/terceros, produccion por periodo y utilizacion de basculas
    // hoy solo existen como calculo en el frontend Angular), asi que
    // agregamos aqui mismo sobre los pesajes crudos.
    // ---------------------------------------------------------------------

    [Description("Busca pesajes registrados, opcionalmente filtrando por nombre de cliente/proveedor/transportista, nombre de producto o placa de vehiculo, dentro de un rango de fechas.")]
    private async Task<string> BuscarPesajesAsync(
        [Description("Nombre o parte del nombre del cliente, proveedor o transportista (opcional)")] string? cliente,
        [Description("Nombre o parte del nombre del producto (opcional)")] string? producto,
        [Description("Placa del vehiculo, exacta o parcial (opcional)")] string? placa,
        [Description("Fecha de inicio en formato AAAA-MM-DD. Si no se indica, se usan los ultimos 30 dias")] string? desde,
        [Description("Fecha de fin en formato AAAA-MM-DD. Si no se indica, se usa hoy")] string? hasta)
    {
        var (fDesde, fHasta) = ResolverRango(desde, hasta);
        var pesajes = await ObtenerPesajesEnriquecidosAsync(fDesde, fHasta);

        if (!string.IsNullOrWhiteSpace(cliente))
            pesajes = pesajes.Where(p => p.Cliente.Contains(cliente, StringComparison.OrdinalIgnoreCase)).ToList();
        if (!string.IsNullOrWhiteSpace(producto))
            pesajes = pesajes.Where(p => p.Producto.Contains(producto, StringComparison.OrdinalIgnoreCase)).ToList();
        if (!string.IsNullOrWhiteSpace(placa))
            pesajes = pesajes.Where(p => p.Placa.Contains(placa, StringComparison.OrdinalIgnoreCase)).ToList();

        var resultado = new
        {
            desde = fDesde.ToString("yyyy-MM-dd"),
            hasta = fHasta.ToString("yyyy-MM-dd"),
            totalPesajes = pesajes.Count,
            pesoNetoTotalKg = Math.Round(pesajes.Sum(p => p.PesoNeto), 2),
            pesajes = pesajes
                .OrderByDescending(p => p.FechaHoraIn)
                .Take(50)
                .Select(p => new
                {
                    p.NumTran,
                    fecha = p.FechaHoraIn.ToString("yyyy-MM-dd HH:mm"),
                    p.Cliente,
                    p.Producto,
                    p.Placa,
                    pesoNetoKg = Math.Round(p.PesoNeto, 2),
                    p.TipoOperacion,
                    estado = p.FechaHoraOut is null ? "En patio" : "Finalizado",
                }),
        };
        return JsonSerializer.Serialize(resultado);
    }

    [Description("Calcula los productos con mayor volumen de peso neto (kg) en un rango de fechas, de mayor a menor.")]
    private async Task<string> TopProductosAsync(
        [Description("Fecha de inicio en formato AAAA-MM-DD. Si no se indica, se usan los ultimos 30 dias")] string? desde,
        [Description("Fecha de fin en formato AAAA-MM-DD. Si no se indica, se usa hoy")] string? hasta,
        [Description("Cantidad de productos a devolver. Por defecto 5")] int? top)
    {
        var (fDesde, fHasta) = ResolverRango(desde, hasta);
        var pesajes = await ObtenerPesajesEnriquecidosAsync(fDesde, fHasta);

        var resultado = pesajes
            .GroupBy(p => p.Producto)
            .Select(g => new { producto = g.Key, pesajes = g.Count(), pesoNetoTotalKg = Math.Round(g.Sum(p => p.PesoNeto), 2) })
            .OrderByDescending(x => x.pesoNetoTotalKg)
            .Take(top is > 0 ? top.Value : 5)
            .ToList();

        return JsonSerializer.Serialize(new { desde = fDesde.ToString("yyyy-MM-dd"), hasta = fHasta.ToString("yyyy-MM-dd"), resultado });
    }

    [Description("Calcula los clientes, proveedores o transportistas con mayor volumen de peso neto (kg) en un rango de fechas, de mayor a menor.")]
    private async Task<string> TopTercerosAsync(
        [Description("Fecha de inicio en formato AAAA-MM-DD. Si no se indica, se usan los ultimos 30 dias")] string? desde,
        [Description("Fecha de fin en formato AAAA-MM-DD. Si no se indica, se usa hoy")] string? hasta,
        [Description("Filtrar solo por este tipo de tercero: Cliente, Proveedor o Transportista. Si no se indica, incluye todos")] string? tipo,
        [Description("Cantidad de terceros a devolver. Por defecto 5")] int? top)
    {
        var (fDesde, fHasta) = ResolverRango(desde, hasta);
        var pesajes = await ObtenerPesajesEnriquecidosAsync(fDesde, fHasta);

        if (!string.IsNullOrWhiteSpace(tipo))
            pesajes = pesajes.Where(p => string.Equals(p.TipoTercero, tipo, StringComparison.OrdinalIgnoreCase)).ToList();

        var resultado = pesajes
            .GroupBy(p => new { p.Cliente, p.TipoTercero })
            .Select(g => new { nombre = g.Key.Cliente, tipo = g.Key.TipoTercero, pesajes = g.Count(), pesoNetoTotalKg = Math.Round(g.Sum(p => p.PesoNeto), 2) })
            .OrderByDescending(x => x.pesoNetoTotalKg)
            .Take(top is > 0 ? top.Value : 5)
            .ToList();

        return JsonSerializer.Serialize(new { desde = fDesde.ToString("yyyy-MM-dd"), hasta = fHasta.ToString("yyyy-MM-dd"), resultado });
    }

    [Description("Calcula la produccion (peso neto en kg y cantidad de pesajes) agrupada por dia, semana o mes dentro de un rango de fechas.")]
    private async Task<string> ProduccionPorPeriodoAsync(
        [Description("Fecha de inicio en formato AAAA-MM-DD. Si no se indica, se usan los ultimos 30 dias")] string? desde,
        [Description("Fecha de fin en formato AAAA-MM-DD. Si no se indica, se usa hoy")] string? hasta,
        [Description("Agrupacion: dia, semana o mes. Por defecto dia")] string? agrupacion)
    {
        var (fDesde, fHasta) = ResolverRango(desde, hasta);
        var pesajes = await ObtenerPesajesEnriquecidosAsync(fDesde, fHasta);
        var agr = (agrupacion ?? "dia").Trim().ToLowerInvariant();

        Func<DateTime, string> claveFn = agr switch
        {
            "mes" => f => f.ToString("yyyy-MM"),
            "semana" => f => $"{ISOWeek.GetYear(f)}-W{ISOWeek.GetWeekOfYear(f):D2}",
            _ => f => f.ToString("yyyy-MM-dd"),
        };

        var resultado = pesajes
            .GroupBy(p => claveFn(p.FechaHoraIn))
            .Select(g => new { periodo = g.Key, pesajes = g.Count(), pesoNetoTotalKg = Math.Round(g.Sum(p => p.PesoNeto), 2) })
            .OrderBy(x => x.periodo)
            .ToList();

        return JsonSerializer.Serialize(new { agrupacion = agr, resultado });
    }

    [Description("Calcula cuantos pesajes proceso cada bascula en un rango de fechas, para ver la utilizacion o carga de trabajo de cada una.")]
    private async Task<string> UtilizacionBasculasAsync(
        [Description("Fecha de inicio en formato AAAA-MM-DD. Si no se indica, se usan los ultimos 30 dias")] string? desde,
        [Description("Fecha de fin en formato AAAA-MM-DD. Si no se indica, se usa hoy")] string? hasta)
    {
        var (fDesde, fHasta) = ResolverRango(desde, hasta);
        var pesajes = (await _pesajeRepo.ListarAsync(fDesde, fHasta)).ToList();
        var basculas = (await _balanzaRepo.ListarAsync()).ToDictionary(b => b.Id, b => b.Descripcion);

        var total = pesajes.Count;
        var resultado = pesajes
            .GroupBy(p => p.BalId)
            .Select(g => new
            {
                bascula = basculas.TryGetValue(g.Key, out var nombre) ? nombre : $"Bascula #{g.Key}",
                pesajes = g.Count(),
                porcentaje = total == 0 ? 0 : Math.Round(g.Count() * 100.0 / total, 1),
            })
            .OrderByDescending(x => x.pesajes)
            .ToList();

        return JsonSerializer.Serialize(new { desde = fDesde.ToString("yyyy-MM-dd"), hasta = fHasta.ToString("yyyy-MM-dd"), totalPesajes = total, resultado });
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private static (DateTime desde, DateTime hasta) ResolverRango(string? desde, string? hasta)
    {
        var fHasta = DateTime.TryParse(hasta, CultureInfo.InvariantCulture, DateTimeStyles.None, out var h) ? h.Date : DateTime.Today;
        var fDesde = DateTime.TryParse(desde, CultureInfo.InvariantCulture, DateTimeStyles.None, out var d) ? d.Date : fHasta.AddDays(-30);
        return (fDesde, fHasta);
    }

    private async Task<List<PesajeEnriquecido>> ObtenerPesajesEnriquecidosAsync(DateTime desde, DateTime hasta)
    {
        var pesajes = (await _pesajeRepo.ListarAsync(desde, hasta)).ToList();
        var clientes = (await _clienteRepo.ListarAsync()).ToDictionary(c => c.Id);
        var productos = (await _productoRepo.ListarAsync()).ToDictionary(p => p.Codigo);

        return pesajes.Select(p => new PesajeEnriquecido
        {
            NumTran = p.NumTran,
            FechaHoraIn = p.FechaHoraIn,
            FechaHoraOut = p.FechaHoraOut,
            PesoNeto = p.PesoNeto,
            TipoOperacion = p.TipoOperacion,
            Placa = p.VehPlaca,
            Cliente = clientes.TryGetValue(p.CliId, out var cliente) ? cliente.Nombre : "Desconocido",
            TipoTercero = clientes.TryGetValue(p.CliId, out var clienteTipo) ? clienteTipo.Tipo : "Cliente",
            Producto = productos.TryGetValue(p.ProCodigo, out var prod) ? prod.Nombre : "Desconocido",
        }).ToList();
    }

    private sealed class PesajeEnriquecido
    {
        public int NumTran { get; set; }
        public DateTime FechaHoraIn { get; set; }
        public DateTime? FechaHoraOut { get; set; }
        public decimal PesoNeto { get; set; }
        public string TipoOperacion { get; set; } = string.Empty;
        public string Placa { get; set; } = string.Empty;
        public string Cliente { get; set; } = string.Empty;
        public string TipoTercero { get; set; } = string.Empty;
        public string Producto { get; set; } = string.Empty;
    }
}
