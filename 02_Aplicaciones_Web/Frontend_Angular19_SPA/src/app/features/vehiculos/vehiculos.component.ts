import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToolbarModule } from 'primeng/toolbar';
import { Subscription } from 'rxjs';
import { Cliente, Producto, Vehiculo, VehiculoTaraProducto } from '../../shared/models/entidades.model';
import { EstadoBalanza, EstadoConexion, PesajeReading } from '../../shared/models/balanza-live.model';
import { BalanzaLiveService } from '../../shared/services/balanza-live.service';
import { BalanzaService } from '../../shared/services/balanza.service';
import { ClienteService } from '../../shared/services/cliente.service';
import { ProductoService } from '../../shared/services/producto.service';
import { VehiculoService } from '../../shared/services/vehiculo.service';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TagModule,
    ToggleSwitchModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule
  ],
  templateUrl: './vehiculos.component.html',
  styleUrl: './vehiculos.component.scss'
})
export class VehiculosComponent implements OnInit, OnDestroy {
  readonly EstadoConexion = EstadoConexion;

  vehiculos = signal<Vehiculo[]>([]);
  clientes = signal<Cliente[]>([]);
  productos = signal<Producto[]>([]);

  cargando = signal(false);
  mostrarDialogo = signal(false);
  esNuevo = signal(true);
  filtroGlobal = '';

  entidad: Partial<Vehiculo> = {};

  opcionesConfigMtop = [
    '2S - Camión 2 Ejes (18T)',
    '3S - Camión 3 Ejes (27T)',
    '4S - Camión 4 Ejes (32T)',
    '3S2 - Tráiler 5 Ejes (42T)',
    '3S3 - Tráiler 6 Ejes (48T)'
  ];

  opcionesTipoUso = [
    { label: '📥 Proveedor (Recepción de Granos)', value: 'Proveedor' },
    { label: '📤 Cliente (Despacho de Cosecha)', value: 'Cliente' }
  ];

  // Diálogo: "Gestionar Taras por Producto"
  mostrarDialogoTaras = signal(false);
  vehiculoSeleccionadoParaTaras: Vehiculo | null = null;
  tarasDelVehiculo = signal<VehiculoTaraProducto[]>([]);
  
  // Formulario nueva tara por producto
  nuevoProCodigo: number | null = null;
  nuevoTaraKg: number | null = null;
  nuevaVigenciaDias: number = 30;
  guardandoTaraProducto = signal(false);

  // Básculas en vivo
  basculas = signal<EstadoBalanza[]>([]);
  basculaSeleccionadaId: number | null = null;

  private suscripciones: Subscription[] = [];

  readonly clientesFiltradosPorUso = computed(() => {
    const tipo = this.entidad.tipoUso;
    if (!tipo) return this.clientes();
    return this.clientes().filter((c) => c.tipo === tipo);
  });

  readonly basculaSeleccionada = computed<EstadoBalanza | undefined>(() =>
    this.basculas().find((b) => b.id === this.basculaSeleccionadaId)
  );

  readonly productosDisponiblesParaVehiculo = computed(() => {
    if (!this.vehiculoSeleccionadoParaTaras) return this.productos();
    const tipo = this.vehiculoSeleccionadoParaTaras.tipoUso;
    return this.productos().filter((p) => !tipo || p.tipoFlujo === tipo);
  });

  constructor(
    private readonly service: VehiculoService,
    private readonly clienteService: ClienteService,
    private readonly productoService: ProductoService,
    private readonly balanzaService: BalanzaService,
    private readonly balanzaLive: BalanzaLiveService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.cargarCatalogos();
  }

  ngOnDestroy(): void {
    this.suscripciones.forEach((s) => s.unsubscribe());
    this.basculas().forEach((b) => this.balanzaLive.desuscribirse(b.id));
  }

