using System.Data;
using Microsoft.Data.SqlClient;

namespace BalanzasApi.Data;

public class SqlConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public SqlConnectionFactory(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Falta la cadena de conexión 'Default' en appsettings.json");
    }

    public IDbConnection CrearConexion() => new SqlConnection(_connectionString);
}
