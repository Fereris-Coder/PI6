using System.Globalization;
using System.Text;
using BalanzasApi.Models;

namespace BalanzasApi.Protocolo;

/// <summary>
/// Interpreta el formato de salida continua estándar del IND570 (Tabla D-6 del manual técnico,
/// 17 u 18 bytes: STX + SWA + SWB + SWC + peso(6) + tara(6) + CR + CHK opcional).
/// Una instancia por conexión: acumula bytes entre llamadas porque TCP no respeta los límites de trama.
/// </summary>
public class TramaContinuaParser
{
    private const byte Stx = 0x02;
    private const byte Cr = 0x0D;
    private const int LongitudTrama = 17;

    private readonly List<byte> _buffer = new();

    public IEnumerable<PesajeReading> AgregarDatos(byte[] datos, int longitud, int balanzaId, bool usaChecksum)
    {
        for (int i = 0; i < longitud; i++)
        {
            _buffer.Add(datos[i]);
        }

        var lecturas = new List<PesajeReading>();

        while (true)
        {
            int inicio = _buffer.IndexOf(Stx);
            if (inicio < 0)
            {
                _buffer.Clear();
                break;
            }

            if (inicio > 0)
            {
                _buffer.RemoveRange(0, inicio);
            }

            int longitudNecesaria = usaChecksum ? LongitudTrama + 1 : LongitudTrama;
            if (_buffer.Count < longitudNecesaria)
            {
                break;
            }

            if (_buffer[LongitudTrama - 1] != Cr)
            {
                // No cayó CR donde debía: la trama está corrupta o desincronizada.
                // Descartamos el STX actual y reintentamos buscar el siguiente.
                _buffer.RemoveAt(0);
                continue;
            }

            var trama = _buffer.GetRange(0, longitudNecesaria).ToArray();
            _buffer.RemoveRange(0, longitudNecesaria);

            var lectura = Interpretar(trama, balanzaId, usaChecksum);
            if (lectura is not null)
            {
                lecturas.Add(lectura);
            }
        }

        return lecturas;
    }

    private static PesajeReading? Interpretar(byte[] trama, int balanzaId, bool usaChecksum)
    {
        byte swa = trama[1];
        byte swb = trama[2];
        byte swc = trama[3];

        // Tabla D-7: bits 2,1,0 de SWA ubican el punto decimal (-2..5 dígitos).
        int decimales = (swa & 0x07) - 2;
        decimal divisor = (decimal)Math.Pow(10, decimales);

        string pesoTexto = Encoding.ASCII.GetString(trama, 4, 6);
        string taraTexto = Encoding.ASCII.GetString(trama, 10, 6);

        if (!decimal.TryParse(pesoTexto, NumberStyles.Integer, CultureInfo.InvariantCulture, out var pesoCrudo) ||
            !decimal.TryParse(taraTexto, NumberStyles.Integer, CultureInfo.InvariantCulture, out var taraCrudo))
        {
            return null;
        }

        decimal peso = pesoCrudo / divisor;
        decimal tara = taraCrudo / divisor;

        // Tabla D-8: bits de SWB.
        bool esNeto = (swb & 0x01) != 0;
        bool esNegativo = (swb & 0x02) != 0;
        bool fueraDeRango = (swb & 0x04) != 0;
        bool enMovimiento = (swb & 0x08) != 0;
        bool esKg = (swb & 0x10) != 0;
        bool ceroNoCapturado = (swb & 0x40) != 0;

        // Tabla D-9: bits 2,1,0 de SWC indican la unidad (lb/kg se resuelve con el bit 4 de SWB).
        string unidad = (swc & 0x07) switch
        {
            0 => esKg ? "kg" : "lb",
            1 => "g",
            2 => "t",
            3 => "oz",
            4 => "ozt",
            5 => "dwt",
            6 => "ton",
            _ => "personalizada"
        };

        if (esNegativo)
        {
            peso = -peso;
        }

        bool? checksumValido = null;
        if (usaChecksum)
        {
            byte suma = 0;
            for (int i = 0; i < LongitudTrama; i++)
            {
                suma += trama[i];
            }

            byte esperado = (byte)((~suma + 1) & 0x7F);
            checksumValido = esperado == trama[LongitudTrama];
        }

        return new PesajeReading(
            balanzaId, peso, tara, unidad, esNeto, esNegativo, fueraDeRango,
            enMovimiento, ceroNoCapturado, checksumValido, DateTime.UtcNow);
    }
}
