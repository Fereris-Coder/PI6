# ==============================================================================
# DEMOSTRADOR Y SIMULADOR DE INTELIGENCIA ARTIFICIAL (ALPR SOBRE BASCULA CAMIONERA)
# Proyecto Integrador 6to Semestre - UNIANDES 2026
# ==============================================================================
# Cámara centralizada instalada directamente sobre la plataforma de pesaje
# para evitar cruce de información y vincular imagen + peso + tara en tiempo real.
# ==============================================================================

import time
import json
import os

vehiculos_simulados = [
    {
        "placa": "GBA-1011",
        "actor": "Asociacion Agro-Guayas S.A.",
        "tipo": "Proveedor",
        "chofer": "Carlos Mendoza",
        "producto": "Maiz Grano",
        "peso_bruto_kg": 38450,
        "tara_registrada_kg": 11200,
        "tara_vigente": True,
        "dias_vigencia": 28,
        "operacion": "Pesaje 1 (Entrada con Carga Completa)"
    },
    {
        "placa": "RBA-4044",
        "actor": "Corporacion Agricola Quevedo Ltda",
        "tipo": "Proveedor",
        "chofer": "Jorge Zambrano",
        "producto": "Arroz Grano",
        "peso_bruto_kg": 36100,
        "tara_registrada_kg": 10700,
        "tara_vigente": True,
        "dias_vigencia": 15,
        "operacion": "Pesaje 1 (Entrada con Carga Completa)"
    },
    {
        "placa": "PBA-8899",
        "actor": "Distribuidora del Litoral S.A.",
        "tipo": "Cliente",
        "chofer": "Manuel Peralta",
        "producto": "Arroz Cosecha",
        "peso_bruto_kg": 10500,
        "tara_registrada_kg": 10500,
        "tara_vigente": True,
        "dias_vigencia": 22,
        "operacion": "Pesaje 1 (Entrada Vacio / Tara de Cosecha Guardada)"
    },
    {
        "placa": "GBA-5566",
        "actor": "Comercial Bananera Guayaquil",
        "tipo": "Cliente",
        "chofer": "Esteban Ronquillo",
        "producto": "Maíz Seco / Procesado (Comercial)",
        "peso_bruto_kg": 11080,
        "tara_registrada_kg": 11080,
        "tara_vigente": True,
        "dias_vigencia": 30,
        "operacion": "Pesaje 1 (Entrada Vacio / Tara de Maiz Guardada)"
    },
    {
        "placa": "XYZ-9999",
        "actor": "Transportes del Norte Cia",
        "tipo": "Proveedor",
        "chofer": "Chofer no enrolado",
        "producto": "Soya Grano",
        "peso_bruto_kg": 34800,
        "tara_registrada_kg": 0,
        "tara_vigente": False,
        "dias_vigencia": 0,
        "operacion": "Vehiculo Nuevo - Requiere registro de chofer y tara manual"
    }
]

def ejecutar_demostracion_bascula():
    print("=" * 85)
    print("  PESAJUSTO - RECONOCIMIENTO ALPR CENTRALIZADO SOBRE BASCULA INDUSTRIAL")
    print("  Carrera de Ingenieria de Software - UNIANDES 2026")
    print("=" * 85)
    print("\nArquitectura: Camara cenital/frontal fija sobre la plataforma de la bascula.")
    print("Ventaja: Cero desfases temporales y asociacion directa placa <-> peso en celda de carga.\n")
    
    for i, v in enumerate(vehiculos_simulados, 1):
        print(f"\n[EVENTO {i}/5] Camion ingresando a plataforma de la Balanza Mettler Toledo IND780...")
        time.sleep(0.5)
        print(f" -> 1. Camara sobre bascula captura frame del camion posicionado en la plataforma")
        print(f" -> 2. Vision Artificial (OpenCV + OCR): Deteccion de placa [ {v['placa']} ]")
        print(f" -> 3. Consulta automatica a Backend API (.NET 10) y Base de Datos SQL Server...")
        time.sleep(0.4)
        
        print(f"\n [DATOS AUTOCOMPLETADOS EN LA INTERFAZ PARA EL OPERARIO]:")
        print(f"   • Placa Detectada:     {v['placa']}")
        print(f"   • Tipo de Operacion:   {v['tipo']} ({v['actor']})")
        print(f"   • Chofer Habitual:     {v['chofer']}")
        print(f"   • Producto Transportado: {v['producto']}")
        print(f"   • Peso Capturado Bascula: {v['peso_bruto_kg']} kg")
        if v['tara_vigente']:
            print(f"   • Tara por Producto:   {v['tara_registrada_kg']} kg (Vigente: {v['dias_vigencia']} dias restantes)")
            print(f"   • Estado Operativo:    [AUTORIZADO] El operario constata en pantalla y confirma pesaje con 1 clic.")
        else:
            print(f"   • Tara por Producto:   SIN TARA PREVIA O VENCIDA")
            print(f"   • Estado Operativo:    [REQUERIDO] El operario debe proceder al retaraje del camion vacio.")
            
        print("-" * 85)
        time.sleep(0.5)
        
    print("\n[OK] Demostracion de Reconocimiento Centralizado sobre Bascula finalizada con exito.\n")

if __name__ == "__main__":
    ejecutar_demostracion_bascula()
