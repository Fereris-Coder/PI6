import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Vehiculo, VehiculoTaraProducto } from '../models/entidades.model';
import { CrudBaseService } from './crud-base.service';

@Injectable({ providedIn: 'root' })
export class VehiculoService extends CrudBaseService<Vehiculo> {
  constructor(http: HttpClient) {
    super(http, 'vehiculos');
  }

  actualizarTara(placa: string, taraKg: number, vigenciaDias?: number | null): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${placa}/tara`, { taraKg, vigenciaDias });
  }

  listarTarasPorProducto(placa: string): Observable<VehiculoTaraProducto[]> {
    return this.http.get<VehiculoTaraProducto[]>(`${this.baseUrl}/${placa}/taras-producto`);
  }

  guardarTaraProducto(placa: string, proCodigo: number, taraKg: number, vigenciaDias: number = 30): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${placa}/taras-producto`, { proCodigo, taraKg, vigenciaDias });
  }
}
