import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Cliente } from '../models/entidades.model';
import { CrudBaseService } from './crud-base.service';

@Injectable({ providedIn: 'root' })
export class ClienteService extends CrudBaseService<Cliente> {
  constructor(http: HttpClient) {
    super(http, 'clientes');
  }
}
