"""
==============================================================================
PesaJusto - Simulador Visual ALPR sobre Báscula Camionera (Tkinter + Canvas)
Carrera de Ingeniería de Software — UNIANDES 2026
==============================================================================
Ventana gráfica 100% nativa de Windows (Tkinter) para garantizar que se abra 
sin depender de librerías externas o fallas de drivers de video.
==============================================================================
"""

import tkinter as tk
from tkinter import ttk
import time

VEHICULOS_SIMULADOS = [
    {
        "placa": "GBA-1011",
        "actor": "Asociación Agro-Guayas S.A.",
        "tipo": "Proveedor",
        "chofer": "Carlos Mendoza",
        "producto": "Maíz Amarillo en Grano (Bruto)",
        "peso_kg": 38450,
        "tara_kg": 11200,
        "vigente": True,
        "dias": 28,
        "flujo": "Recepción de Granos (Pesaje 1 Entrada - Camión Lleno)"
    },
    {
        "placa": "RBA-4044",
        "actor": "Corporación Agrícola Quevedo Ltda",
        "tipo": "Proveedor",
        "chofer": "Jorge Zambrano",
        "producto": "Arroz en Cáscara (Paddy)",
        "peso_kg": 36100,
        "tara_kg": 10700,
        "vigente": True,
        "dias": 15,
        "flujo": "Recepción de Granos (Pesaje 1 Entrada - Camión Lleno)"
    },
    {
        "placa": "PBA-8899",
        "actor": "Distribuidora del Litoral S.A.",
        "tipo": "Cliente",
        "chofer": "Manuel Peralta",
        "producto": "Arroz Pilado / Procesado (Comercial)",
        "peso_kg": 10500,
        "tara_kg": 10500,
        "vigente": True,
        "dias": 22,
        "flujo": "Despacho Cosecha (Entrada Vacío / Tara Guardada)"
    },
    {
        "placa": "GBA-5566",
        "actor": "Comercial Bananera Guayaquil",
        "tipo": "Cliente",
        "chofer": "Esteban Ronquillo",
        "producto": "Maíz Seco / Procesado (Comercial)",
        "peso_kg": 11080,
        "tara_kg": 11080,
        "vigente": True,
        "dias": 30,
        "flujo": "Despacho Cosecha (Entrada Vacío / Tara Guardada)"
    },
    {
        "placa": "PBA-2233",
        "actor": "Agropecuaria Los Ríos Cía. Ltda.",
        "tipo": "Proveedor",
        "chofer": "Luis Morales",
        "producto": "Soya en Grano (Bruto)",
        "peso_kg": 35200,
        "tara_kg": 11100,
        "vigente": True,
        "dias": 25,
        "flujo": "Recepción de Granos (Pesaje 1 Entrada - Camión Lleno)"
    },
    {
        "placa": "XYZ-9999",
        "actor": "Transportes del Norte Cía",
        "tipo": "No Registrado",
        "chofer": "Chofer Desconocido",
        "producto": "Sin Asignar",
        "peso_kg": 33900,
        "tara_kg": 0,
        "vigente": False,
        "dias": 0,
        "flujo": "Requiere Alta de Vehículo y Pesaje Manual"
    }
]

