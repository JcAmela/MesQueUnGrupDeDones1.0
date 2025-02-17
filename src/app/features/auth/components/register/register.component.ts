import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { NotificationService } from '../../../../core/services/notification.service'; // Import NotificationService

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  error: string | null = null;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router,
    private notificationService: NotificationService // Inject NotificationService
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      const { email, password } = this.registerForm.value;

      // Mostrar mensaje de carga
      this.loading = true;

      // Configurar temporizador para mostrar mensaje adicional
      const timer = setTimeout(() => {
        this.notificationService.info('Solo será unos segundos más...');
      }, 3000);

      try {
        const { error } = await this.supabase.signUp(email, password);

        // Limpiar temporizador si la llamada se  completa antes de 3 segundos
        clearTimeout(timer);

        if (error) throw error;

        this.router.navigate(['/auth/login'], {
          queryParams: { registered: true }
        });
      } catch (error: any) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    }
  }
}