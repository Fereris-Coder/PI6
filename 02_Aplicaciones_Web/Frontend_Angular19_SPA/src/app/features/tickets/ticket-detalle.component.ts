import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { toDataURL } from 'qrcode';
import { Balanza, Cliente, Configuracion, Producto, Usuario, Vehiculo } from '../../shared/models/entidades.model';
import { Pesaje } from '../../shared/models/pesaje.model';
import { BalanzaService } from '../../shared/services/balanza.service';
import { ClienteService } from '../../shared/services/cliente.service';
import { ConfiguracionService } from '../../shared/services/configuracion.service';
import { PesajeService } from '../../shared/services/pesaje.service';
import { ProductoService } from '../../shared/services/producto.service';
import { UsuarioService } from '../../shared/services/usuario.service';
import { VehiculoService } from '../../shared/services/vehiculo.service';

const PAGINAS_POR_TAMANO: Record<string, string> = {
  MediaCarta: '@page { size: 21.6cm 14cm; margin: 0.6cm; }',
  Termica58: '@page { size: 58mm auto; margin: 2mm; }',
  Termica80: '@page { size: 80mm auto; margin: 3mm; }',
  Carta: '@page { margin: 1.2cm; }'
};

@Component({
  selector: 'app-ticket-detalle',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterLink],
  templateUrl: './ticket-detalle.component.html',
  styleUrl: './ticket-detalle.component.scss'
})
export class TicketDetalleComponent implements OnInit, OnDestroy {
  pesaje = signal<Pesaje | null>(null);
  soloIngreso = signal(false);
  cliente = signal<Cliente | null>(null);
  producto = signal<Producto | null>(null);
  vehiculo = signal<Vehiculo | null>(null);
  basculas = signal<Balanza[]>([]);
  usuarios = signal<Usuario[]>([]);
  configuraciones = signal<Configuracion[]>([]);
  qrDataUrl = signal<string | null>(null);

  private estiloPagina: HTMLStyleElement | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly pesajeService: PesajeService,
    private readonly clienteService: ClienteService,
    private readonly productoService: ProductoService,
    private readonly vehiculoService: VehiculoService,
    private readonly basculaService: BalanzaService,
    private readonly usuarioService: UsuarioService,
    private readonly configuracionService: ConfiguracionService
  ) {}

  ngOnInit(): void {
    const numTran = Number(this.route.snapshot.paramMap.get('numTran'));
    this.soloIngreso.set(this.route.snapshot.queryParamMap.get('vista') === 'ingreso');

    this.basculaService.listar().subscribe({ next: (data) => this.basculas.set(data) });
    this.usuarioService.listar().subscribe({ next: (data) => this.usuarios.set(data) });
    this.configuracionService.listar().subscribe({
      next: (data) => {
        this.configuraciones.set(data);
        this.aplicarTamanoPagina();
      }
    });

    this.pesajeService.obtener(numTran).subscribe({
      next: (pesaje) => {
        this.pesaje.set(pesaje);
        this.productoService.obtener(pesaje.proCodigo).subscribe({ next: (p) => this.producto.set(p) });
        this.vehiculoService.obtener(pesaje.vehPlaca).subscribe({ next: (v) => this.vehiculo.set(v) });
        this.clienteService.obtener(pesaje.cliId).subscribe({ next: (c) => this.cliente.set(c) });
        this.generarQr(pesaje.numTran);
      },
      error: () => this.router.navigate(['/tickets'])
    });
  }

  private generarQr(numTran: number): void {
    const url = `${window.location.origin}/tickets/${numTran}`;
    toDataURL(url, { width: 96, margin: 1 })
      .then((dataUrl) => this.qrDataUrl.set(dataUrl))
      .catch(() => this.qrDataUrl.set(null));
  }

  etiquetaTercero(): string {
    return this.cliente()?.tipo ?? 'Cliente';
  }

  nombreEmpresa(): string {
    return this.valorConfiguracion('NombreEmpresa') ?? 'BALANZA CAMIONERA';
  }

  direccionEmpresa(): string | null {
    return this.valorConfiguracion('DireccionEmpresa');
  }

  rucEmpresa(): string | null {
    return this.valorConfiguracion('RucEmpresa');
  }

  private valorConfiguracion(parametro: string): string | null {
    return this.configuraciones().find((c) => c.parametro === parametro)?.valor ?? null;
  }

  // Formato de impresión configurable desde Configuración (parámetros "TicketTamano"
  // y "TicketEstilo"), pensado para que un mismo ticket sirva tanto a una impresora
  // normal como a una térmica de punto de venta o a una matricial con papel continuo.
  // Sin configurar, se comporta igual que antes (Carta + Gráfico).
  tamanoTicket(): 'MediaCarta' | 'Carta' | 'Termica58' | 'Termica80' {
    const valor = this.valorConfiguracion('TicketTamano');
    if (valor === 'MediaCarta' || valor === 'Termica58' || valor === 'Termica80') return valor;
    return 'Carta';
  }

  estiloTicket(): 'Grafico' | 'Texto' {
    return this.valorConfiguracion('TicketEstilo') === 'Texto' ? 'Texto' : 'Grafico';
  }

  mostrarQr(): boolean {
    return this.estiloTicket() !== 'Texto';
  }

  // El navegador no aplica de forma confiable un @page con nombre asignado
  // desde una clase hija (se probó y Chrome ignora el tamaño), así que el
  // único @page del documento se inyecta aquí, en tiempo de ejecución, según
  // el tamaño configurado.
  private aplicarTamanoPagina(): void {
    if (!this.estiloPagina) {
      this.estiloPagina = document.createElement('style');
      document.head.appendChild(this.estiloPagina);
    }
    this.estiloPagina.textContent = PAGINAS_POR_TAMANO[this.tamanoTicket()] ?? PAGINAS_POR_TAMANO['Carta'];
  }

  ngOnDestroy(): void {
    this.estiloPagina?.remove();
  }

  nombreBascula(balId: number | null | undefined): string {
    if (!balId) return '—';
    return this.basculas().find((b) => b.id === balId)?.descripcion ?? '—';
  }

  nombreOperador(usuId: number | null | undefined): string {
    if (!usuId) return '—';
    return this.usuarios().find((u) => u.id === usuId)?.nombreCompleto ?? '—';
  }

  tiempoEnPatio(): string {
    const minutos = this.pesaje()?.duracionMin;
    if (minutos === null || minutos === undefined) return '—';
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return horas > 0 ? `${horas} h ${resto} min` : `${resto} min`;
  }

  imprimir(): void {
    window.print();
  }
}
