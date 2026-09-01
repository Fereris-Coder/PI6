using Microsoft.AspNetCore.SignalR;

namespace BalanzasApi.Hubs;

/// <summary>
/// El front se suscribe a una balanza y recibe el evento "NuevaLectura" en vivo
/// mientras permanezca conectado, hasta que decida confirmar el guardado (POST /api/pesajes).
/// </summary>
public class PesajeHub : Hub
{
    public async Task Suscribirse(int balanzaId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, balanzaId.ToString());
    }

    public async Task Desuscribirse(int balanzaId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, balanzaId.ToString());
    }
}
