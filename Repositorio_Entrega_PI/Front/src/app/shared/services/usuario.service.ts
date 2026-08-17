import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Usuario } from '../models/entidades.model';
import { CrudBaseService } from './crud-base.service';

@Injectable({ providedIn: 'root' })
export class UsuarioService extends CrudBaseService<Usuario> {
  constructor(http: HttpClient) {
    super(http, 'usuarios');
  }
}
