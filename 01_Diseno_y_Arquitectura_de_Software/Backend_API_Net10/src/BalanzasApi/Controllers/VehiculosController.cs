using BalanzasApi.Models;
using BalanzasApi.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BalanzasApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VehiculosController : ControllerBase
{
    private readonly IVehiculoRepository _repo;
    public VehiculosController(IVehiculoRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<IActionResult> Listar() => Ok(await _repo.ListarAsync());

    [HttpGet("{placa}")]
    public async Task<IActionResult> Obtener(string placa)
    {
        var entidad = await _repo.ObtenerAsync(placa);
        return entidad is null ? NotFound() : Ok(entidad);
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] Vehiculo entidad)
    {
        var ok = await _repo.CrearAsync(entidad);
        return ok ? CreatedAtAction(nameof(Obtener), new { placa = entidad.Placa }, entidad) : BadRequest();
    }

    [HttpPut("{placa}")]
    public async Task<IActionResult> Actualizar(string placa, [FromBody] Vehiculo entidad)
    {
        entidad.Placa = placa;
        return await _repo.ActualizarAsync(entidad) ? NoContent() : NotFound();
    }

    [HttpDelete("{placa}")]
    public async Task<IActionResult> Eliminar(string placa) => await _repo.EliminarAsync(placa) ? NoContent() : NotFound();

    [HttpPut("{placa}/tara")]
    public async Task<IActionResult> ActualizarTara(string placa, [FromBody] ActualizarTaraRequest request)
    {
        if (request.TaraKg <= 0)
            return BadRequest(new { message = "La tara debe ser un peso mayor a cero." });

        var ok = await _repo.ActualizarTaraAsync(placa, request.TaraKg, request.VigenciaDias);
        return ok ? NoContent() : NotFound();
    }

    [HttpGet("{placa}/taras-producto")]
    public async Task<IActionResult> ListarTarasPorProducto(string placa)
    {
        var taras = await _repo.ListarTarasPorProductoAsync(placa);
        return Ok(taras);
    }

    [HttpPost("{placa}/taras-producto")]
    public async Task<IActionResult> GuardarTaraProducto(string placa, [FromBody] GuardarTaraProductoRequest request)
    {
        if (request.TaraKg <= 0)
            return BadRequest(new { message = "La tara debe ser mayor a 0 kg." });

        var ok = await _repo.GuardarTaraProductoAsync(placa, request.ProCodigo, request.TaraKg, request.VigenciaDias > 0 ? request.VigenciaDias : 30);
        return ok ? Ok(new { message = "Tara por producto guardada exitosamente." }) : BadRequest();
    }
}

public record ActualizarTaraRequest(decimal TaraKg, int? VigenciaDias);
public record GuardarTaraProductoRequest(int ProCodigo, decimal TaraKg, int VigenciaDias);
