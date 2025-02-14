// Definir el error NavigatorLockAcquireTimeoutError manualmente para evitar el error de compilación.
class NavigatorLockAcquireTimeoutError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'NavigatorLockAcquireTimeoutError';
  }
}

import { Injectable } from '@angular/core';
import {
  createClient,
  SupabaseClient,
  User,
  AuthError,
  Session,
} from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';
import { LoadingService } from './loading.service';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private userSubject = new BehaviorSubject<User | null>(null);
  private sessionSubject = new BehaviorSubject<Session | null>(null);
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private loadingService: LoadingService
  ) {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          storage: localStorage,
          storageKey: 'supabase.auth.token',
        },
      }
    );
    this.initializationPromise = this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      this.userSubject.next(session?.user || null);
      this.sessionSubject.next(session || null);

      this.supabase.auth.onAuthStateChange((event, session) => {
        this.userSubject.next(session?.user || null);
        this.sessionSubject.next(session || null);

        if (event === 'SIGNED_OUT') {
          this.router.navigate(['/']);
          this.notificationService.info('Sessió tancada correctament');
        } else if (event === 'SIGNED_IN') {
          this.notificationService.success('Sessió iniciada correctament');
        }
      });
      this.initialized = true;
    } catch (error) {
      if (error instanceof NavigatorLockAcquireTimeoutError) {
        console.error('Failed to acquire lock for Supabase auth token:', error);
        this.notificationService.error('Error al inicializar la sesión. Por favor, inténtalo de nuevo.');
      } else {
        console.error('Error initializing Supabase:', error);
        this.notificationService.error('Error al inicializar Supabase. Por favor, inténtalo de nuevo.');
      }
    }
  }

  async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  get user$(): Observable<User | null> {
    return this.userSubject.asObservable();
  }

  get session$(): Observable<Session | null> {
    return this.sessionSubject.asObservable();
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  async signIn(email: string, password: string): Promise<{ data: any | null; error: AuthError | null }> {
    await this.ensureInitialized();
    return this.loadingService.withLoading(async () => {
      try {
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        return { data, error: null };
      } catch (error) {
        console.error('Error signing in:', error);
        this.notificationService.error('Error al iniciar sesión. Por favor, verifica tus credenciales.');
        return { data: null, error: error as AuthError };
      }
    });
  }

  async signUp(email: string, password: string): Promise<{ data: any | null; error: AuthError | null }> {
    await this.ensureInitialized();
    return this.loadingService.withLoading(async () => {
      try {
        const { data, error } = await this.supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        return { data, error: null };
      } catch (error) {
        console.error('Error en el registro:', error);
        this.notificationService.error('Error al crear la cuenta. Por favor, inténtalo de nuevo.');
        return { data: null, error: error as AuthError };
      }
    });
  }

  async signOut(): Promise<void> {
    await this.ensureInitialized();
    return this.loadingService.withLoading(async () => {
      try {
        await this.supabase.auth.signOut();
      } catch (error) {
        console.error('Error signing out:', error);
        this.notificationService.error('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
      }
    });
  }
}
