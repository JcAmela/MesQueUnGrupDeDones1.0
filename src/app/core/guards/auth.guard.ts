import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    try {
      const user = await firstValueFrom(this.supabase.user$);
      
      if (user) {
        return true;
      }

      await this.router.navigate(['/auth/login']);
      return false;
    } catch (error) {
      console.error('Auth guard error:', error);
      await this.router.navigate(['/auth/login']);
      return false;
    }
  }
}