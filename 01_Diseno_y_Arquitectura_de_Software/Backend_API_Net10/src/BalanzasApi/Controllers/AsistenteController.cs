using Anthropic.Exceptions;
using BalanzasApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BalanzasApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AsistenteController : ControllerBase
{
    private readonly IAsistenteService _servicio;
    public AsistenteController(IAsistenteService servicio) => _servicio = servicio;

    [HttpPost("consulta")]
    public async Task<IActionResult> Consultar([FromBody] ConsultaRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Pregunta))
        {
            return BadRequest(new { message = "La pregunta no puede estar vacía." });
        }

        try
        {
            var respuesta = await _servicio.ConsultarAsync(request.Pregunta);
            return Ok(new { respuesta });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (AnthropicApiException ex)
        {
            return BadRequest(new
            {
                message = "No se pudo completar la consulta con Claude. Revisa el crédito/facturación de la cuenta en console.anthropic.com (Plans & Billing). Detalle: " + ex.Message
            });
        }
    }

    public record ConsultaRequest(string Pregunta);
}
