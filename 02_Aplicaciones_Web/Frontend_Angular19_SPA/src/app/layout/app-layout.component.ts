import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  modulo?: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ButtonModule, AvatarModule, BadgeModule, MenuModule],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss'
})
export class AppLayoutComponent {
  private readonly todosLosNavItems: NavItem[] = [
    { label: 'Inicio', icon: 'pi pi-home', route: '/inicio' },
    { label: 'Pesajes', icon: 'pi pi-list-check', route: '/pesajes', modulo: 'pesajes' },
    { label: 'Tickets', icon: 'pi pi-receipt', route: '/tickets', modulo: 'tickets' },
    { label: 'Clientes', icon: 'pi pi-users', route: '/clientes', modulo: 'clientes' },
    { label: 'Productos', icon: 'pi pi-box', route: '/productos', modulo: 'productos' },
    { label: 'Vehículos', icon: 'pi pi-truck', route: '/vehiculos', modulo: 'vehiculos' },
    { label: 'Básculas', icon: 'pi pi-gauge', route: '/basculas', modulo: 'basculas' },
    { label: 'Usuarios', icon: 'pi pi-user', route: '/usuarios', modulo: 'usuarios' },
    { label: 'Perfiles', icon: 'pi pi-shield', route: '/roles', modulo: 'usuarios' },
    { label: 'Reportes', icon: 'pi pi-chart-bar', route: '/reportes', modulo: 'reportes' },
    { label: 'Configuración', icon: 'pi pi-cog', route: '/configuracion', modulo: 'configuracion' },
    { label: 'Asistente IA', icon: 'pi pi-sparkles', route: '/asistente', modulo: 'asistente' }
  ];

  // 'Inicio' (sin modulo) siempre queda visible; el resto depende de los
  // módulos habilitados en el perfil del usuario logueado.
  readonly navItems = computed(() => this.todosLosNavItems.filter((item) => !item.modulo || this.auth.tieneModulo(item.modulo)));

  readonly usuario = computed(() => this.auth.usuario());

  readonly menuUsuario: MenuItem[] = [
    { label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: () => this.cerrarSesion() }
  ];

  readonly fechaActual = new Date();

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  cerrarSesion(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
