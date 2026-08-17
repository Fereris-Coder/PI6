export enum EstadoConexion {
  Desconectada = 0,
  Conectando = 1,
  Conectada = 2
}

export interface PesajeReading {
  balanzaId: number;
  peso: number;
  tara: number;
  unidad: string;
  esNeto: boolean;
  esNegativo: boolean;
  fueraDeRango: boolean;
  enMovimiento: boolean;
  ceroNoCapturado: boolean;
  checksumValido?: boolean | null;
  fechaHoraUtc: string;
}

export interface EstadoBalanza {
  id: number;
  nombre: string;
  ubicacion?: string | null;
  ip: string;
  puerto: number;
  estado: EstadoConexion;
  ultimaLectura?: PesajeReading | null;
}
