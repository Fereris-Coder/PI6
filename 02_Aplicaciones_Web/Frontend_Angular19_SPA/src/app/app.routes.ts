import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permisoGuard } from './core/guards/permiso.guard';
import { AppLayoutComponent } from './layout/app-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      {
        path: 'inicio',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'pesajes',
        canActivate: [permisoGuard],
        data: { modulo: 'pesajes' },
        loadComponent: () => import('./features/pesajes/pesajes.component').then((m) => m.PesajesComponent)
      },
      {
        path: 'pesajes/nuevo',
        canActivate: [permisoGuard],
        data: { modulo: 'pesajes' },
        loadComponent: () =>
          import('./features/pesajes/registrar/registrar-pesaje.component').then((m) => m.RegistrarPesajeComponent)
      },
      {
        path: 'tickets',
        canActivate: [permisoGuard],
        data: { modulo: 'tickets' },
        loadComponent: () => import('./features/tickets/tickets.component').then((m) => m.TicketsComponent)
      },
      {
        path: 'tickets/:numTran',
        canActivate: [permisoGuard],
        data: { modulo: 'tickets' },
        loadComponent: () => import('./features/tickets/ticket-detalle.component').then((m) => m.TicketDetalleComponent)
      },
      {
        path: 'clientes',
        canActivate: [permisoGuard],
        data: { modulo: 'clientes' },
        loadComponent: () => import('./features/clientes/clientes.component').then((m) => m.ClientesComponent)
      },
      {
        path: 'productos',
        canActivate: [permisoGuard],
        data: { modulo: 'productos' },
        loadComponent: () => import('./features/productos/productos.component').then((m) => m.ProductosComponent)
      },
      {
        path: 'vehiculos',
        canActivate: [permisoGuard],
        data: { modulo: 'vehiculos' },
        loadComponent: () => import('./features/vehiculos/vehiculos.component').then((m) => m.VehiculosComponent)
      },
      {
        path: 'basculas',
        canActivate: [permisoGuard],
        data: { modulo: 'basculas' },
        loadComponent: () => import('./features/basculas/basculas.component').then((m) => m.BasculasComponent)
      },
      {
        path: 'usuarios',
        canActivate: [permisoGuard],
        data: { modulo: 'usuarios' },
        loadComponent: () => import('./features/usuarios/usuarios.component').then((m) => m.UsuariosComponent)
      },
      {
        path: 'roles',
        canActivate: [permisoGuard],
        data: { modulo: 'usuarios' },
        loadComponent: () => import('./features/roles/roles.component').then((m) => m.RolesComponent)
      },
      {
        path: 'reportes',
        canActivate: [permisoGuard],
        data: { modulo: 'reportes' },
        loadComponent: () => import('./features/reportes/reportes.component').then((m) => m.ReportesComponent)
      },
      {
        path: 'reportes/pesajes',
        canActivate: [permisoGuard],
        data: { modulo: 'reportes' },
        loadComponent: () =>
          import('./features/reportes/reporte-pesajes/reporte-pesajes.component').then((m) => m.ReportePesajesComponent)
      },
      {
        path: 'configuracion',
        canActivate: [permisoGuard],
        data: { modulo: 'configuracion' },
        loadComponent: () => import('./features/configuracion/configuracion.component').then((m) => m.ConfiguracionComponent)
      },
      {
        path: 'asistente',
        canActivate: [permisoGuard],
        data: { modulo: 'asistente' },
        loadComponent: () => import('./features/asistente/asistente.component').then((m) => m.AsistenteComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
