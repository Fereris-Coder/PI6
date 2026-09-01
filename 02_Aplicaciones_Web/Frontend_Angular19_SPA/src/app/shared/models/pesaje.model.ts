export interface Pesaje {
  numTran: number;
  fechaHoraIn: string;
  fechaHoraOut?: string | null;
  duracionMin?: number | null;
  pesoBruto: number;
  pesoTara: number;
  pesoNeto: number;
  pesoOrigen?: number | null;
  mermaKg?: number | null;
  mermaPct?: number | null;
  numBins?: number | null;
  numGavetas?: number | null;
  loteTraza?: string | null;
  guiaRemision?: string | null;
  orden?: string | null;
  observacion?: string | null;
  nombreChofer?: string | null;
  selloDigitalHash?: string | null;
  estadoViaje?: string;
  estado: boolean;
  vehPlaca: string;
  cliId: number;
  proCodigo: number;
  balId: number;
  balIdSalida?: number | null;
  usuIngId: number;
  usuSalId?: number | null;
  tipoOperacion: 'Descarga' | 'Carga';
}

export interface GuardarPesajeRequest {
  vehPlaca: string;
  cliId: number;
  proCodigo: number;
  balId: number;
  pesoBruto: number;
  nombreChofer?: string | null;
  guiaRemision?: string | null;
  orden?: string | null;
  observacion?: string | null;
  usuIngId: number;
}

// Registro en un solo paso: el vehículo ya tiene tara vigente guardada, así que no
// hubo una entrada previa. Se captura el tercero/chofer/producto y el único pesaje
// (bruto en vivo, camión ya cargado) y el pesaje queda cerrado de inmediato.
export interface GuardarPesajeDirectoRequest {
  vehPlaca: string;
  cliId: number;
  proCodigo: number;
  balId: number;
  pesoBruto: number;
  nombreChofer?: string | null;
  observacion?: string | null;
  usuIngId: number;
}

export interface PesajeSalidaRequest {
  fechaHoraOut: string;
  pesoMedido?: number | null;
  usarTaraGuardada: boolean;
  usuSalId?: number | null;
  balIdSalida?: number | null;
}

// Respuesta cruda de GET /api/pesajes/resumen/hoy: las columnas vienen tal cual
// de SQL (snake_case con prefijo), no en camelCase, porque el backend serializa
// filas dynamic/Dapper sin pasar por la política de camelCase de System.Text.Json.
export interface ResumenPesajeHoy {
  pes_NumTran: number;
  pes_FechaHoraIn: string;
  veh_Placa: string;
  pes_NombreChofer?: string | null;
  cli_Nombre: string;
  pro_Nombre: string;
  pes_PesoNeto: number;
}
