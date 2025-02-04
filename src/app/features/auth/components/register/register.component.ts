import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase.service';

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
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      this.loading = true;
      this.error = null;
      
      try {
        const { error } = await this.supabase.signUp(
          this.registerForm.get('email')?.value,
          this.registerForm.get('password')?.value
        );

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