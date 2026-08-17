namespace BalanzasApi.Models;

public enum EstadoConexion
{
    Desconectada,
    Conectando,
    Conectada
}

public record EstadoBalanza(
    int Id,
    string Nombre,
    string? Ubicacion,
    string Ip,
    int Puerto,
    EstadoConexion Estado,
    PesajeReading? UltimaLectura);
