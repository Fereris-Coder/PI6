export interface Cliente {
  id: number;
  identificacion: string;
  nombre: string;
  direccion?: string | null;
  correo?: string | null;
  tipo: 'Cliente' | 'Proveedor' | 'Transportista';
  estado: boolean;
}

export interface Producto {
  codigo: number;
  nombre: string;
  precioBase?: number | null;
  pesoPorSaco?: number | null;
  tipoFlujo?: 'Proveedor' | 'Cliente';
  toleranciaMermaPct?: number;
  estado: boolean;
}

export interface VehiculoTaraProducto {
  id: number;
  vehPlaca: string;
  proCodigo: number;
  productoNombre?: string | null;
  taraKg: number;
  taraFecha: string;
  vigenciaDias: number;
  diasRestantes: number;
  taraVigente: boolean;
  estado: boolean;
}

export interface Vehiculo {
  placa: string;
  marca?: string | null;
  modelo?: string | null;
  numeroEjes?: number;
  tipoConfiguracion?: string;
  capacidadToneladas?: number | null;
  taraKg?: number | null;
  taraFecha?: string | null;
  taraVigenciaDias?: number | null;
  taraVigente: boolean;
  tipoUso?: 'Proveedor' | 'Cliente';
  cliId?: number | null;
  choferHabitual?: string | null;
  tarasPorProducto?: VehiculoTaraProducto[];
  estado: boolean;
}

export interface Balanza {
  id: number;
  descripcion: string;
  ip: string;
  puerto: number;
  ubicacion?: string | null;
  estado: boolean;
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string | null;
  modulos: string[];
  estado: boolean;
}

export interface Usuario {
  id: number;
  nombreUsuario: string;
  nombreCompleto: string;
  passwordHash: string;
  correo?: string | null;
  turno?: string | null;
  rolId: number;
  estado: boolean;
}

export interface Configuracion {
  id: number;
  parametro: string;
  valor: string;
  estado: boolean;
}
