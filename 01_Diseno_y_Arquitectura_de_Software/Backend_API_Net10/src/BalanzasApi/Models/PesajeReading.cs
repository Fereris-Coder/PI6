namespace BalanzasApi.Models;

public record PesajeReading(
    int BalanzaId,
    decimal Peso,
    decimal Tara,
    string Unidad,
    bool EsNeto,
    bool EsNegativo,
    bool FueraDeRango,
    bool EnMovimiento,
    bool CeroNoCapturado,
    bool? ChecksumValido,
    DateTime FechaHoraUtc);
