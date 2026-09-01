import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToolbarModule } from 'primeng/toolbar';
import { Configuracion } from '../../shared/models/entidades.model';
import { ConfiguracionService } from '../../shared/services/configuracion.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule
  ],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.scss'
})
export class ConfiguracionComponent implements OnInit {
  configuraciones = signal<Configuracion[]>([]);
  cargando = signal(false);
  mostrarDialogo = signal(false);
  esNuevo = signal(true);
  mostrarAyuda = signal(true);
  filtroGlobal = '';

  // Referencia de los parámetros que el sistema realmente lee (ver
  // ticket-detalle.component.ts) — la tabla de abajo es de texto libre, así
  // que sin esta leyenda no hay forma de recordar qué claves reconoce el
  // sistema ni qué valores son válidos.
  readonly parametrosConocidos = [
    {
      clave: 'NombreEmpresa',
      valores: 'Cualquier texto',
      descripcion: 'Nombre de la empresa en el encabezado del ticket. Si no existe, se usa "BALANZA CAMIONERA".'
    },
    {
      clave: 'DireccionEmpresa',
      valores: 'Cualquier texto (opcional)',
      descripcion: 'Dirección impresa debajo del nombre en el ticket. Si no existe, no se muestra esa línea.'
    },
    {
      clave: 'RucEmpresa',
      valores: 'Cualquier texto (opcional)',
      descripcion: 'RUC impreso en el ticket. Si no existe, no se muestra esa línea.'
    },
    {
      clave: 'TicketTamano',
      valores: 'MediaCarta · Termica58 · Termica80 · (sin definir = Carta)',
      descripcion: 'Tamaño de papel del ticket al imprimir. "MediaCarta" es para matriciales con papel continuo, "Termica58/80" para impresoras de punto de venta.'
    },
    {
      clave: 'TicketEstilo',
      valores: 'Texto · (sin definir = Grafico)',
      descripcion: '"Texto" quita el QR y los colores (imprime rápido en matriciales). "Grafico" es el diseño completo con QR.'
    }
  ];

  // Sentinel para "no es ninguno de los parámetros conocidos" en el
  // selector — permite seguir guardando parámetros personalizados sin
  // limitar el sistema a la lista de arriba.
  readonly OTRO = '__otro__';

  readonly opcionesParametro = [
    ...this.parametrosConocidos.map((p) => ({ label: p.clave, value: p.clave })),
    { label: 'Otro (personalizado)', value: this.OTRO }
  ];

  private readonly valoresPorParametro: Record<string, { label: string; value: string }[]> = {
    TicketTamano: [
      { label: 'Carta (por defecto)', value: 'Carta' },
      { label: 'Media Carta · 21.6 x 14 cm', value: 'MediaCarta' },
      { label: 'Térmica 58mm', value: 'Termica58' },
      { label: 'Térmica 80mm', value: 'Termica80' }
    ],
    TicketEstilo: [
      { label: 'Gráfico · con QR y colores (por defecto)', value: 'Grafico' },
      { label: 'Texto simple · sin QR, rápido en matriciales', value: 'Texto' }
    ]
  };

  entidad: Partial<Configuracion> = {};

  get parametroDropdown(): string {
    const clave = this.entidad.parametro ?? '';
    const esConocido = this.parametrosConocidos.some((p) => p.clave === clave);
    return esConocido ? clave : this.OTRO;
  }

  set parametroDropdown(valor: string) {
    this.entidad.parametro = valor === this.OTRO ? '' : valor;
    this.entidad.valor = '';
  }

  valoresParaValor(): { label: string; value: string }[] | null {
    const clave = this.entidad.parametro ?? '';
    return this.valoresPorParametro[clave] ?? null;
  }

  constructor(
    private readonly service: ConfiguracionService,
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
        this.configuraciones.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  nuevo(): void {
    this.entidad = { estado: true };
    this.esNuevo.set(true);
    this.mostrarDialogo.set(true);
  }

  editar(config: Configuracion): void {
    this.entidad = { ...config };
    this.esNuevo.set(false);
    this.mostrarDialogo.set(true);
  }

  guardar(): void {
    if (!this.entidad.parametro || !this.entidad.valor) {
      this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Parámetro y valor son obligatorios.' });
      return;
    }

    const alGuardar = {
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Configuración guardada correctamente.' });
        this.mostrarDialogo.set(false);
        this.cargar();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la configuración.' })
    };

    if (this.esNuevo()) {
      this.service.crear(this.entidad).subscribe(alGuardar);
    } else {
      this.service.actualizar(this.entidad.id!, this.entidad).subscribe(alGuardar);
    }
  }

  eliminar(config: Configuracion): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el parámetro "${config.parametro}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.eliminar(config.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Configuración eliminada.' });
            this.cargar();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la configuración.' })
        });
      }
    });
  }
}
