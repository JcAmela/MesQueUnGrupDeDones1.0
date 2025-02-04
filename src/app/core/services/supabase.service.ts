import { Injectable } from '@angular/core';
import {
  createClient,
  SupabaseClient,
  User,
  AuthError,
  Session,
} from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import {
  BehaviorSubject,
  Observable,
  from,
  lastValueFrom,
  timer,
  of,
} from 'rxjs';
import { Router } from '@angular/router';
import {
  retry,
  catchError,
  timeout,
  delayWhen,
  retryWhen,
  tap,
  scan,
} from 'rxjs/operators';
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
  private readonly TIMEOUT = 20000; // Aumentado a 20 segundos
  private readonly MAX_RETRIES = 3;
  private readonly BASE_DELAY = 1000; // Reducido a 1 segundo
  private readonly MAX_DELAY = 5000; // Reducido a 5 segundos
  private readonly JITTER = 0.1;

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
        global: {
          headers: {
            'X-Client-Info': 'supabase-js-web',
          },
        },
        realtime: {
          params: {
            eventsPerSecond: 1,
          },
        },
        db: {
          schema: 'public',
        },
      }
    );

    this.initializationPromise = this.initializeAuth().catch((error) => {
      console.error('Error inicializando Supabase:', error);
      return this.retryInitialization();
    });
  }

  private async retryInitialization(attempts = 3): Promise<void> {
    for (let i = 0; i < attempts; i++) {
      try {
        await this.initializeAuth();
        return;
      } catch (error) {
        console.error(`Intento ${i + 1}/${attempts} fallido:`, error);
        
        if (i < attempts - 1) {
          const delay = this.calculateDelay(i);
          this.notificationService.error('Error de connexió. Tornant a intentar...');
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }
    
    this.notificationService.error("No s'ha pogut connectar. Si us plau, refresca la pàgina.");
  }

  private calculateDelay(retryCount: number): number {
    const exponentialDelay = Math.min(
      this.MAX_DELAY,
      this.BASE_DELAY * Math.pow(1.5, retryCount)
    );
    const jitter = exponentialDelay * this.JITTER * Math.random();
    return exponentialDelay * (1 - this.JITTER) + jitter;
  }

  private async initializeAuth(): Promise<void> {
    if (this.initialized) return;

    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) throw error;

      if (session?.user) {
        this.userSubject.next(session.user);
        this.sessionSubject.next(session);
      } else {
        this.userSubject.next(null);
        this.sessionSubject.next(null);
      }

      this.supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          const currentUser = session?.user ?? null;
          console.log("Canvi d'estat auth:", event, currentUser?.id);

          this.userSubject.next(currentUser);
          this.sessionSubject.next(session);

          if (event === 'SIGNED_OUT') {
            await this.router.navigate(['/']);
            this.notificationService.info('Sessió tancada correctament');
          } else if (event === 'SIGNED_IN' && currentUser) {
            try {
              await this.loadingService.withLoading(async () => {
                const { error: profileError } = await this.supabase
                  .from('profiles')
                  .upsert(
                    {
                      id: currentUser.id,
                      updated_at: new Date().toISOString(),
                    },
                    {
                      onConflict: 'id',
                    }
                  );

                if (profileError) throw profileError;

                await this.router.navigate(['/reservations/my-reservations']);
                this.notificationService.success('Sessió iniciada correctament');
              });
            } catch (error) {
              console.error('Error en iniciar sessió:', error);
              this.notificationService.error('Error en iniciar sessió');
            }
          }
        } catch (error) {
          console.error("Error en el canvi d'estat auth:", error);
          this.notificationService.error("Error en el canvi d'estat de l'autenticació");
        }
      });

      this.initialized = true;
    } catch (error) {
      console.error('Error inicializando auth:', error);
      this.userSubject.next(null);
      this.sessionSubject.next(null);
      throw error;
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

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < this.MAX_RETRIES; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.error(`Operació fallida (intent ${i + 1}/${this.MAX_RETRIES}):`, error);
        
        if (i < this.MAX_RETRIES - 1) {
          const delay = this.calculateDelay(i);
          this.notificationService.error('Error de connexió. Tornant a intentar...');
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }
    
    throw lastError;
  }

  async signIn(
    email: string,
    password: string
  ): Promise<{ data: any | null; error: AuthError | null }> {
    await this.ensureInitialized();

    return this.loadingService.withLoading(async () => {
      try {
        const { data, error } = await this.withRetry(() =>
          this.supabase.auth.signInWithPassword({
            email,
            password,
          })
        );

        if (error) {
          if (error.message === 'Invalid login credentials') {
            return {
              data: null,
              error: {
                ...error,
                message: 'Credencials invàlides. Si us plau, verifica el correu i la contrasenya.',
              } as AuthError,
            };
          }
          throw error;
        }

        return { data, error: null };
      } catch (error) {
        console.error('Error en iniciar sessió:', error);
        return {
          data: null,
          error: {
            name: 'AuthApiError',
            message: 'Error en iniciar sessió. Si us plau, torna-ho a provar.',
            status: 500,
          } as AuthError,
        };
      }
    });
  }

  async signUp(
    email: string,
    password: string
  ): Promise<{ data: any | null; error: AuthError | null }> {
    await this.ensureInitialized();

    return this.loadingService.withLoading(async () => {
      try {
        const { data, error } = await this.withRetry(() =>
          this.supabase.auth.signUp({
            email,
            password,
          })
        );

        if (error) throw error;

        if (data.user) {
          try {
            const { error: profileError } = await this.supabase
              .from('profiles')
              .insert([{ id: data.user.id }]);

            if (profileError) {
              // Rollback: Eliminar usuario si falla la creación del perfil
              await this.supabase.auth.admin.deleteUser(data.user.id);
              throw profileError;
            }
          } catch (profileError) {
            console.error('Error creant perfil:', profileError);
            throw profileError;
          }
        }

        this.notificationService.success('Compte creat correctament');
        return { data, error: null };
      } catch (error) {
        console.error('Error en registrar:', error);
        return {
          data: null,
          error: {
            name: 'AuthApiError',
            message: 'Error en crear el compte. Si us plau, torna-ho a provar.',
            status: 500,
          } as AuthError,
        };
      }
    });
  }

  async signOut(): Promise<void> {
    await this.ensureInitialized();

    return this.loadingService.withLoading(async () => {
      try {
        const { error } = await this.withRetry(() =>
          this.supabase.auth.signOut()
        );
        if (error) throw error;
      } catch (error) {
        console.error('Error en tancar sessió:', error);
        this.notificationService.error(
          'Error en tancar sessió. Si us plau, torna-ho a provar.'
        );
        throw error;
      }
    });
  }
}