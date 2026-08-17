namespace BalanzasApi.Services;

public interface IAsistenteService
{
    Task<string> ConsultarAsync(string pregunta);
}
