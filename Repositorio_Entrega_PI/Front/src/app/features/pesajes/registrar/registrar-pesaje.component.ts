import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { Cliente, Producto, Vehiculo, VehiculoTaraProducto } from '../../../shared/models/entidades.model';
import { EstadoBalanza, EstadoConexion, PesajeReading } from '../../../shared/models/balanza-live.model';
import { GuardarPesajeDirectoRequest, GuardarPesajeRequest, Pesaje } from '../../../shared/models/pesaje.model';
import { BalanzaLiveService } from '../../../shared/services/balanza-live.service';
import { BalanzaService } from '../../../shared/services/balanza.service';
import { ClienteService } from '../../../shared/services/cliente.service';
import { PesajeService } from '../../../shared/services/pesaje.service';
import { ProductoService } from '../../../shared/services/producto.service';
import { VehiculoService } from '../../../shared/services/vehiculo.service';

export type TipoFlujoOperacion = 'Proveedor' | 'Cliente';
export type PasoOperacion = 'Entrada' | 'Salida';
export type ModoEntradaCliente = 'pesar_vacio' | 'tara_guardada';

@Component({
  selector: 'app-registrar-pesaje',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, SelectModule, AutoCompleteModule, CheckboxModule, InputTextModule, TagModule],
  templateUrl: './registrar-pesaje.component.html',
  styleUrl: './registrar-pesaje.component.scss'
})
export class RegistrarPesajeComponent implements OnInit, OnDestroy {
  readonly EstadoConexion = EstadoConexion;

  basculas = signal<EstadoBalanza[]>([]);
  historial = signal<Map<number, number[]>>(new Map());
  pesajesHoy = signal<Pesaje[]>([]);
  clientes = signal<Cliente[]>([]);
  productos = signal<Producto[]>([]);
  vehiculos = signal<Vehiculo[]>([]);

  // 1. TIPO DE FLUJO: PROVEEDOR (GRANOS) VS CLIENTE (COSECHA)
  tipoFlujo = signal<TipoFlujoOperacion>('Proveedor');

  // 2. MOMENTO DEL PESAJE: ENTRADA VS SALIDA
  pasoOperacion = signal<PasoOperacion>('Entrada');

  // Modo de Entrada para Cliente: Pesar vacío en báscula VS Usar tara registrada para pasar directo a cargar
  modoEntradaCliente = signal<ModoEntradaCliente>('pesar_vacio');

  placaSeleccionada: string | null = null;
  sugerenciasPlaca: string[] = [];

  cliIdSeleccionado: number | null = null;
  proCodigoSeleccionado: number | null = null;
  nombreChofer = '';
  observacion = '';

  numTranSeleccionado: number | null = null;
  usarTaraGuardadaSalida = false;

  balanzaSeleccionadaId = signal<number | null>(null);
  guardando = signal(false);

  private suscripciones: Subscription[] = [];

  readonly balanzaSeleccionada = computed<EstadoBalanza | undefined>(() =>
    this.basculas().find((b) => b.id === this.balanzaSeleccionadaId())
  );

  readonly pesajesAbiertos = computed(() => this.pesajesHoy().filter((p) => !p.fechaHoraOut));

  // TERCEROS FILTRADOS
  readonly tercerosFiltrados = computed(() => {
    const flujo = this.tipoFlujo();
    return this.clientes()
      .filter((c) => c.tipo === flujo)
      .map((c) => ({ id: c.id, etiqueta: `${c.nombre}` }));
  });

  // PRODUCTOS FILTRADOS (PROVEEDOR = GRANOS | CLIENTE = COSECHA)
  readonly productosFiltrados = computed(() => {
    const flujo = this.tipoFlujo();
    return this.productos().filter((p) => p.tipoFlujo === flujo);
  });

  readonly opcionesPesajesAbiertos = computed(() =>
    this.pesajesAbiertos()
      .filter((p) => {
        const cli = this.clientes().find((c) => c.id === p.cliId);
        return !cli || cli.tipo === this.tipoFlujo();
      })
      .map((p) => {
        const vehiculo = this.vehiculos().find((v) => v.placa.toUpperCase() === p.vehPlaca.toUpperCase());
        return {
          numTran: p.numTran,
          etiqueta: `#${p.numTran} · Placa ${p.vehPlaca} · ${this.nombreCliente(p.cliId)}${vehiculo?.taraVigente ? ' (Tara disponible)' : ''}`
        };
      })
  );