class SimuladorALPRApp:
    def __init__(self, root):
        self.root = root
        self.root.title("PesaJusto - Módulo de Visión Artificial ALPR sobre Báscula")
        self.root.geometry("880x620")
        self.root.configure(bg="#1e2227")
        self.root.resizable(False, False)

        self.idx_actual = 0

        # Header
        header = tk.Frame(self.root, bg="#181a1f", height=50)
        header.pack(fill="x")
        lbl_titulo = tk.Label(header, text="📷 CÁMARA ALPR EN VIVO: BÁSCULA METTLER TOLEDO IND780", 
                              font=("Arial", 12, "bold"), fg="#00e5ff", bg="#181a1f")
        lbl_titulo.pack(pady=12)

        # Canvas de Simulación Visual de Cámara
        self.canvas = tk.Canvas(self.root, width=820, height=330, bg="#282c34", highlightthickness=2, highlightbackground="#3e4451")
        self.canvas.pack(pady=15)

        # Panel de Datos Reconocidos por IA
        panel_datos = tk.LabelFrame(self.root, text=" Telemetría y Reconocimiento de Inteligencia Artificial ", 
                                    font=("Arial", 10, "bold"), fg="#abb2bf", bg="#21252b", padx=15, pady=10)
        panel_datos.pack(fill="x", padx=30)

        self.lbl_actor = tk.Label(panel_datos, text="", font=("Arial", 11, "bold"), bg="#21252b", fg="#98c379")
        self.lbl_actor.pack(anchor="w")

        self.lbl_detalles = tk.Label(panel_datos, text="", font=("Arial", 10), bg="#21252b", fg="#d19a66")
        self.lbl_detalles.pack(anchor="w", pady=2)

        self.lbl_pesos = tk.Label(panel_datos, text="", font=("Arial", 10, "bold"), bg="#21252b", fg="#61afef")
        self.lbl_pesos.pack(anchor="w", pady=2)

        self.lbl_flujo = tk.Label(panel_datos, text="", font=("Arial", 10, "italic"), bg="#21252b", fg="#e5c07b")
        self.lbl_flujo.pack(anchor="w", pady=2)

        # Botones de Control
        frame_btn = tk.Frame(self.root, bg="#1e2227")
        frame_btn.pack(pady=12)

        btn_siguiente = tk.Button(frame_btn, text="⏩ Siguiente Camión en Báscula", font=("Arial", 10, "bold"), 
                                  bg="#98c379", fg="#1e2227", padx=15, pady=6, command=self.siguiente_camion)
        btn_siguiente.pack(side="left", padx=10)

        btn_salir = tk.Button(frame_btn, text="Cerrar Simulación", font=("Arial", 10), 
                              bg="#e06c75", fg="white", padx=15, pady=6, command=self.root.destroy)
        btn_salir.pack(side="left", padx=10)

        self.mostrar_camion()

    def dibujar_camion(self, v):
        self.canvas.delete("all")

        # Marco de la plataforma
        self.canvas.create_rectangle(30, 20, 790, 310, outline="#4b5263", width=2)
        self.canvas.create_text(50, 35, text="[CAM-01] PLATAFORMA DE PESAJE EN VIVO", fill="#5c6370", anchor="w", font=("Consolas", 10))

        # Silueta frontal del camión
        self.canvas.create_rectangle(180, 70, 640, 280, fill="#3b4048", outline="#5c6370", width=2) # Cabina
        self.canvas.create_rectangle(220, 90, 600, 160, fill="#1e2227", outline="#4b5263", width=2) # Parabrisas

        # Luces
        self.canvas.create_oval(200, 210, 240, 250, fill="#e5c07b", outline="")
        self.canvas.create_oval(580, 210, 620, 250, fill="#e5c07b", outline="")

        # Placa Vehicular
        self.canvas.create_rectangle(330, 210, 490, 260, fill="#f0f0f0", outline="#000000", width=2)
        self.canvas.create_text(410, 235, text=v["placa"], fill="#000000", font=("Arial", 16, "bold"))

        # Cuadro Verde de Región de Interés (ROI) detectada por IA
        self.canvas.create_rectangle(315, 195, 505, 275, outline="#98c379", width=3)
        self.canvas.create_text(410, 185, text="ROI: PLACA ECUADOR VALIDADA", fill="#98c379", font=("Arial", 9, "bold"))

    def mostrar_camion(self):
        v = VEHICULOS_SIMULADOS[self.idx_actual]
        self.dibujar_camion(v)

        color_tipo = "#98c379" if v["tipo"] == "Proveedor" else "#61afef"
        if v["tipo"] == "No Registrado":
            color_tipo = "#e06c75"

        self.lbl_actor.config(text=f"🏢 Empresa: {v['actor']} ({v['tipo']})", fg=color_tipo)
        self.lbl_detalles.config(text=f"🌾 Producto: {v['producto']}   |   👨‍✈️ Chofer Habitual: {v['chofer']}")
        
        tara_txt = f"{v['tara_kg']} kg (Vigente: {v['dias']} días)" if v['vigente'] else "SIN TARA PREVIA / RETARAJE REQUERIDO"
        self.lbl_pesos.config(text=f"⚖️ Peso Báscula: {v['peso_kg']} kg   |   🎛️ Tara Producto: {tara_txt}")
        self.lbl_flujo.config(text=f"🚀 Acción Operativa: {v['flujo']}")

    def siguiente_camion(self):
        self.idx_actual = (self.idx_actual + 1) % len(VEHICULOS_SIMULADOS)
        self.mostrar_camion()

def main():
    root = tk.Tk()
    app = SimuladorALPRApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
