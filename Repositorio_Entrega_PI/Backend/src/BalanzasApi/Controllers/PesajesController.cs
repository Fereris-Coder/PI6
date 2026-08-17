using BalanzasApi.Models;
using BalanzasApi.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BalanzasApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PesajesController : ControllerBase
{
    private readonly IPesajeRepository _writeRepo;
    private readonly IPesajeQueryRepository _queryRepo;

    public PesajesController(IPesajeRepository writeRepo, IPesajeQueryRepository queryRepo)
    {
        _writeRepo = writeRepo;
        _queryRepo = queryRepo;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] DateTime? desde, [FromQuery] DateTime? hasta)
        => Ok(await _queryRepo.ListarAsync(desde, hasta));

    [HttpGet("{numTran:int}")]
    public async Task<IActionResult> Obtener(int numTran)
    {
        var entidad = await _queryRepo.ObtenerAsync(numTran);
        return entidad is null ? NotFound() : Ok(entidad);
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] GuardarPesajeRequest request)
    {
        var id = await _writeRepo.GuardarAsync(request);
        return CreatedAtAction(nameof(Obtener), new { numTran = id }, new { id });
    }

    [HttpPost("directo")]
    public async Task<IActionResult> CrearDirecto([FromBody] GuardarPesajeDirectoRequest request)
    {
        try
        {
            var id = await _writeRepo.GuardarDirectoAsync(request);
            return CreatedAtAction(nameof(Obtener), new { numTran = id }, new { id });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{numTran:int}/salida")]
    public async Task<IActionResult> MarcarSalida(int numTran, [FromBody] PesajeSalidaRequest body)
    {
        try
        {
            var ok = await _queryRepo.MarcarSalidaAsync(numTran, body.FechaHoraOut, body.PesoMedido, body.UsarTaraGuardada, body.UsuSalId, body.BalIdSalida);
            return ok ? NoContent() : NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("resumen/hoy")]
    public async Task<IActionResult> ResumenHoy() => Ok(await _queryRepo.ResumenHoyAsync());
}

public record PesajeSalidaRequest(DateTime FechaHoraOut, decimal? PesoMedido, bool UsarTaraGuardada, int? UsuSalId, int? BalIdSalida);
