import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToolbarModule } from 'primeng/toolbar';
import { Rol } from '../../shared/models/entidades.model';
import { MODULOS_DISPONIBLES } from '../../shared/models/modulo.model';
import { RolService } from '../../shared/services/rol.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
    ToggleSwitchModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule
  ],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss'
})
export class RolesComponent implements OnInit {
  readonly modulosDisponibles = MODULOS_DISPONIBLES;

  roles = signal<Rol[]>([]);
  cargando = signal(false);
  mostrarDialogo = signal(false);
  esNuevo = signal(true);
  filtroGlobal = '';

  entidad: Partial<Rol> = {};

  constructor(
    private readonly service: RolService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.listar().subscribe({
      next: (data) => {
        this.roles.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  etiquetasModulos(modulos: string[] | undefined): string {
    if (!modulos || modulos.length === 0) return 'Sin acceso a módulos';
    return modulos.map((clave) => this.modulosDisponibles.find((m) => m.clave === clave)?.etiqueta ?? clave).join(', ');
  }

  nuevo(): void {
    this.entidad = { estado: true, modulos: [] };
    this.esNuevo.set(true);
    this.mostrarDialogo.set(true);
  }

  editar(rol: Rol): void {
    this.entidad = { ...rol, modulos: [...(rol.modulos ?? [])] };
    this.esNuevo.set(false);
    this.mostrarDialogo.set(true);
  }

  moduloSeleccionado(clave: string): boolean {
    return (this.entidad.modulos ?? []).includes(clave);
  }

  alternarModulo(clave: string, marcado: boolean): void {
    const actuales = this.entidad.modulos ?? [];
    this.entidad.modulos = marcado ? [...actuales, clave] : actuales.filter((m) => m !== clave);
  }

  guardar(): void {
    if (!this.entidad.nombre) {
      this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'El nombre del perfil es obligatorio.' });
      return;
    }

    const alGuardar = {
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Perfil guardado correctamente.' });
        this.mostrarDialogo.set(false);
        this.cargar();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el perfil.' })
    };

    if (this.esNuevo()) {
      this.service.crear(this.entidad).subscribe(alGuardar);
    } else {
      this.service.actualizar(this.entidad.id!, this.entidad).subscribe(alGuardar);
    }
  }

  eliminar(rol: Rol): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el perfil "${rol.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.eliminar(rol.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Perfil eliminado.' });
            this.cargar();
          },
          error: () =>
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el perfil. Verifica que no tenga usuarios asignados.'
            })
        });
      }
    });
  }
}
