# 🌾 Sistema de Gestión y Automatización de Pesajes Camioneros (PesaJusto)
### Proyecto Integrador de 6to Semestre — Carrera de Software — UNIANDES

Solución integral de software para la automatización, pesaje industrial y control de básculas camioneras, integrando **Inteligencia Artificial (Visión por Computador ALPR)**, arquitectura cliente-servidor en tiempo real, gestión de flota con taras multiproducto y analítica de datos.

---

## 📁 Estructura del Repositorio

```text
├── Backend/                            # API REST y WebSockets en .NET 10 / C#
│   ├── sql/                            # Scripts DDL de base de datos SQL Server
│   └── src/BalanzasApi/                # Controladores, Repositorios Dapper, Modelos y Hubs
├── Front/                              # SPA Frontend en Angular 19 (Signals, Standalone, PrimeNG)
│   └── src/app/                        # Dashboard, Pesajes, Vehículos, Clientes, Reportes
├── AI_Engine/                          # Módulo de IA (Visión Artificial / ALPR)
│   ├── alpr_garita.py                  # Reconocimiento automático de matrículas
│   └── requirements.txt                # Dependencias OpenCV, PyTorch / Ultralytics
├── Installer/                          # Empaquetado y Distribución
│   └── BalanzaCamionera.iss            # Script de compilación de instalador Inno Setup
└── Documentacion/                      # Entregables Académicos y de Negocio
    ├── Ensayo-Control-Acceso-Vehicular-IA.docx
    ├── Mi-Producto-de-Software-al-Mercado.docx
    ├── Sistema-Balanza-Camionera.pdf
    └── Presentacion-PesaJusto.pptx
```

---

## 🚀 Requisitos Previos

* **.NET 10 SDK** (o versión compatible superior).
* **Node.js** v20+ y **npm** v10+.
* **Python** 3.10+ (para el módulo `AI_Engine`).
* **SQL Server** o **SQL Server LocalDB** (`(localdb)\MSSQLLocalDB`).

---

## ⚙️ Pasos para Ejecución Local

### 1. Base de Datos
Ejecutar el script `Backend/sql/schema.sql` en SQL Server.

### 2. Backend (.NET 10 Web API)
```bash
cd Backend/src/BalanzasApi
dotnet restore
dotnet run --launch-profile "http"
```
*API y WebSockets disponibles en:* `http://localhost:5146`  
*Documentación OpenAPI / Swagger:* `http://localhost:5146/swagger`

### 3. Frontend (Angular 19 SPA)
```bash
cd Front
npm install
npm start
```
*Aplicación Web disponible en:* `http://localhost:4200`

### 4. Módulo de IA (ALPR en Garita)
```bash
cd AI_Engine
pip install -r requirements.txt
python alpr_garita.py
```

---

## 🔐 Credenciales Predeterminadas
* **Usuario:** `admin`
* **Contraseña:** `admin123`
