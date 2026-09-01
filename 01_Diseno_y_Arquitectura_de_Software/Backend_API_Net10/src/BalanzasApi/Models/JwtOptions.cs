namespace BalanzasApi.Models;

public class JwtOptions
{
    public string Key { get; set; } = null!;
    public string Issuer { get; set; } = "BalanzasApi";
    public string Audience { get; set; } = "BalanzasClient";
    public int ExpireMinutes { get; set; } = 60;
}
