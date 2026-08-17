export interface ModuloDisponible {
  clave: string;
  etiqueta: string;
}

// Catálogo fijo de módulos que un perfil puede tener habilitados o no.
// 'Inicio' no está aquí a propósito: siempre es visible para cualquier usuario logueado.
export const MODULOS_DISPONIBLES: ModuloDisponible[] = [
  { clave: 'pesajes', etiqueta: 'Pesajes' },
  { clave: 'tickets', etiqueta: 'Tickets' },
  { clave: 'clientes', etiqueta: 'Clientes' },
  { clave: 'productos', etiqueta: 'Productos' },
  { clave: 'vehiculos', etiqueta: 'Vehículos' },
  { clave: 'basculas', etiqueta: 'Básculas' },
  { clave: 'usuarios', etiqueta: 'Usuarios y Perfiles' },
  { clave: 'reportes', etiqueta: 'Reportes' },
  { clave: 'configuracion', etiqueta: 'Configuración' },
  { clave: 'asistente', etiqueta: 'Asistente IA' }
];
