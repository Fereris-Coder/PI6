using System.Data;

namespace BalanzasApi.Data;

public interface IDbConnectionFactory
{
    IDbConnection CrearConexion();
}
