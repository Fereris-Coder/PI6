import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Producto } from '../models/entidades.model';
import { CrudBaseService } from './crud-base.service';

@Injectable({ providedIn: 'root' })
export class ProductoService extends CrudBaseService<Producto> {
  constructor(http: HttpClient) {
    super(http, 'productos');
  }
}
