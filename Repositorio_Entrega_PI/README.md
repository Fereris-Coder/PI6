# 🌾 Sistema de Gestión y Automatización de Pesajes Camioneros
### Proyecto Integrador de 6to Semestre — UNIANDES

Este repositorio contiene la solución de software completa para la automatización, pesaje industrial (granos y cosecha), gestión de básculas en tiempo real y business intelligence.

---

## 📁 Estructura del Repositorio

```text
├── Backend/
│   ├── sql/
│   │   └── schema.sql                  # Scripts DDL de base de datos SQL Server
│   └── src/
│       └── BalanzasApi/               # API REST (.NET 10 / ASP.NET Core)
│           ├── Controllers/           # Controladores de Pesajes, Vehículos, Básculas, etc.
│           ├── Models/                # Modelos de Dominio y DTOs
│           ├── Repositories/          # Capa de Acceso a Datos con Dapper
│           ├── Services/              # Servicios de Báscula TCP/IP y SignalR
│           └── Hubs/                  # WebSockets para Peso en Vivo
├── Front/
│   └── src/
│       └── app/                       # SPA Angular 19 (Signals, Standalone, PrimeNG)
│           ├── features/              # Módulos: Dashboard, Pesajes, Vehículos, Reportes, etc.
│           └── shared/                # Servicios HTTP, WebSocket BalanzaLive, Modelos
└── Documentacion/                     # Guías, diagramas y documentación del proyecto
```

---

## 🚀 Requisitos Previos

* **.NET 10 SDK** (o versión compatible superior).
* **Node.js** v20+ y **npm** v10+.
* **SQL Server** (o SQL Server LocalDB `(localdb)\MSSQLLocalDB`).

---

## ⚙️ Instrucciones de Ejecución

### 1. Base de Datos
1. Ejecutar el script `Backend/sql/schema.sql` en su instancia de SQL Server.
2. Por defecto, la cadena de conexión apunta a `Server=(localdb)\MSSQLLocalDB;Database=bd_Camionera;Integrated Security=True;`.

### 2. Backend (.NET 10 Web API)
```bash
cd Backend/src/BalanzasApi
dotnet restore
dotnet run --launch-profile "http"
```
*API disponible en:* `http://localhost:5146` (Swagger en `http://localhost:5146/swagger`).

### 3. Frontend (Angular 19 SPA)
```bash
cd Front
npm install
npm start
```
*Aplicación web disponible en:* `http://localhost:4200`

---

## 🔐 Credenciales de Acceso al Sistema
* **Usuario:** `admin`
* **Contraseña:** `admin123`