  pesoActualBascula(): number | null {
    return this.balanzaSeleccionada()?.ultimaLectura?.peso ?? null;
  }

  pesajeAbiertoSeleccionado(): Pesaje | undefined {
    return this.pesajesHoy().find((p) => p.numTran === this.numTranSeleccionado);
  }

  vehiculoDePesajeAbierto(): Vehiculo | undefined {
    const pesaje = this.pesajeAbiertoSeleccionado();
    if (!pesaje) return undefined;
    return this.vehiculos().find((v) => v.placa.toUpperCase() === pesaje.vehPlaca.toUpperCase());
  }

  puedeUsarTaraGuardadaSalida(): boolean {
    return !!this.vehiculoDePesajeAbierto()?.taraVigente;
  }

  vehiculoDePlacaSeleccionada(): Vehiculo | undefined {
    if (!this.placaSeleccionada) return undefined;
    return this.vehiculos().find((v) => v.placa.toUpperCase() === this.placaSeleccionada!.toUpperCase());
  }

  taraEspecificaProducto(): VehiculoTaraProducto | undefined {
    const veh = this.vehiculoDePlacaSeleccionada();
    const proCod = this.proCodigoSeleccionado;
    if (!veh || !proCod || !veh.tarasPorProducto) return undefined;
    return veh.tarasPorProducto.find((t) => t.proCodigo === proCod && t.taraVigente);
  }

  puedeUsarTaraGuardadaEntrada(): boolean {
    const taraProd = this.taraEspecificaProducto();
    if (taraProd) return true;
    return !!this.vehiculoDePlacaSeleccionada()?.taraVigente;
  }

  private usandoTaraGuardadaAhora(): boolean {
    return this.pasoOperacion() === 'Salida' && this.usarTaraGuardadaSalida && this.puedeUsarTaraGuardadaSalida();
  }

  pesoBrutoResumen(): number | null {
    if (this.tipoFlujo() === 'Proveedor') {
      if (this.pasoOperacion() === 'Entrada') return this.pesoActualBascula();
      return this.pesajeAbiertoSeleccionado()?.pesoBruto ?? null;
    } else {
      // Para CLIENTE: El peso bruto es cuando sale lleno (Pesaje 2)
      if (this.pasoOperacion() === 'Salida') return this.pesoActualBascula();
      return null;
    }
  }

  taraKgParaOperacion(): number | null {
    const taraProd = this.taraEspecificaProducto();
    if (taraProd) return taraProd.taraKg;
    return this.vehiculoDePlacaSeleccionada()?.taraKg ?? null;
  }

  pesoTaraResumen(): number | null {
    if (this.tipoFlujo() === 'Proveedor') {
      if (this.pasoOperacion() === 'Entrada') return null;
      return this.usandoTaraGuardadaAhora() ? (this.taraKgParaOperacion() ?? (this.vehiculoDePesajeAbierto()?.taraKg ?? null)) : this.pesoActualBascula();
    } else {
      // Para CLIENTE: La tara es cuando entra vacío (Pesaje 1) o su tara guardada del producto
      if (this.pasoOperacion() === 'Entrada') {
        return this.modoEntradaCliente() === 'tara_guardada' ? this.taraKgParaOperacion() : this.pesoActualBascula();
      }
      const pesaje = this.pesajeAbiertoSeleccionado();
      return pesaje?.pesoBruto ?? this.taraKgParaOperacion();
    }
  }

  calcularPesoNeto(): number {
    const bruto = this.pesoBrutoResumen() ?? 0;
    const tara = this.pesoTaraResumen() ?? 0;
    if (bruto > 0 && tara > 0) {
      return Math.max(0, bruto - tara);
    }
    return this.pesoActualBascula() ?? 0;
  }

  constructor(
    private readonly balanzaService: BalanzaService,
    private readonly balanzaLive: BalanzaLiveService,
    private readonly pesajeService: PesajeService,
    private readonly clienteService: ClienteService,
    private readonly productoService: ProductoService,
    private readonly vehiculoService: VehiculoService,
    private readonly authService: AuthService,
    private readonly messageService: MessageService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarBasculas();
    this.cargarPesajesAbiertos();
    this.prepararCierreDesdeQueryParam();
  }

