; ==============================================================================
; Instalador de Balanza Camionera (Inno Setup 6)
; https://jrsoftware.org/isinfo.php
;
; CÓMO COMPILAR:
;   1. Instala Inno Setup 6 (o "winget install JRSoftware.InnoSetup").
;   2. Publica el backend (desde Backend/src/BalanzasApi):
;        dotnet publish -c Release -r win-x64 --self-contained true -o publish
;      Asegúrate de que wwwroot/ (el build de Angular) ya esté copiado dentro de
;      BalanzasApi/wwwroot ANTES de publicar, para que el publish lo incluya.
;   3. Abre este archivo en Inno Setup y presiona "Compile" (o corre
;      "ISCC.exe BalanzaCamionera.iss" desde la línea de comandos).
;   4. El instalador queda en Installer/output/BalanzaCamionera-Setup-<version>.exe
;
; QUÉ HACE EL INSTALADOR:
;   - Copia el backend publicado (self-contained: no requiere .NET instalado) a
;     Archivos de Programa\Balanza Camionera.
;   - Pregunta los datos de conexión a SQL Server (servidor, base, usuario, clave).
;   - Corre sql/schema.sql con sqlcmd para crear la base y las tablas si no existen
;     (requiere que sqlcmd.exe esté disponible en el equipo destino; viene con
;     SQL Server, SSMS o las "ODBC Driver Tools" de Microsoft).
;   - Genera una clave JWT aleatoria propia de esta instalación (no la comparte
;     con otras instalaciones tuyas).
;   - Registra el backend como Servicio de Windows (arranca solo con el sistema).
;   - Crea accesos directos que abren http://localhost:<puerto> en el navegador.
;   - Al desinstalar, detiene y borra el servicio (no borra la base de datos).
; ==============================================================================

#define MyAppName "Balanza Camionera"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Balanza Camionera"
#define MyAppExeName "BalanzasApi.exe"
#define MyServiceName "BalanzaCamioneraApi"
#define MyAppPort "5146"

[Setup]
AppId={{B2E1A6B4-8C3E-4B7E-9A9C-BAC0BA1A2C01}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
OutputDir=output
OutputBaseFilename=BalanzaCamionera-Setup-{#MyAppVersion}
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
WizardStyle=modern
UninstallDisplayIcon={app}\{#MyAppExeName}
DisableProgramGroupPage=yes

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Files]
; Todo el contenido de "dotnet publish" (backend self-contained + wwwroot con el build de Angular)
Source: "..\Backend\src\BalanzasApi\publish\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; Script de creación de la base de datos, para poder correrlo (o volver a correrlo a mano si hace falta)
Source: "..\Backend\sql\schema.sql"; DestDir: "{app}\sql"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "http://localhost:{#MyAppPort}"
Name: "{group}\Desinstalar {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "http://localhost:{#MyAppPort}"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Crear ícono en el Escritorio"; GroupDescription: "Accesos directos:"

[Code]
var
  DBPage: TInputQueryWizardPage;

procedure InitializeWizard;
begin
  DBPage := CreateInputQueryPage(wpSelectDir,
    'Configuración de la base de datos', 'Datos de conexión a SQL Server',
    'Ingresa los datos de tu instancia de SQL Server. La base de datos y las tablas ' +
    'se crean automáticamente si todavía no existen.');
  DBPage.Add('Servidor (ej: localhost\SQLEXPRESS o 127.0.0.1,1433):', False);
  DBPage.Add('Nombre de la base de datos:', False);
  DBPage.Add('Usuario de SQL Server (con permisos para crear bases):', False);
  DBPage.Add('Contraseña:', True);

  DBPage.Values[0] := 'localhost';
  DBPage.Values[1] := 'bd_Camionera';
  DBPage.Values[2] := 'sa';
end;

function BuildConnectionString(): String;
begin
  Result := 'Server=' + DBPage.Values[0] + ';Database=' + DBPage.Values[1] +
    ';User Id=' + DBPage.Values[2] + ';Password=' + DBPage.Values[3] +
    ';TrustServerCertificate=True;';
end;

{ Clave JWT única para esta instalación: cada cliente que instale el sistema
  termina con su propia clave, así un token generado en una instalación no
  sirve para autenticarse en otra. }
function GenerarClaveAleatoria(Longitud: Integer): String;
const
  Alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
var
  I: Integer;
begin
  Result := '';
  for I := 1 to Longitud do
    Result := Result + Alfabeto[Random(Length(Alfabeto)) + 1];
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  ResultCode: Integer;
  ConnStr, JwtKey, AppSettingsPath, Contenido, SqlCmdArgs: String;
begin
  if CurStep = ssPostInstall then
  begin
    ConnStr := BuildConnectionString();
    JwtKey := GenerarClaveAleatoria(48);

    { 1. Cadena de conexión + clave JWT propia en appsettings.Production.json.
      ASP.NET Core carga este archivo automáticamente porque el Servicio de
      Windows corre en el ambiente "Production" por defecto. }
    AppSettingsPath := ExpandConstant('{app}\appsettings.Production.json');
    Contenido :=
      '{' +
      '"ConnectionStrings":{"Default":"' + ConnStr + '"},' +
      '"Jwt":{"Key":"' + JwtKey + '","Issuer":"BalanzasApi","Audience":"BalanzasClient","ExpireMinutes":120}' +
      '}';
    SaveStringToFile(AppSettingsPath, Contenido, False);

    { 2. Crear la base de datos y las tablas si todavía no existen. }
    SqlCmdArgs := Format('-S "%s" -U "%s" -P "%s" -C -i "%s"',
      [DBPage.Values[0], DBPage.Values[2], DBPage.Values[3], ExpandConstant('{app}\sql\schema.sql')]);

    if not Exec('sqlcmd.exe', SqlCmdArgs, '', SW_SHOW, ewWaitUntilTerminated, ResultCode) then
      MsgBox('No se encontró sqlcmd.exe en este equipo. Corre manualmente el script ' +
        ExpandConstant('{app}') + '\sql\schema.sql en tu SQL Server (por ejemplo desde SSMS) ' +
        'antes de usar el sistema.', mbInformation, MB_OK)
    else if ResultCode <> 0 then
      MsgBox('El script de base de datos devolvió advertencias (código ' + IntToStr(ResultCode) +
        '). Es normal si la base ya existía de una instalación anterior; si el sistema no ' +
        'levanta después, revisa manualmente ' + ExpandConstant('{app}') + '\sql\schema.sql.',
        mbInformation, MB_OK);

    { 3. Registrar y arrancar el Servicio de Windows. }
    Exec('sc.exe', 'create {#MyServiceName} binPath= "' + ExpandConstant('{app}\{#MyAppExeName}') +
      '" start= auto DisplayName= "{#MyAppName}"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exec('sc.exe', 'description {#MyServiceName} "Backend y API del Sistema de Balanza Camionera"',
      '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exec('sc.exe', 'start {#MyServiceName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  ResultCode: Integer;
begin
  if CurUninstallStep = usUninstall then
  begin
    Exec('sc.exe', 'stop {#MyServiceName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Exec('sc.exe', 'delete {#MyServiceName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;
