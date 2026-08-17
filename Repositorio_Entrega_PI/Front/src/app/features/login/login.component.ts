import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, MessageModule, CheckboxModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  nombreUsuario = '';
  password = '';
  recordarme = true;

  mostrarClave = signal(false);
  cargando = signal(false);
  error = signal<string | null>(null);

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly messageService: MessageService
  ) {}

  ingresar(): void {
    if (!this.nombreUsuario || !this.password) {
      this.error.set('Ingresa usuario y contraseña.');
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.auth.login({ nombreUsuario: this.nombreUsuario, password: this.password }, this.recordarme).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/inicio']);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('Usuario o contraseña incorrectos.');
      }
    });
  }

  olvidoContrasena(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Recuperar contraseña',
      detail: 'Contacta al administrador del sistema para restablecer tu contraseña.'
    });
  }
}