  private prepararCierreDesdeQueryParam(): void {
    const numTran = Number(this.route.snapshot.queryParamMap.get('cerrarNumTran'));
    if (!numTran) return;

    this.pasoOperacion.set('Salida');
    this.numTranSeleccionado = numTran;

    this.pesajeService.obtener(numTran).subscribe({
      next: (pesaje) => {
        this.pesajesHoy.update((lista) => (lista.some((p) => p.numTran === pesaje.numTran) ? lista : [...lista, pesaje]));
        const cli = this.clientes().find((c) => c.id === pesaje.cliId);
        if (cli && cli.tipo) {
          this.tipoFlujo.set(cli.tipo as TipoFlujoOperacion);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.suscripciones.forEach((s) => s.unsubscribe());
    this.basculas().forEach((b) => this.balanzaLive.desuscribirse(b.id));
  }

  private cargarCatalogos(): void {
    this.clienteService.listar().subscribe({ next: (data) => this.clientes.set(data) });
    this.productoService.listar().subscribe({ next: (data) => this.productos.set(data) });
    this.vehiculoService.listar().subscribe({ next: (data) => this.vehiculos.set(data) });
  }

  private cargarBasculas(): void {
    this.balanzaService.obtenerEstadoTodas().subscribe({
      next: (data) => {
        this.basculas.set(data);
        data.forEach((b) => this.suscribirseALectura(b.id));
        this.autoSeleccionarBasculaSiUnica();
      }
    });
  }

  private autoSeleccionarBasculaSiUnica(): void {
    const basculas = this.basculas();
    if (basculas.length === 1) {
      this.balanzaSeleccionadaId.set(basculas[0].id);
    }
  }

  seleccionarBascula(id: number): void {
    this.balanzaSeleccionadaId.set(id);
  }

  private suscribirseALectura(balanzaId: number): void {
    this.balanzaLive.suscribirse(balanzaId).catch(() => undefined);

    const sub = this.balanzaLive.lecturasDe(balanzaId).subscribe((lectura: PesajeReading) => {
      this.basculas.update((lista) =>
        lista.map((b) => (b.id === balanzaId ? { ...b, estado: EstadoConexion.Conectada, ultimaLectura: lectura } : b))
      );

      this.historial.update((mapa) => {
        const nuevo = new Map(mapa);
        const serie = [...(nuevo.get(balanzaId) ?? []), lectura.peso].slice(-30);
        nuevo.set(balanzaId, serie);
        return nuevo;
      });
    });

    this.suscripciones.push(sub);
  }

  private cargarPesajesAbiertos(): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    this.pesajeService.listar(hoy, new Date()).subscribe({
      next: (data) => this.pesajesHoy.set(data)
    });
  }

  sparklinePoints(balanzaId: number): string {
    const serie = this.historial().get(balanzaId) ?? [];
    if (serie.length < 2) return '';

    const min = Math.min(...serie);
    const max = Math.max(...serie);
    const rango = max - min || 1;
    const anchoPaso = 300 / (serie.length - 1);

    return serie
      .map((valor, i) => {
        const x = i * anchoPaso;
        const y = 36 - ((valor - min) / rango) * 32;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  nombreCliente(id: number | null): string {
    return this.clientes().find((c) => c.id === id)?.nombre ?? '—';
  }

  nombreProducto(codigo: number | null): string {
    return this.productos().find((p) => p.codigo === codigo)?.nombre ?? '—';
  }

  readonly vehiculosFiltrados = computed(() => {
    const flujo = this.tipoFlujo();
    return this.vehiculos().filter((v) => !v.tipoUso || v.tipoUso === flujo);
  });

  buscarPlaca(evento: AutoCompleteCompleteEvent): void {
    const q = (evento.query ?? '').toLowerCase();
    const flujo = this.tipoFlujo();
    
    // Filtrar estrictamente por tipo (Proveedor vs Cliente)
    let candidatos = this.vehiculos().filter((v) => !v.tipoUso || v.tipoUso === flujo);

    if (flujo === 'Cliente' && this.pasoOperacion() === 'Entrada' && this.modoEntradaCliente() === 'tara_guardada') {
      candidatos = candidatos.filter((v) => v.taraVigente);
    }

    this.sugerenciasPlaca = candidatos.map((v) => v.placa).filter((placa) => placa.toLowerCase().includes(q));
  }

  onPlacaCambio(placa: string | null): void {
    this.placaSeleccionada = placa;
    if (!placa) return;

    const placaNorm = placa.trim().toUpperCase();
    const veh = this.vehiculos().find((v) => v.placa.toUpperCase() === placaNorm);

    if (veh) {
      if (veh.tipoUso) {
        this.tipoFlujo.set(veh.tipoUso as TipoFlujoOperacion);
      }
      if (veh.choferHabitual) {
        this.nombreChofer = veh.choferHabitual;
      }
      if (veh.cliId) {
        this.cliIdSeleccionado = veh.cliId;
      }

      // Auto-seleccionar el producto del catálogo según el tercero/flujo
      const prodsDisponibles = this.productos().filter((p) => p.tipoFlujo === this.tipoFlujo());
      if (prodsDisponibles.length > 0) {
        // Asignar producto afín a la empresa
        if (veh.cliId === 1) this.proCodigoSeleccionado = 10; // Maíz Grano
        else if (veh.cliId === 2) this.proCodigoSeleccionado = 20; // Arroz Grano
        else if (veh.cliId === 3) this.proCodigoSeleccionado = 30; // Soya Grano
        else if (veh.cliId === 4) this.proCodigoSeleccionado = 40; // Arroz Cosecha
        else if (veh.cliId === 5) this.proCodigoSeleccionado = 50; // Cacao Cosecha
        else if (veh.cliId === 6) this.proCodigoSeleccionado = 60; // Soya Cosecha
        else this.proCodigoSeleccionado = prodsDisponibles[0].codigo;
      }

      const clienteNombre = this.nombreCliente(this.cliIdSeleccionado);
      const productoNombre = this.nombreProducto(this.proCodigoSeleccionado);

      this.messageService.add({
        severity: 'info',
        summary: 'Camión Identificado',
        detail: `Chofer: ${this.nombreChofer} | ${clienteNombre} (${productoNombre})`,
        life: 3000
      });
      return;
    }

    const pesajePrevio = this.pesajesHoy().find(
      (p) => p.vehPlaca.toUpperCase() === placaNorm && p.nombreChofer
    );

    if (pesajePrevio) {
      if (pesajePrevio.nombreChofer) this.nombreChofer = pesajePrevio.nombreChofer;
      if (pesajePrevio.cliId) this.cliIdSeleccionado = pesajePrevio.cliId;
      if (pesajePrevio.proCodigo) this.proCodigoSeleccionado = pesajePrevio.proCodigo;
    }
  }

  limpiarCamposCamion(): void {
    this.placaSeleccionada = null;
    this.nombreChofer = '';
    this.cliIdSeleccionado = null;
    this.proCodigoSeleccionado = null;
  }

  onTerceroCambioManualmente(terceroId: number): void {
    if (!terceroId) return;
    if (terceroId === 1) this.proCodigoSeleccionado = 10;      // Maíz Grano
    else if (terceroId === 2) this.proCodigoSeleccionado = 20; // Arroz Grano
    else if (terceroId === 3) this.proCodigoSeleccionado = 30; // Soya Grano
    else if (terceroId === 4) this.proCodigoSeleccionado = 40; // Arroz Cosecha
    else if (terceroId === 5) this.proCodigoSeleccionado = 50; // Cacao Cosecha
    else if (terceroId === 6) this.proCodigoSeleccionado = 60; // Soya Cosecha
  }

  onCambioTransaccion(): void {
    if (!this.puedeUsarTaraGuardadaSalida()) {
      this.usarTaraGuardadaSalida = false;
    }
  }

  seleccionarTipoFlujo(flujo: TipoFlujoOperacion): void {
    this.tipoFlujo.set(flujo);
    this.cliIdSeleccionado = null;
    this.proCodigoSeleccionado = null;
    const disponibles = this.productos().filter((p) => p.tipoFlujo === flujo);
    if (disponibles.length > 0) {
      this.proCodigoSeleccionado = disponibles[0].codigo;
    }
  }

  seleccionarPaso(paso: PasoOperacion): void {
    this.pasoOperacion.set(paso);
    this.limpiar();
  }

  seleccionarModoEntradaCliente(modo: ModoEntradaCliente): void {
    this.modoEntradaCliente.set(modo);
    this.placaSeleccionada = null;
    this.cliIdSeleccionado = null;
    this.proCodigoSeleccionado = null;
    this.nombreChofer = '';
    this.observacion = '';
  }

  limpiar(): void {
    this.placaSeleccionada = null;
    this.cliIdSeleccionado = null;
    this.proCodigoSeleccionado = null;
    this.nombreChofer = '';
    this.observacion = '';
    this.numTranSeleccionado = null;
    this.usarTaraGuardadaSalida = false;
    this.balanzaSeleccionadaId.set(null);
    this.autoSeleccionarBasculaSiUnica();
  }

  volverAlInicio(): void {
    this.router.navigate(['/inicio']);
  }

  imprimirTicket(numTran: number): void {
    window.open(`/tickets/${numTran}`, '_blank');
  }

  guardarPesaje(): void {
    const usuarioId = this.authService.usuario()?.id;
    if (!usuarioId) {
      this.messageService.add({ severity: 'error', summary: 'Sesión inválida', detail: 'Vuelve a iniciar sesión.' });
      return;
    }

    const pesoActual = this.pesoActualBascula();

    // =========================================================================
    // CASO A: FLUJO PROVEEDOR (LLEGA LLENO DE GRANOS -> SALE VACÍO)
    // =========================================================================
    if (this.tipoFlujo() === 'Proveedor') {
      if (this.pasoOperacion() === 'Entrada') {
        // Pesaje 1: Registro de camión lleno
        if (!this.placaSeleccionada || !this.cliIdSeleccionado || !this.proCodigoSeleccionado || !this.balanzaSeleccionadaId() || pesoActual === null) {
          this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Báscula, placa, proveedor y grano son obligatorios.' });
          return;
        }

        const request: GuardarPesajeRequest = {
          vehPlaca: this.placaSeleccionada,
          cliId: this.cliIdSeleccionado,
          proCodigo: this.proCodigoSeleccionado,
          balId: this.balanzaSeleccionadaId()!,
          pesoBruto: pesoActual,
          nombreChofer: this.nombreChofer || null,
          observacion: this.observacion || null,
          usuIngId: usuarioId
        };

        this.guardando.set(true);
        this.pesajeService.registrarEntrada(request).subscribe({
          next: (respuesta) => {
            this.guardando.set(false);
            this.messageService.add({ severity: 'success', summary: 'Entrada Proveedor Registrada', detail: 'Peso bruto de granos guardado.' });
            this.limpiar();
            this.cargarPesajesAbiertos();
            this.imprimirTicket(respuesta.id);
          },
          error: () => {
            this.guardando.set(false);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar la entrada.' });
          }
        });
      } else {
        // Pesaje 2: Salida camión vacío (Tara) y liquidación de granos
        if (!this.numTranSeleccionado) {
          this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Selecciona el camión que está saliendo de la planta.' });
          return;
        }

        const usarTaraGuardada = this.usandoTaraGuardadaAhora();
        if (!usarTaraGuardada && (pesoActual === null || !this.balanzaSeleccionadaId())) {
          this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Selecciona una báscula para registrar el peso tara.' });
          return;
        }

        this.guardando.set(true);
        this.pesajeService.marcarSalida(this.numTranSeleccionado, {
          fechaHoraOut: new Date().toISOString(),
          pesoMedido: usarTaraGuardada ? null : pesoActual,
          usarTaraGuardada,
          usuSalId: usuarioId,
          balIdSalida: usarTaraGuardada ? null : this.balanzaSeleccionadaId()
        }).subscribe({
          next: () => {
            this.guardando.set(false);
            const num = this.numTranSeleccionado!;
            this.messageService.add({ severity: 'success', summary: 'Proveedor Liquidado', detail: `La transacción #${num} se liquidó exitosamente.` });
            this.limpiar();
            this.cargarPesajesAbiertos();
            this.imprimirTicket(num);
          },
          error: () => {
            this.guardando.set(false);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cerrar el pesaje.' });
          }
        });
      }
    }

    // =========================================================================
    // CASO B: FLUJO CLIENTE (LLEGA VACÍO -> SALE LLENO CON COSECHA)
    // =========================================================================
    else {
      if (this.pasoOperacion() === 'Entrada') {
        // Pesaje 1: Registro de entrada del camión vacío (Pesar en báscula O pasar directo con Tara Guardada)
        if (!this.placaSeleccionada) {
          this.messageService.add({ severity: 'warn', summary: 'Placa requerida', detail: 'Selecciona la placa del camión del cliente.' });
          return;
        }

        if (this.modoEntradaCliente() === 'tara_guardada') {
          if (!this.puedeUsarTaraGuardadaEntrada()) {
            this.messageService.add({ severity: 'warn', summary: 'Sin tara guardada', detail: 'Este camión no tiene tara registrada. Debe pesarse en báscula.' });
            return;
          }
          const veh = this.vehiculoDePlacaSeleccionada()!;
          this.messageService.add({
            severity: 'success',
            summary: 'Tara Guardada Aceptada',
            detail: `Camión ${veh.placa} habilitado para cargar con Tara de ${veh.taraKg} kg. Se pesará en la Salida (Pesaje 2).`
          });
          this.pasoOperacion.set('Salida');
        } else {
          // Pesar vacío en báscula
          if (pesoActual === null || !this.balanzaSeleccionadaId() || !this.cliIdSeleccionado || !this.proCodigoSeleccionado) {
            this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Báscula, placa, cliente y cosecha son obligatorios.' });
            return;
          }

          const request: GuardarPesajeRequest = {
            vehPlaca: this.placaSeleccionada,
            cliId: this.cliIdSeleccionado,
            proCodigo: this.proCodigoSeleccionado,
            balId: this.balanzaSeleccionadaId()!,
            pesoBruto: pesoActual, // En entrada cliente se guarda el peso vacío en báscula
            nombreChofer: this.nombreChofer || null,
            observacion: this.observacion || null,
            usuIngId: usuarioId
          };

          this.guardando.set(true);
          this.pesajeService.registrarEntrada(request).subscribe({
            next: (respuesta) => {
              this.guardando.set(false);
              this.messageService.add({ severity: 'success', summary: 'Tara Inicial Registrada', detail: 'Camión vacío registrado. Pase a cargar cosecha.' });
              this.limpiar();
              this.cargarPesajesAbiertos();
              this.imprimirTicket(respuesta.id);
            },
            error: () => {
              this.guardando.set(false);
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar la tara de entrada.' });
            }
          });
        }
      } else {
        // Pesaje 2: Salida con Camión Lleno (Se toma toda la información del despacho y se liquida)
        // Caso B1: Si vino de Pesaje 1 abierto en planta
        if (this.numTranSeleccionado) {
          if (pesoActual === null || !this.balanzaSeleccionadaId()) {
            this.messageService.add({ severity: 'warn', summary: 'Báscula requerida', detail: 'Coloca el camión cargado sobre la báscula para tomar el peso final.' });
            return;
          }

          this.guardando.set(true);
          this.pesajeService.marcarSalida(this.numTranSeleccionado, {
            fechaHoraOut: new Date().toISOString(),
            pesoMedido: pesoActual,
            usarTaraGuardada: false,
            usuSalId: usuarioId,
            balIdSalida: this.balanzaSeleccionadaId()
          }).subscribe({
            next: () => {
              this.guardando.set(false);
              const num = this.numTranSeleccionado!;
              this.messageService.add({ severity: 'success', summary: 'Despacho Completado', detail: `Ticket de cosecha #${num} emitido exitosamente.` });
              this.limpiar();
              this.cargarPesajesAbiertos();
              this.imprimirTicket(num);
            },
            error: () => {
              this.guardando.set(false);
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo emitir el ticket de salida.' });
            }
          });
        } 
        // Caso B2: Despacho Directo en Pesaje 2 (con Tara Guardada previa)
        else {
          if (!this.placaSeleccionada || !this.cliIdSeleccionado || !this.proCodigoSeleccionado || !this.balanzaSeleccionadaId() || pesoActual === null) {
            this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Báscula, placa, cliente y producto son obligatorios para emitir el ticket.' });
            return;
          }

          if (!this.puedeUsarTaraGuardadaEntrada()) {
            this.messageService.add({ severity: 'warn', summary: 'Sin tara guardada', detail: 'Este camión no tiene tara registrada. Debe hacer Pesaje 1 primero.' });
            return;
          }

          const request: GuardarPesajeDirectoRequest = {
            vehPlaca: this.placaSeleccionada,
            cliId: this.cliIdSeleccionado,
            proCodigo: this.proCodigoSeleccionado,
            balId: this.balanzaSeleccionadaId()!,
            pesoBruto: pesoActual,
            nombreChofer: this.nombreChofer || null,
            observacion: this.observacion || null,
            usuIngId: usuarioId
          };

          this.guardando.set(true);
          this.pesajeService.registrarDirecto(request).subscribe({
            next: (respuesta) => {
              this.guardando.set(false);
              this.messageService.add({ severity: 'success', summary: 'Despacho de Cosecha Emitido', detail: 'Ticket emitido con tara registrada exitosamente.' });
              this.limpiar();
              this.cargarPesajesAbiertos();
              this.imprimirTicket(respuesta.id);
            },
            error: () => {
              this.guardando.set(false);
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo emitir el ticket de despacho.' });
            }
          });
        }
      }
    }
  }
}
