"""
==============================================================================
PesaJusto - Simulador y Visor ALPR en Tiempo Real sobre Báscula Camionera
Carrera de Ingeniería de Software — UNIANDES 2026
==============================================================================
Módulo de Visión Artificial interactivo que simula una cámara IP cenital/frontal 
enfocando la plataforma de pesaje en tiempo real con ventana gráfica de OpenCV.
==============================================================================
"""

import cv2
import numpy as np
import time
import requests
import json
import os

API_BASE_URL = os.environ.get("PESAJUSTO_API_URL", "http://localhost:5146/api")

# Catálogo coherente con la base de datos y memoria técnica
VEHICULOS_SIMULADOS = [
    {
        "placa": "GBA-1011",
        "actor": "Asociación Agro-Guayas S.A.",
        "tipo": "Proveedor",
        "chofer": "Carlos Mendoza",
        "producto": "Maíz Amarillo en Grano",
        "peso_kg": 38450,
        "tara_kg": 11200,
        "vigente": True,
        "dias": 28,
        "flujo": "Recepción de Granos (Pesaje 1 Entrada)"
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
        "flujo": "Recepción de Granos (Pesaje 1 Entrada)"
    },
    {
        "placa": "PBA-8899",
        "actor": "Distribuidora del Litoral S.A.",
        "tipo": "Cliente",
        "chofer": "Manuel Peralta",
        "producto": "Arroz Pilado / Procesado",
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
        "flujo": "Recepción de Granos (Pesaje 1 Entrada)"
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

def crear_frame_camara(vehiculo, paso_ocr, tiempo_restante):
    """Genera una imagen simulada de la cámara IP sobre la báscula."""
    # Fondo de cámara de garita/báscula (asfalto/plataforma)
    frame = np.zeros((500, 850, 3), dtype=np.uint8)
    frame[:] = (35, 38, 42) # Gris oscuro industrial

    # Marco de la plataforma de pesaje
    cv2.rectangle(frame, (40, 40), (810, 460), (70, 75, 80), 2)
    cv2.putText(frame, "CAM-01: BASCULA CAMIONERA METTLER TOLEDO IND780 [EN VIVO]", (50, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 220, 255), 2)

    # Dibujar silueta frontal del camión
    cv2.rectangle(frame, (180, 100), (670, 380), (55, 60, 65), -1)
    cv2.rectangle(frame, (180, 100), (670, 380), (100, 110, 120), 2)
    cv2.rectangle(frame, (230, 130), (620, 220), (20, 25, 30), -1) # Parabrisas

    # Placa física del camión
    cv2.rectangle(frame, (330, 280), (520, 340), (240, 240, 240), -1)
    cv2.rectangle(frame, (330, 280), (520, 340), (0, 0, 0), 2)
    cv2.putText(frame, vehiculo["placa"], (345, 325), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (0, 0, 0), 3)

    # Región de Interés (ROI) detectada por IA (Cuadro verde parpadeante)
    if paso_ocr:
        cv2.rectangle(frame, (320, 270), (530, 350), (0, 255, 0), 2)
        cv2.putText(frame, "ROI: PLACA ECUADOR DETECTADA (OCR OK)", (280, 260),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

    # Panel lateral de Telemetría e Inteligencia Artificial
    cv2.rectangle(frame, (50, 390), (800, 450), (20, 20, 20), -1)
    cv2.rectangle(frame, (50, 390), (800, 450), (0, 200, 255), 1)

    tipo_color = (0, 255, 150) if vehiculo["tipo"] == "Proveedor" else (255, 180, 0)
    if vehiculo["tipo"] == "No Registrado":
        tipo_color = (0, 0, 255)

    cv2.putText(frame, f"ACTOR: {vehiculo['actor']} ({vehiculo['tipo']})", (60, 412),
                cv2.FONT_HERSHEY_SIMPLEX, 0.52, tipo_color, 1)
    cv2.putText(frame, f"PRODUCTO: {vehiculo['producto']} | CHOFER: {vehiculo['chofer']}", (60, 432),
                cv2.FONT_HERSHEY_SIMPLEX, 0.48, (220, 220, 220), 1)
    cv2.putText(frame, f"PESO BASCULA: {vehiculo['peso_kg']} kg | TARA: {vehiculo['tara_kg']} kg", (480, 432),
                cv2.FONT_HERSHEY_SIMPLEX, 0.48, (0, 255, 255), 1)

    return frame

def simular_en_tiempo_real():
    print("=" * 80)
    print("  PESAJUSTO - SIMULADOR ALPR EN TIEMPO REAL (VISION ARTIFICIAL)")
    print("=" * 80)

    for idx, v in enumerate(VEHICULOS_SIMULADOS, 1):
        print(f"\n[VEHICULO {idx}/{len(VEHICULOS_SIMULADOS)}] Placa: {v['placa']} -> Ingresando a plataforma de báscula...")
        time.sleep(0.4)
        
        # Generar frame
        frame = crear_frame_camara(v, True, 0)
        
        # Intentar mostrar ventana gráfica si el entorno OpenCV lo soporta
        gui_abierta = False
        try:
            cv2.imshow("PesaJusto - Camara ALPR sobre Bascula [Simulacion en Vivo]", frame)
            cv2.waitKey(800)
            gui_abierta = True
        except Exception:
            pass # Modo headless / terminal

        # Telemetría y decisiones de IA en consola
        print(f"  📷 [VISION ARTIFICIAL]: Cámara sobre báscula enfocando matrícula...")
        print(f"  🔍 [OCR DETECCION]: Placa {v['placa']} validada bajo norma ecuatoriana.")
        print(f"  🏢 [ACTOR / EMPRESA]: {v['actor']} ({v['tipo']})")
        print(f"  🌾 [PRODUCTO]: {v['producto']} | Chofer Habitual: {v['chofer']}")
        print(f"  ⚖️  [TELEMETRIA BASCULA]: Peso Bruto: {v['peso_kg']} kg | Tara Producto: {v['tara_kg']} kg ({v['dias']} días vigentes)")
        print(f"  🚀 [ACCION OPERATIVA]: {v['flujo']}")
        print("  " + "-" * 76)
        time.sleep(0.6)

    if gui_abierta:
        try:
            cv2.destroyAllWindows()
        except Exception:
            pass
    print("\n[OK] Demostración de todos los vehículos completada con éxito.")

if __name__ == "__main__":
    simular_en_tiempo_real()
