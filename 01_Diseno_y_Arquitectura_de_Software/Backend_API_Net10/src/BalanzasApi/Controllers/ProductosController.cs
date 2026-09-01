using BalanzasApi.Models;
using BalanzasApi.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BalanzasApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductosController : ControllerBase
{
    private readonly IProductoRepository _repo;
    public ProductosController(IProductoRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<IActionResult> Listar() => Ok(await _repo.ListarAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Obtener(int id)
    {
        var entidad = await _repo.ObtenerAsync(id);
        return entidad is null ? NotFound() : Ok(entidad);
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] Producto entidad)
    {
        var id = await _repo.CrearAsync(entidad);
        return CreatedAtAction(nameof(Obtener), new { id }, new { id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] Producto entidad)
    {
        entidad.Codigo = id;
        return await _repo.ActualizarAsync(entidad) ? NoContent() : NotFound();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id) => await _repo.EliminarAsync(id) ? NoContent() : NotFound();
}
