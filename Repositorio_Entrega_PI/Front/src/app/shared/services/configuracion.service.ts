import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Configuracion } from '../models/entidades.model';
import { CrudBaseService } from './crud-base.service';

@Injectable({ providedIn: 'root' })
export class ConfiguracionService extends CrudBaseService<Configuracion> {
  constructor(http: HttpClient) {
    super(http, 'configuraciones');
  }
}
