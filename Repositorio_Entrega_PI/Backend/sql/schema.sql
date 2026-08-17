-- ==============================================================================
-- 0. CREACIÓN DE LA BASE DE DATOS
-- ==============================================================================
IF DB_ID('bd_Camionera') IS NULL
BEGIN
    CREATE DATABASE bd_Camionera;
END
GO

USE bd_Camionera;
GO

ALTER DATABASE bd_Camionera SET QUERY_STORE = ON;
GO

-- ==============================================================================
-- 1. TABLAS DE SEGURIDAD
-- ==============================================================================

CREATE TABLE [dbo].[Roles] (
    [rol_Id] INT IDENTITY(1,1) PRIMARY KEY,
    [rol_Nombre] VARCHAR(50) NOT NULL,
    [rol_Descripcion] VARCHAR(150) NULL,
    [rol_Modulos] VARCHAR(500) NULL, -- claves de módulo separadas por coma (ej: 'pesajes,tickets'); NULL/vacío = sin acceso a módulos
    [rol_Estado] BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE [dbo].[Usuarios] (
    [usu_Id] INT IDENTITY(1,1) PRIMARY KEY,
    [usu_NombreUsuario] VARCHAR(50) NOT NULL UNIQUE,
    [usu_NombreCompleto] VARCHAR(100) NOT NULL,
    [usu_PasswordHash] NVARCHAR(MAX) NOT NULL,
    [usu_Correo] VARCHAR(100) NULL,
    [usu_Turno] VARCHAR(20) NULL,
    [usu_RolId] INT NOT NULL,
    [usu_Estado] BIT NOT NULL DEFAULT 1
);
GO

-- ==============================================================================
-- 2. TABLAS MAESTRAS (Catálogos Estandarizados: Hacienda El Troje)
-- ==============================================================================

CREATE TABLE [dbo].[Clientes] (
    [cli_Id] INT IDENTITY(1,1) PRIMARY KEY,
    [cli_Identificacion] VARCHAR(20) NOT NULL,
    [cli_Nombre] VARCHAR(100) NOT NULL,
    [cli_Direccion] VARCHAR(200) NULL,
    [cli_Correo] VARCHAR(100) NULL,
    [cli_Tipo] VARCHAR(20) NOT NULL DEFAULT 'Cliente', -- 'Proveedor' o 'Cliente'
    [cli_Estado] BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE [dbo].[Productos] (
    [pro_Codigo] INT IDENTITY(1,1) PRIMARY KEY,
    [pro_Nombre] VARCHAR(100) NOT NULL,
    [pro_PrecioBase] DECIMAL(18,2) NULL,
    [pro_PesoPorSaco] DECIMAL(18,2) NULL,
    [pro_TipoFlujo] VARCHAR(20) NOT NULL DEFAULT 'Proveedor', -- 'Proveedor' (Entrada/Compra) o 'Cliente' (Salida/Despacho)
    [pro_ToleranciaMermaPct] DECIMAL(5,2) NOT NULL DEFAULT 3.50,
    [pro_Estado] BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE [dbo].[Vehiculos] (
    [veh_Placa] VARCHAR(15) PRIMARY KEY,
    [veh_Marca] VARCHAR(50) NULL,
    [veh_Modelo] VARCHAR(50) NULL,
    [veh_NumeroEjes] INT NOT NULL DEFAULT 2, -- 2, 3, 4, 5, 6 ejes (Norma MTOP Ecuador)
    [veh_TipoConfiguracion] VARCHAR(50) NOT NULL DEFAULT '2S - Camión 2 Ejes (18T)',
    [veh_CapacidadToneladas] DECIMAL(18,2) NULL DEFAULT 18.00,
    [veh_TaraKg] DECIMAL(18,2) NULL,
    [veh_TaraFecha] DATETIME NULL,
    [veh_TaraVigenciaDias] INT NOT NULL DEFAULT 30, -- Re-taraje cada 30 días
    [veh_Estado] BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE [dbo].[Balanzas] (
    [bal_Id] INT IDENTITY(1,1) PRIMARY KEY,
    [bal_Descripcion] VARCHAR(100) NOT NULL,
    [bal_Ip] VARCHAR(15) NOT NULL,
    [bal_Puerto] INT NOT NULL,
    [bal_Ubicacion] VARCHAR(100) NULL,
    [bal_Estado] BIT NOT NULL DEFAULT 1
);
GO

-- ==============================================================================
-- 3. TABLA PRINCIPAL (Transaccional)
-- ==============================================================================

CREATE TABLE [dbo].[Pesajes] (
    [pes_NumTran] INT IDENTITY(1,1) PRIMARY KEY,

    [pes_FechaHoraIn] DATETIME NOT NULL,
    [pes_FechaHoraOut] DATETIME NULL,
    [pes_DuracionMin] INT NULL,

    [pes_PesoBruto] DECIMAL(18,2) NOT NULL,
    [pes_PesoTara] DECIMAL(18,2) NOT NULL,
    [pes_PesoNeto] DECIMAL(18,2) NOT NULL,
    [pes_PesoOrigen] DECIMAL(18,2) NULL, -- Según Guía de Remisión SRI
    [pes_MermaKg] DECIMAL(18,2) NULL,
    [pes_MermaPct] DECIMAL(5,2) NULL,
    [pes_TipoOperacion] VARCHAR(10) NOT NULL DEFAULT 'Descarga', -- 'Descarga' (Proveedor) o 'Carga' (Cliente)

    [pes_NumBins] INT NULL,
    [pes_NumGavetas] INT NULL,
    [pes_LoteTraza] VARCHAR(50) NULL,

    [pes_GuiaRemision] VARCHAR(50) NULL,
    [pes_Orden] VARCHAR(50) NULL,
    [pes_Observacion] VARCHAR(255) NULL,
    [pes_NombreChofer] VARCHAR(100) NULL,

    [pes_SelloDigitalHash] VARCHAR(64) NULL, -- Hash criptográfico SHA-256 de no repudio
    [pes_EstadoViaje] VARCHAR(30) NOT NULL DEFAULT 'VIAJE_COMPLETADO_OK',

    [pes_Estado] BIT NOT NULL DEFAULT 1,

    [pes_VehPlaca] VARCHAR(15) NOT NULL,
    [pes_CliId] INT NOT NULL,
    [pes_ProCodigo] INT NOT NULL,
    [pes_BalId] INT NOT NULL,
    [pes_BalIdSalida] INT NULL,
    [pes_UsuIngId] INT NOT NULL,
    [pes_UsuSalId] INT NULL,
    [pes_ProveedorId] INT NULL,
    [pes_TransportistaId] INT NULL
);
GO

-- ==============================================================================
-- 4. TABLAS ADICIONALES (Informes, Config, Auditoría)
-- ==============================================================================

CREATE TABLE [dbo].[Informes] (
    [inf_Id] INT IDENTITY(1,1) PRIMARY KEY,
    [inf_Titulo] VARCHAR(100) NOT NULL,
    [inf_Contenido] NVARCHAR(MAX) NULL,
    [inf_FechaGeneracion] DATETIME DEFAULT GETDATE(),
    [inf_Estado] BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE [dbo].[Configuraciones] (
    [cnf_Id] INT IDENTITY(1,1) PRIMARY KEY,
    [cnf_Parametro] VARCHAR(50) NOT NULL,
    [cnf_Valor] VARCHAR(200) NOT NULL,
    [cnf_Estado] BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE [dbo].[Auditoria] (
    [aud_Id] INT IDENTITY(1,1) PRIMARY KEY,
    [aud_TablaAfectada] VARCHAR(50) NOT NULL,
    [aud_Accion] VARCHAR(20) NOT NULL,
    [aud_UsuId] INT NOT NULL,
    [aud_Fecha] DATETIME DEFAULT GETDATE(),
    [aud_Detalle] NVARCHAR(MAX) NULL,
    [aud_IpAddress] VARCHAR(45) NULL,
    [aud_Estado] BIT NOT NULL DEFAULT 1
);
GO

-- ==============================================================================
-- 5. LLAVES FORÁNEAS
-- ==============================================================================

ALTER TABLE [dbo].[Usuarios] ADD CONSTRAINT [FK_Usuarios_Roles] FOREIGN KEY([usu_RolId]) REFERENCES [dbo].[Roles] ([rol_Id]);
ALTER TABLE [dbo].[Pesajes] ADD CONSTRAINT [FK_Pesajes_Vehiculos] FOREIGN KEY([pes_VehPlaca]) REFERENCES [dbo].[Vehiculos] ([veh_Placa]);
ALTER TABLE [dbo].[Pesajes] ADD CONSTRAINT [FK_Pesajes_Clientes] FOREIGN KEY([pes_CliId]) REFERENCES [dbo].[Clientes] ([cli_Id]);
ALTER TABLE [dbo].[Pesajes] ADD CONSTRAINT [FK_Pesajes_Productos] FOREIGN KEY([pes_ProCodigo]) REFERENCES [dbo].[Productos] ([pro_Codigo]);
ALTER TABLE [dbo].[Pesajes] ADD CONSTRAINT [FK_Pesajes_Balanzas] FOREIGN KEY([pes_BalId]) REFERENCES [dbo].[Balanzas] ([bal_Id]);
ALTER TABLE [dbo].[Pesajes] ADD CONSTRAINT [FK_Pesajes_UsuIngreso] FOREIGN KEY([pes_UsuIngId]) REFERENCES [dbo].[Usuarios] ([usu_Id]);
ALTER TABLE [dbo].[Pesajes] ADD CONSTRAINT [FK_Pesajes_UsuSalida] FOREIGN KEY([pes_UsuSalId]) REFERENCES [dbo].[Usuarios] ([usu_Id]);
ALTER TABLE [dbo].[Pesajes] ADD CONSTRAINT [FK_Pesajes_BalanzaSalida] FOREIGN KEY([pes_BalIdSalida]) REFERENCES [dbo].[Balanzas] ([bal_Id]);
ALTER TABLE [dbo].[Pesajes] ADD CONSTRAINT [FK_Pesajes_Proveedor] FOREIGN KEY([pes_ProveedorId]) REFERENCES [dbo].[Clientes] ([cli_Id]);
ALTER TABLE [dbo].[Pesajes] ADD CONSTRAINT [FK_Pesajes_Transportista] FOREIGN KEY([pes_TransportistaId]) REFERENCES [dbo].[Clientes] ([cli_Id]);
ALTER TABLE [dbo].[Auditoria] ADD CONSTRAINT [FK_Auditoria_Usuarios] FOREIGN KEY([aud_UsuId]) REFERENCES [dbo].[Usuarios] ([usu_Id]);
GO

-- ==============================================================================
-- 6. VISTAS ANALÍTICAS (Para Power BI y Dashboard en Vivo)
-- ==============================================================================

CREATE OR ALTER VIEW [dbo].[vw_ResumenPesajesHoy] AS
SELECT
    p.[pes_NumTran],
    p.[pes_FechaHoraIn],
    p.[pes_FechaHoraOut],
    p.[pes_DuracionMin],
    v.[veh_Placa],
    v.[veh_NumeroEjes],
    v.[veh_TipoConfiguracion],
    p.[pes_NombreChofer],
    c.[cli_Nombre],
    c.[cli_Tipo],
    pr.[pro_Nombre],
    pr.[pro_TipoFlujo],
    p.[pes_PesoBruto],
    p.[pes_PesoTara],
    p.[pes_PesoNeto],
    p.[pes_MermaKg],
    p.[pes_MermaPct],
    p.[pes_TipoOperacion],
    p.[pes_EstadoViaje]
FROM [dbo].[Pesajes] p
INNER JOIN [dbo].[Vehiculos] v ON p.[pes_VehPlaca] = v.[veh_Placa]
INNER JOIN [dbo].[Clientes] c ON p.[pes_CliId] = c.[cli_Id]
INNER JOIN [dbo].[Productos] pr ON p.[pes_ProCodigo] = pr.[pro_Codigo]
WHERE CAST(p.[pes_FechaHoraIn] AS DATE) = CAST(GETDATE() AS DATE)
  AND p.[pes_Estado] = 1;
GO

-- ==============================================================================
-- 7. SEED DATA (Catálogos Oficiales de Hacienda El Troje)
-- ==============================================================================

-- 7.1. Roles
IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [rol_Nombre] = 'Administrador')
    INSERT INTO [dbo].[Roles] ([rol_Nombre], [rol_Descripcion], [rol_Modulos], [rol_Estado])
    VALUES ('Administrador', 'Acceso total al sistema y panel gerencial', 'dashboard,pesajes,tickets,clientes,productos,vehiculos,basculas,usuarios,reportes,configuracion', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [rol_Nombre] = 'Operador')
    INSERT INTO [dbo].[Roles] ([rol_Nombre], [rol_Descripcion], [rol_Modulos], [rol_Estado])
    VALUES ('Operador', 'Cabina de pesaje: registro de pesajes, tickets y vehículos', 'pesajes,tickets,vehiculos', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[Roles] WHERE [rol_Nombre] = 'Gerente')
    INSERT INTO [dbo].[Roles] ([rol_Nombre], [rol_Descripcion], [rol_Modulos], [rol_Estado])
    VALUES ('Gerente', 'Panel gerencial móvil y autorización de excepciones de merma', 'dashboard,reportes', 1);
GO

-- 7.2. Usuario Administrador Inicial
IF NOT EXISTS (SELECT 1 FROM [dbo].[Usuarios] WHERE [usu_NombreUsuario] = 'admin')
BEGIN
    DECLARE @rolAdminId INT = (SELECT TOP 1 [rol_Id] FROM [dbo].[Roles] WHERE [rol_Nombre] = 'Administrador');
    INSERT INTO [dbo].[Usuarios] ([usu_NombreUsuario], [usu_NombreCompleto], [usu_PasswordHash], [usu_RolId], [usu_Estado])
    VALUES ('admin', 'Administrador General', 'admin123', @rolAdminId, 1);
END
GO

-- 7.3. Catálogo de 6 Productos Oficiales (3 Proveedor / Compras vs 3 Cliente / Despachos)
SET IDENTITY_INSERT [dbo].[Productos] ON;

IF NOT EXISTS (SELECT 1 FROM [dbo].[Productos] WHERE [pro_Codigo] = 10)
    INSERT INTO [dbo].[Productos] ([pro_Codigo], [pro_Nombre], [pro_PrecioBase], [pro_TipoFlujo], [pro_ToleranciaMermaPct], [pro_Estado])
    VALUES (10, 'Maíz Amarillo en Grano (Cosecha/Bruto)', 0.32, 'Proveedor', 4.50, 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[Productos] WHERE [pro_Codigo] = 20)
    INSERT INTO [dbo].[Productos] ([pro_Codigo], [pro_Nombre], [pro_PrecioBase], [pro_TipoFlujo], [pro_ToleranciaMermaPct], [pro_Estado])
    VALUES (20, 'Arroz en Cáscara (Paddy)', 0.38, 'Proveedor', 3.80, 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[Productos] WHERE [pro_Codigo] = 30)
    INSERT INTO [dbo].[Productos] ([pro_Codigo], [pro_Nombre], [pro_PrecioBase], [pro_TipoFlujo], [pro_ToleranciaMermaPct], [pro_Estado])
    VALUES (30, 'Soya en Grano (Bruto)', 0.45, 'Proveedor', 3.50, 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[Productos] WHERE [pro_Codigo] = 40)
    INSERT INTO [dbo].[Productos] ([pro_Codigo], [pro_Nombre], [pro_PrecioBase], [pro_TipoFlujo], [pro_ToleranciaMermaPct], [pro_Estado])
    VALUES (40, 'Arroz Pilado / Procesado (Comercial)', 0.68, 'Cliente', 2.00, 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[Productos] WHERE [pro_Codigo] = 50)
    INSERT INTO [dbo].[Productos] ([pro_Codigo], [pro_Nombre], [pro_PrecioBase], [pro_TipoFlujo], [pro_ToleranciaMermaPct], [pro_Estado])
    VALUES (50, 'Cacao Fino de Aroma (Seco/Fermentado)', 3.80, 'Cliente', 1.50, 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[Productos] WHERE [pro_Codigo] = 60)
    INSERT INTO [dbo].[Productos] ([pro_Codigo], [pro_Nombre], [pro_PrecioBase], [pro_TipoFlujo], [pro_ToleranciaMermaPct], [pro_Estado])
    VALUES (60, 'Torta / Harina de Soya (Balanceados)', 0.55, 'Cliente', 2.00, 1);

SET IDENTITY_INSERT [dbo].[Productos] OFF;
GO

-- 7.4. Catálogo de Clientes y Proveedores
SET IDENTITY_INSERT [dbo].[Clientes] ON;

IF NOT EXISTS (SELECT 1 FROM [dbo].[Clientes] WHERE [cli_Id] = 1)
    INSERT INTO [dbo].[Clientes] ([cli_Id], [cli_Identificacion], [cli_Nombre], [cli_Tipo], [cli_Estado])
    VALUES (1, '0992345678001', 'Asociación Agro-Guayas S.A.', 'Proveedor', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[Clientes] WHERE [cli_Id] = 2)
    INSERT INTO [dbo].[Clientes] ([cli_Id], [cli_Identificacion], [cli_Nombre], [cli_Tipo], [cli_Estado])
    VALUES (2, '1291827364001', 'Corporación Agrícola Quevedo Ltda', 'Proveedor', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[Clientes] WHERE [cli_Id] = 3)
    INSERT INTO [dbo].[Clientes] ([cli_Id], [cli_Identificacion], [cli_Nombre], [cli_Tipo], [cli_Estado])
    VALUES (3, '0990123456001', 'Hacienda La Clementina Corp', 'Proveedor', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[Clientes] WHERE [cli_Id] = 4)
    INSERT INTO [dbo].[Clientes] ([cli_Id], [cli_Identificacion], [cli_Nombre], [cli_Tipo], [cli_Estado])
    VALUES (4, '0997654321001', 'Distribuidora del Litoral S.A.', 'Cliente', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[Clientes] WHERE [cli_Id] = 5)
    INSERT INTO [dbo].[Clientes] ([cli_Id], [cli_Identificacion], [cli_Nombre], [cli_Tipo], [cli_Estado])
    VALUES (5, '0991122334001', 'Comercial Bananera Guayaquil', 'Cliente', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[Clientes] WHERE [cli_Id] = 6)
    INSERT INTO [dbo].[Clientes] ([cli_Id], [cli_Identificacion], [cli_Nombre], [cli_Tipo], [cli_Estado])
    VALUES (6, '0190123987001', 'Industrias Agroalimentarias del Austro', 'Cliente', 1);

SET IDENTITY_INSERT [dbo].[Clientes] OFF;
GO

-- 7.5. Catálogo de Vehículos con Ejes (Norma MTOP Ecuador)
IF NOT EXISTS (SELECT 1 FROM [dbo].[Vehiculos] WHERE [veh_Placa] = 'YBA-3344')
    INSERT INTO [dbo].[Vehiculos] ([veh_Placa], [veh_Marca], [veh_Modelo], [veh_NumeroEjes], [veh_TipoConfiguracion], [veh_CapacidadToneladas], [veh_TaraKg], [veh_TaraFecha], [veh_TaraVigenciaDias], [veh_Estado])
    VALUES ('YBA-3344', 'Hino', 'GD 700', 3, '3S - Camión 3 Ejes (27T)', 27.00, 12500.00, GETDATE(), 30, 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[Vehiculos] WHERE [veh_Placa] = 'GBA-4321')
    INSERT INTO [dbo].[Vehiculos] ([veh_Placa], [veh_Marca], [veh_Modelo], [veh_NumeroEjes], [veh_TipoConfiguracion], [veh_CapacidadToneladas], [veh_TaraKg], [veh_TaraFecha], [veh_TaraVigenciaDias], [veh_Estado])
    VALUES ('GBA-4321', 'Mercedes-Benz', 'Atego 1726', 2, '2S - Camión 2 Ejes (18T)', 18.00, 8900.00, GETDATE(), 30, 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[Vehiculos] WHERE [veh_Placa] = 'PBA-8899')
    INSERT INTO [dbo].[Vehiculos] ([veh_Placa], [veh_Marca], [veh_Modelo], [veh_NumeroEjes], [veh_TipoConfiguracion], [veh_CapacidadToneladas], [veh_TaraKg], [veh_TaraFecha], [veh_TaraVigenciaDias], [veh_Estado])
    VALUES ('PBA-8899', 'International', 'ProStar 3S2', 5, '3S2 - Tráiler 5 Ejes (42T)', 42.00, 15800.00, GETDATE(), 30, 1);
GO

-- 7.6. Balanza Industrial Mettler Toledo
SET IDENTITY_INSERT [dbo].[Balanzas] ON;
IF NOT EXISTS (SELECT 1 FROM [dbo].[Balanzas] WHERE [bal_Id] = 1)
    INSERT INTO [dbo].[Balanzas] ([bal_Id], [bal_Descripcion], [bal_Ip], [bal_Puerto], [bal_Ubicacion], [bal_Estado])
    VALUES (1, 'Balanza Camionera Principal IND780', '192.168.1.50', 4001, 'Garita Central El Troje', 1);
SET IDENTITY_INSERT [dbo].[Balanzas] OFF;
GO