  cargar(): void {
    this.cargando.set(true);
    this.service.listar().subscribe({
      next: (data) => {
        this.vehiculos.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  private cargarCatalogos(): void {
    this.clienteService.listar().subscribe({ next: (data) => this.clientes.set(data) });
    this.productoService.listar().subscribe({ next: (data) => this.productos.set(data) });
  }

  nuevo(): void {
    this.entidad = { 
      estado: true, 
      numeroEjes: 3, 
      tipoConfiguracion: '3S - Camión 3 Ejes (27T)', 
      capacidadToneladas: 28.00,
      tipoUso: 'Proveedor' 
    };
    this.esNuevo.set(true);
    this.mostrarDialogo.set(true);
  }

  editar(vehiculo: Vehiculo): void {
    this.entidad = { ...vehiculo };
    this.esNuevo.set(false);
    this.mostrarDialogo.set(true);
  }

  guardar(): void {
    if (!this.entidad.placa) {
      this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'La placa es obligatoria.' });
      return;
    }

    const alGuardar = {
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Vehículo guardado correctamente.' });
        this.mostrarDialogo.set(false);
        this.cargar();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el vehículo.' })
    };

    if (this.esNuevo()) {
      this.service.crear(this.entidad as Vehiculo).subscribe(alGuardar);
    } else {
      this.service.actualizar(this.entidad.placa!, this.entidad as Vehiculo).subscribe(alGuardar);
    }
  }

  eliminar(vehiculo: Vehiculo): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el vehículo "${vehiculo.placa}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.eliminar(vehiculo.placa).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Vehículo eliminado.' });
            this.cargar();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el vehículo.' })
        });
      }
    });
  }

  abrirDialogoTarasPorProducto(vehiculo: Vehiculo): void {
    this.vehiculoSeleccionadoParaTaras = vehiculo;
    this.nuevoProCodigo = null;
    this.nuevoTaraKg = null;
    this.nuevaVigenciaDias = 30;
    this.mostrarDialogoTaras.set(true);

    this.cargarTarasDeVehiculo(vehiculo.placa);
    this.iniciarBasculas();
  }

  private cargarTarasDeVehiculo(placa: string): void {
    this.service.listarTarasPorProducto(placa).subscribe({
      next: (taras) => {
        this.tarasDelVehiculo.set(taras);
      }
    });
  }

  private iniciarBasculas(): void {
    if (this.basculas().length === 0) {
      this.balanzaService.obtenerEstadoTodas().subscribe({
        next: (data) => {
          this.basculas.set(data);
          data.forEach((b) => this.suscribirseALectura(b.id));
          if (data.length === 1) this.basculaSeleccionadaId = data[0].id;
        }
      });
    } else if (this.basculas().length === 1) {
      this.basculaSeleccionadaId = this.basculas()[0].id;
    }
  }

  private suscribirseALectura(balanzaId: number): void {
    this.balanzaLive.suscribirse(balanzaId).catch(() => undefined);
    const sub = this.balanzaLive.lecturasDe(balanzaId).subscribe((lectura: PesajeReading) => {
      this.basculas.update((lista) =>
        lista.map((b) => (b.id === balanzaId ? { ...b, estado: EstadoConexion.Conectada, ultimaLectura: lectura } : b))
      );
    });
    this.suscripciones.push(sub);
  }

  pesoActualBascula(): number | null {
    return this.basculaSeleccionada()?.ultimaLectura?.peso ?? null;
  }

  copiarPesoDeBascula(): void {
    const p = this.pesoActualBascula();
    if (p && p > 0) {
      this.nuevoTaraKg = p;
    } else {
      this.messageService.add({ severity: 'warn', summary: 'Báscula sin peso', detail: 'La báscula seleccionada marca 0 kg.' });
    }
  }

  guardarTaraProducto(): void {
    if (!this.vehiculoSeleccionadoParaTaras || !this.nuevoProCodigo || !this.nuevoTaraKg || this.nuevoTaraKg <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Selecciona el producto y un peso de tara mayor a cero.' });
      return;
    }

    this.guardandoTaraProducto.set(true);
    this.service.guardarTaraProducto(
      this.vehiculoSeleccionadoParaTaras.placa,
      this.nuevoProCodigo,
      this.nuevoTaraKg,
      this.nuevaVigenciaDias || 30
    ).subscribe({
      next: () => {
        this.guardandoTaraProducto.set(false);
        this.messageService.add({ severity: 'success', summary: 'Tara Guardada', detail: `Tara asignada al producto correctamente.` });
        this.nuevoProCodigo = null;
        this.nuevoTaraKg = null;
        this.cargarTarasDeVehiculo(this.vehiculoSeleccionadoParaTaras!.placa);
        this.cargar();
      },
      error: () => {
        this.guardandoTaraProducto.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la tara por producto.' });
      }
    });
  }

  nombreTercero(cliId?: number | null): string {
    if (!cliId) return '—';
    return this.clientes().find((c) => c.id === cliId)?.nombre ?? '—';
  }
}
