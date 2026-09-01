using System.Text;
using BalanzasApi.Data;
using BalanzasApi.Hubs;
using BalanzasApi.Models;
using BalanzasApi.Repositories;
using BalanzasApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Permite instalar y correr esta API como Servicio de Windows cuando se publica
// self-contained (para el instalador); no afecta correrla con "dotnet run" en desarrollo.
builder.Host.UseWindowsService();

builder.Services.AddOpenApi();
builder.Services.AddSignalR();
builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var origenes = builder.Configuration.GetSection("OrigenesPermitidos").Get<string[]>() ?? [];
        policy.WithOrigins(origenes)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddSingleton<IDbConnectionFactory, SqlConnectionFactory>();
builder.Services.AddScoped<IPesajeRepository, PesajeRepository>();
builder.Services.AddScoped<IBalanzaRepository, BalanzaRepository>();
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<IProductoRepository, ProductoRepository>();
builder.Services.AddScoped<IVehiculoRepository, VehiculoRepository>();
builder.Services.AddScoped<IRolRepository, RolRepository>();
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<IBalanzaCrudRepository, BalanzaCrudRepository>();
builder.Services.AddScoped<IPesajeQueryRepository, PesajeQueryRepository>();
builder.Services.AddScoped<IConfiguracionRepository, ConfiguracionRepository>();
builder.Services.AddScoped<IInformeRepository, InformeRepository>();
builder.Services.AddScoped<IAuditoriaRepository, AuditoriaRepository>();

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<JwtService>();

builder.Services.Configure<ClaudeApiOptions>(builder.Configuration.GetSection("ClaudeApi"));
builder.Services.AddScoped<IAsistenteService, AsistenteService>();

var jwtKey = builder.Configuration["Jwt:Key"] ?? string.Empty;
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// El catálogo de balanzas activas se lee de dbo.Balanzas (bal_Estado = 1) una sola vez al
// arrancar, antes de construir el host, para poder registrarlo como singleton inyectable.
List<BalanzaOptions> balanzas;
{
    var factoriaBootstrap = new SqlConnectionFactory(builder.Configuration);
    var repositorioBootstrap = new BalanzaRepository(factoriaBootstrap);
    balanzas = await repositorioBootstrap.ObtenerActivasAsync();
}
builder.Services.AddSingleton(balanzas);

builder.Services.AddSingleton<BalanzaConnectionManager>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<BalanzaConnectionManager>());

var app = builder.Build();

// IMPORTANTE: todo el middleware (Use...) debe ir antes que cualquier endpoint (Map...).
// Si un Map... queda antes de UseStaticFiles, ASP.NET Core inserta el enrutamiento
// implícito en ese punto y el archivo estático nunca llega a servirse (siempre cae
// al fallback). Por eso aquí primero van todos los Use... y al final todos los Map....

app.UseCors("Frontend");

// Sin HTTPS redirection: es un sistema de LAN local (báscula/planta), y forzar el
// redirect a https rompe el preflight CORS del front (los navegadores no reintentan
// el preflight tras una redirección), causando bloqueos falsos como "No 'Access-Control-Allow-Origin'".

// El build de Angular (ng build) se copia a wwwroot/ al empaquetar el instalador:
// este mismo proceso sirve la API y la SPA en un solo puerto/servicio.
// Se usa un PhysicalFileProvider explícito (en vez de dejar que ASP.NET Core arme el
// suyo con el sistema de "static web assets") porque ese sistema resuelve los archivos
// contra un manifiesto generado en tiempo de compilación de ESTE proyecto .NET, y no
// se entera de los archivos que copiamos después desde el build de Angular.
var wwwrootProvider = new PhysicalFileProvider(Path.Combine(app.Environment.ContentRootPath, "wwwroot"));
app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = wwwrootProvider });
app.UseStaticFiles(new StaticFileOptions { FileProvider = wwwrootProvider });

// Fallback del SPA como middleware plano (no como endpoint vía MapFallbackToFile):
// probamos MapFallbackToFile y, con él presente, ASP.NET Core dejaba de servir los
// archivos estáticos reales (siempre devolvía index.html, incluso para main.js,
// favicon.ico, etc.). Este middleware corre después de UseStaticFiles, así que un
// archivo real ya fue servido y esto nunca se ejecuta para esos casos; solo entra en
// juego para rutas de cliente de Angular (/pesajes, /tickets/5, etc.) que no son /api ni /hubs.
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? string.Empty;
    if (!path.StartsWith("/api", StringComparison.OrdinalIgnoreCase) &&
        !path.StartsWith("/hubs", StringComparison.OrdinalIgnoreCase))
    {
        var indexFile = wwwrootProvider.GetFileInfo("index.html");
        if (indexFile.Exists)
        {
            context.Response.ContentType = "text/html";
            await context.Response.SendFileAsync(indexFile);
            return;
        }
    }

    await next();
});

app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapHub<PesajeHub>("/hubs/pesaje");

app.MapControllers();

// Auth (login) - se mantiene como minimal API
app.MapPost("/api/auth/login", async (AuthRequest req, IUsuarioRepository usuarios, JwtService jwt) =>
{
    var usuario = await usuarios.ObtenerPorNombreAsync(req.NombreUsuario);
    if (usuario is null) return Results.Unauthorized();
    // Nota: comparación simple; en producción use hashing seguro
    if (usuario.PasswordHash != req.Password) return Results.Unauthorized();
    var token = jwt.GenerarToken(usuario.Id, usuario.NombreUsuario, usuario.RolId);
    return Results.Ok(new { token });
}).WithName("Login");

app.Run();
