# 🎓 Proyecto Integrador de Software — "Proyecto after" (Versión Final Oficial)
### Sistema Web Inteligente para el Pesaje, Control y Analítica del Comercio Agroindustrial — PesaJusto
**Universidad Regional Autónoma de los Andes — UNIANDES — 6to Semestre**  
**Autores / Equipo de Desarrollo:** Angel Stalin Aucancela Tamay & Felipe Renato Ricaurte Solis  
**Base Documental Oficial:** Memoria Técnica Académica Oficial (Normas APA 7ma Edición)

---

## 📁 Mapa de Entregables Oficiales por Asignatura (Formato PDF y Código Fuente)

El presente repositorio consolida la entrega final del Proyecto Integrador, estructurado de forma modular y conforme a los requerimientos de las 6 asignaturas del nivel:

```text
Proyecto after/
│
├── 00_Entregable_General_Documento_Final/
│   ├── Grupo4-Final_Documento_Oficial_PI.pdf           # Memoria Técnica Oficial Integradora (APA 7)
│   └── Documento_Memoria_Final_Firmado.pdf             # Respaldo Documental y Legal Firmado
│
├── 01_Diseno_y_Arquitectura_de_Software/
│   └── Backend_API_Net10/                              # Arquitectura N-Capas (.NET 10 Web API):
│       ├── Controllers/                                # Endpoints REST desacoplados
│       ├── Repositories/                               # Acceso a Datos con Dapper Micro-ORM
│       ├── Services/                                   # Adapter Báscula Mettler Toledo TCP/IP y Asistente IA
│       ├── Hubs/                                       # WebSockets SignalR para transmisión de peso en vivo
│       └── sql/schema.sql                              # Scripts DDL de Base de Datos y Auditoría
│
├── 02_Aplicaciones_Web/
│   └── Frontend_Angular19_SPA/                         # Aplicación Web SPA (Angular 19 + PrimeNG):
│       ├── src/app/features/pesajes/                   # Flujos de pesaje: Recepción de Granos vs Despacho
│       ├── src/app/features/vehiculos/                 # Flota vehicular con taras calibradas por producto
│       ├── src/app/features/asistente/                 # Módulo de Asistente IA con consultas en lenguaje natural
│       ├── src/app/features/dashboard/                 # Panel gerencial interactivo con métricas en tiempo real
│       ├── src/app/features/reportes/                  # Consultas avanzadas y exportación de datos
│       └── src/app/features/tickets/                   # Emisión e impresión de comprobantes oficiales
│
├── 03_Inteligencia_Artificial/
│   └── demostrador_asistente_ia.py                     # Demostrador del Agente IA (PLN + Function Calling)
│
├── 04_Inteligencia_de_Negocios/
│   ├── Tablero_PowerBI_Pesajes_ElTroje.pbix            # Tablero dimensional estrella y 4 KPIs de producción
│   └── Informe_Modelado_Dimensional_BI.pdf             # Memoria técnica de arquitectura OLTP vs OLAP
│
├── 05_Proyectos_Informaticos/
│   └── Planificacion_Sprints_MSProject.mpp             # EDT/WBS, cronograma de Sprints y matriz de riesgos
│
├── 06_Gestion_Empresarial_y_Emprendimiento/
│   ├── Estudio_de_Mercado_y_Factibilidad_PesaJusto.pdf # Estudio de factibilidad técnica, operativa y financiera
│   ├── Diapositivas_Sustentacion_Oficial.pptx          # Presentación oficial para la defensa oral universitaria
│   ├── Presentacion_Defensa_PesaJusto.pptx             # Presentación complementaria del producto de software
│   └── Ensayo_Academico_Control_Vehicular.pdf          # Ensayo académico sobre impacto agroindustrial
│
└── 07_Paquete_Despliegue_e_Instalador/
    └── BalanzaCamionera.iss                            # Script Inno Setup para empaquetado del instalador
```

---

## 🎯 Síntesis del Alcance y Especificaciones Técnicas del Proyecto

* **Institución y Caso de Estudio**: Centro de acopio y comercialización agrícola *"El Troje"*.
* **Hardware Integrado**: Báscula camionera industrial **Mettler Toledo IND780** conectada mediante Socket Ethernet TCP/IP continuo.
* **Cadena de Custodia y Productos (Correspondencia 1 a 1)**:
  * **Recepción de Granos en Bruto (Proveedores)**: Maíz Amarillo en Grano, Arroz en Cáscara (Paddy), Soya en Grano.
  * **Despacho de Productos Procesados (Clientes)**: Maíz Seco Comercial, Arroz Pilado Comercial, Torta/Harina de Soya.
* **Componente de Inteligencia Artificial**: Asistente conversacional con **Procesamiento de Lenguaje Natural (PLN)** e invocación de herramientas (*Function Calling*) sobre repositorios SQL transaccionales en tiempo real.
* **Auditoría Integral y Seguridad**: Registro forense de transacciones (IP, usuario, fecha/hora, báscula ID, estado de estabilidad).
* **Validación Experimental**: 550 operaciones de pesaje evaluadas en 60 días con 98.2% de confiabilidad y reducción del ciclo operativo a 2.1 minutos.

---

## 🚀 Guía de Ejecución y Demostración

### 1. Iniciar el Backend (.NET 10 Web API):
```powershell
cd "01_Diseno_y_Arquitectura_de_Software\Backend_API_Net10\src\BalanzasApi"
dotnet run --launch-profile "http"
```
* **Estado:** Escuchando en `http://localhost:5146` (Swagger en `http://localhost:5146/swagger`).

### 2. Iniciar el Frontend (Angular 19 SPA):
```powershell
cd "02_Aplicaciones_Web\Frontend_Angular19_SPA"
npm start
```
* **Estado:** Interfaz web en **`http://localhost:4200`**.

### 3. Demostración del Agente de Inteligencia Artificial:
* **Desde la Web:** Navegar al módulo `/asistente` (`http://localhost:4200/asistente`).
* **Desde la Consola:**
  ```powershell
  cd "03_Inteligencia_Artificial"
  python demostrador_asistente_ia.py
  ```

---

## 🔑 Credenciales Oficiales de Acceso al Sistema
* **Administrador General:** `admin` / `admin123`
* **Operador de Báscula:** `operador` / `operador123`
* **Gerente de Planta:** `gerente` / `gerente123`
