import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  error: string | null = null;
  hidePassword = true;
  private maxAttempts = 3;
  private currentAttempt = 0;

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      if (this.currentAttempt >= this.maxAttempts) {
        this.error = 'Massa intents fallits. Si us plau, espera uns minuts abans de tornar-ho a provar.';
        this.cdr.detectChanges();
        return;
      }

      this.loading = true;
      this.error = null;
      this.cdr.detectChanges();
      
      try {
        await this.supabase.ensureInitialized();
        
        const { error } = await this.supabase.signIn(
          this.loginForm.get('email')?.value,
          this.loginForm.get('password')?.value
        );

        if (error) {
          this.currentAttempt++;
          
          if (error.message.includes('Invalid login credentials')) {
            this.error = 'Les credencials no són vàlides. Si us plau, comprova el correu i la contrasenya.';
          } else if (error.message.includes('timeout')) {
            this.error = 'Error de connexió. Si us plau, torna-ho a provar.';
          } else {
            this.error = 'Hi ha hagut un error en iniciar sessió. Si us plau, torna-ho a provar.';
          }
          this.cdr.detectChanges();
          return;
        }

        // Reset attempts on successful login
        this.currentAttempt = 0;
        this.notificationService.success('Sessió iniciada correctament');
      } catch (error: any) {
        console.error('Error signing in:', error);
        this.currentAttempt++;
        this.error = 'Error de connexió. Si us plau, torna-ho a provar.';
        this.cdr.detectChanges();
      } finally {
        this.loading = false;
        this.cdr.detectChanges();
      }
    }
  }
}