using BalanzasApi.Models;
using BalanzasApi.Repositories;
using BalanzasApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BalanzasApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BalanzasController : ControllerBase
{
    private readonly IBalanzaCrudRepository _repo;
    private readonly BalanzaConnectionManager _conexiones;

    public BalanzasController(IBalanzaCrudRepository repo, BalanzaConnectionManager conexiones)
    {
        _repo = repo;
        _conexiones = conexiones;
    }

    [HttpGet("{id:int}/peso")]
    public IActionResult ObtenerPeso(int id)
    {
        var lectura = _conexiones.ObtenerUltimaLectura(id);
        return lectura is not null ? Ok(lectura) : NotFound();
    }

    [HttpGet("estado")]
    public IActionResult ObtenerEstado() => Ok(_conexiones.ObtenerEstados());

    [HttpGet]
    public async Task<IActionResult> Listar() => Ok(await _repo.ListarAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Obtener(int id)
    {
        var entidad = await _repo.ObtenerAsync(id);
        return entidad is null ? NotFound() : Ok(entidad);
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] Balanza entidad)
    {
        var id = await _repo.CrearAsync(entidad);
        return CreatedAtAction(nameof(Obtener), new { id }, new { id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] Balanza entidad)
    {
        entidad.Id = id;
        return await _repo.ActualizarAsync(entidad) ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id) => await _repo.EliminarAsync(id) ? NoContent() : NotFound();
}
