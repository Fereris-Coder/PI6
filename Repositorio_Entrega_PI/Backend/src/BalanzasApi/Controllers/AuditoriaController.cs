using BalanzasApi.Models;
using BalanzasApi.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BalanzasApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuditoriaController : ControllerBase
{
    private readonly IAuditoriaRepository _repo;
    public AuditoriaController(IAuditoriaRepository repo) => _repo = repo;

    [HttpGet]
    public async Task<IActionResult> Listar() => Ok(await _repo.ListarAsync());

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] Auditoria entidad)
    {
        var id = await _repo.CrearAsync(entidad);
        return CreatedAtAction(nameof(Listar), new { id }, new { id });
    }
}
