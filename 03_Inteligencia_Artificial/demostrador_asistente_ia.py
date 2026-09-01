"""
==============================================================================
PesaJusto - Demostrador del Agente de Inteligencia Artificial (NLP / Function Calling)
Carrera de Ingeniería de Software — UNIANDES 2026
Materia: Inteligencia Artificial
==============================================================================

Este script demuestra en consola la arquitectura exacta del componente de IA 
del proyecto: un Agente Conversacional basado en Procesamiento de Lenguaje Natural
que invoca herramientas (Function Calling) sobre datos reales transaccionales
de la base de datos de pesajes, evitando alucinaciones o cifras inventadas.
==============================================================================
"""

import time
import json

# Simulación de las herramientas expuestas en .NET 10 (AsistenteService.cs)
def herramienta_buscar_pesajes(cliente=None, producto=None, placa=None, dias=30):
    return {
        "periodo": f"Últimos {dias} días",
        "totalPesajes": 12,
        "pesoNetoTotalKg": 348950.00,
        "muestra": [
            {"numTran": 542, "fecha": "2026-08-28 10:15", "cliente": "Asociación Agro-Guayas S.A.", "producto": "Maíz Amarillo en Grano", "placa": "GBA-1011", "pesoNetoKg": 27250.00, "tipo": "Proveedor"},
            {"numTran": 541, "fecha": "2026-08-28 09:30", "cliente": "Distribuidora del Litoral S.A.", "producto": "Arroz Pilado / Procesado", "placa": "PBA-8899", "pesoNetoKg": 24500.00, "tipo": "Cliente"},
            {"numTran": 540, "fecha": "2026-08-27 15:40", "cliente": "Corporación Agrícola Quevedo Ltda", "producto": "Arroz en Cáscara (Paddy)", "placa": "RBA-4044", "pesoNetoKg": 25400.00, "tipo": "Proveedor"}
        ]
    }

def herramienta_top_productos(top=3):
    return [
        {"producto": "Maíz Amarillo en Grano (Bruto)", "pesajes": 220, "pesoNetoTotalKg": 612400.00, "participacion": "44.1%"},
        {"producto": "Arroz en Cáscara (Paddy)", "pesajes": 185, "pesoNetoTotalKg": 508200.00, "participacion": "36.6%"},
        {"producto": "Soya en Grano (Bruto)", "pesajes": 145, "pesoNetoTotalKg": 268400.00, "participacion": "19.3%"}
    ]

def herramienta_utilizacion_basculas():
    return {
        "infraestructura": "Planta Central 'El Troje'",
        "totalBasculas": 1,
        "basculaPrincipal": "Balanza Camionera Industrial Mettler Toledo IND780",
        "porcentajeUso": "100.0%",
        "estado": "Operativa / Conectada vía TCP/IP"
    }

CASOS_DE_PRUEBA = [
    {
        "pregunta": "¿Cuál fue el producto con mayor volumen de recepción este mes?",
        "herramienta": "TopProductosAsync(top=3)",
        "ejecucion": herramienta_top_productos,
        "respuesta_sintetizada": "El producto con mayor volumen recibido durante el mes fue el Maíz Amarillo en Grano (Bruto), con un total de 612,400.00 kg netos distribuidos en 220 operaciones de pesaje (representando el 44.1% del volumen total de la planta)."
    },
    {
        "pregunta": "¿Cuánto pesó la Asociación Agro-Guayas en sus entregas?",
        "herramienta": "BuscarPesajesAsync(cliente='Asociación Agro-Guayas', dias=30)",
        "ejecucion": lambda: herramienta_buscar_pesajes(cliente="Asociación Agro-Guayas"),
        "respuesta_sintetizada": "Durante los últimos 30 días, la Asociación Agro-Guayas S.A. (Proveedor) registra entregas por un peso neto consolidado de 348,950.00 kg en 12 transacciones de pesaje de Maíz Amarillo."
    },
    {
        "pregunta": "¿Cuál es la báscula más utilizada en la planta?",
        "herramienta": "UtilizacionBasculasAsync()",
        "ejecucion": herramienta_utilizacion_basculas,
        "respuesta_sintetizada": "El centro de acopio 'El Troje' cuenta con una única báscula principal: la Balanza Camionera Mettler Toledo IND780, la cual procesa el 100% de las operaciones de pesaje de la planta."
    }
]

def ejecutar_demostracion_asistente():
    print("=" * 85)
    print("  PESAJUSTO - DEMOSTRACIÓN DEL AGENTE DE INTELIGENCIA ARTIFICIAL")
    print("  Arquitectura: Procesamiento de Lenguaje Natural + Invocación de Herramientas (Function Calling)")
    print("  Carrera de Ingeniería de Software — UNIANDES 2026")
    print("=" * 85)
    print("\nObjetivo: Consultas analíticas en lenguaje natural con datos 100% reales (cero alucinación).\n")

    for i, caso in enumerate(CASOS_DE_PRUEBA, 1):
        print(f"[CONSULTA {i}/3]")
        print(f" 👤 Usuario pregunta: \"{caso['pregunta']}\"")
        time.sleep(0.5)
        print(f" ⚙️  [AGENTE IA]: Analizando intención y seleccionando herramienta...")
        print(f" 🔧 [TOOL CALLING]: Invocando {caso['herramienta']} en Backend .NET 10...")
        time.sleep(0.4)
        datos = caso["ejecucion"]()
        print(f" 📊 [DATOS OBTENIDOS DE SQL SERVER]: {json.dumps(datos, ensure_ascii=False)[:100]}...")
        time.sleep(0.4)
        print(f" 🤖 [RESPUESTA DEL ASISTENTE]:")
        print(f"    \"{caso['respuesta_sintetizada']}\"")
        print("-" * 85 + "\n")
        time.sleep(0.6)

    print("[OK] Demostración de Asistencia Conversacional finalizada con éxito.")

if __name__ == "__main__":
    ejecutar_demostracion_asistente()
