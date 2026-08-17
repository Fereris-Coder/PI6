namespace BalanzasApi.Models;

public class Producto
{
    public int Codigo { get; set; }
    public string Nombre { get; set; } = null!;
    public decimal? PrecioBase { get; set; }
    public decimal? PesoPorSaco { get; set; }
    public string TipoFlujo { get; set; } = "Proveedor"; // "Proveedor" (Compra/Entrada) o "Cliente" (Despacho/Salida)
    public decimal ToleranciaMermaPct { get; set; } = 3.50m;
    public bool Estado { get; set; } = true;
}
