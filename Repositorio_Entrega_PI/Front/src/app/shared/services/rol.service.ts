import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Rol } from '../models/entidades.model';
import { CrudBaseService } from './crud-base.service';

@Injectable({ providedIn: 'root' })
export class RolService extends CrudBaseService<Rol> {
  constructor(http: HttpClient) {
    super(http, 'roles');
  }
}
