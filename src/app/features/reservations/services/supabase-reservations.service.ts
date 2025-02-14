import { Injectable, OnDestroy } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { BehaviorSubject, firstValueFrom, Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Class, Reservation} from '../models/reservation.types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingService } from '../../../core/services/loading.service';

@Injectable({
  providedIn: 'root'
})
export class SupabaseReservationsService implements OnDestroy {
  private classesSubject = new BehaviorSubject<Class[]>([]);
  private reservationsSubject = new BehaviorSubject<Reservation[]>([]);
  private realtimeChannels: { [key: string]: RealtimeChannel } = {};
  private isSubscribed = false;
  private destroy$ = new Subject<void>();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000;

  classes$ = this.classesSubject.asObservable();
  reservations$ = this.reservationsSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private notificationService: NotificationService,
    private loadingService: LoadingService
  ) {
    this.setupRealtimeSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanup();
  }

  private async setupRealtimeSubscriptions() {
    if (this.isSubscribed) return;

    try {
      await this.supabase.ensureInitialized();
      await Promise.all([
        this.setupClassesSubscription(),
        this.setupReservationsSubscription()
      ]);
      this.isSubscribed = true;
    } catch (error) {
      console.error('Error setting up realtime subscriptions:', error);
      this.notificationService.error('Error de connexió. Tornant a intentar...');
      setTimeout(() => this.setupRealtimeSubscriptions(), this.RETRY_DELAY);
    }
  }

  private async setupClassesSubscription() {
    if (this.realtimeChannels['classes']) {
      await this.realtimeChannels['classes'].unsubscribe();
    }

    const channel = this.supabase.client
      .channel('classes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'classes' },
        async () => {
          try {
            await this.getAvailableClasses();
          } catch (error) {
            console.error('Error refreshing classes:', error);
            this.notificationService.error('Error al actualitzar les classes. Tornant a intentar...');
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to classes changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel error for classes subscription');
          this.retrySubscription('classes');
        }
      });

    this.realtimeChannels['classes'] = channel;
  }

  private async setupReservationsSubscription() {
    if (this.realtimeChannels['reservations']) {
      await this.realtimeChannels['reservations'].unsubscribe();
    }

    const channel = this.supabase.client
      .channel('reservations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        async () => {
          try {
            await this.getUserReservations();
          } catch (error) {
            console.error('Error refreshing reservations:', error);
            this.notificationService.error('Error al actualitzar les reserves. Tornant a intentar...');
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to reservations changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel error for reservations subscription');
          this.retrySubscription('reservations');
        }
      });

    this.realtimeChannels['reservations'] = channel;
  }

  private async retrySubscription(channelName: string, attempts = this.MAX_RETRIES) {
    if (attempts <= 0) {
      console.error(`Failed to reconnect ${channelName} channel after multiple attempts`);
      this.notificationService.error('Error de connexió. Si us plau, refresca la pàgina.');
      return;
    }

    try {
      if (this.realtimeChannels[channelName]) {
        await this.realtimeChannels[channelName].unsubscribe();
      }
      
      await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      
      if (channelName === 'classes') {
        await this.setupClassesSubscription();
      } else if (channelName === 'reservations') {
        await this.setupReservationsSubscription();
      }
    } catch (error) {
      console.error(`Error during ${channelName} channel retry:`, error);
      await this.retrySubscription(channelName, attempts - 1);
    }
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < this.MAX_RETRIES; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.error(`Operation failed (attempt ${i + 1}/${this.MAX_RETRIES}):`, error);
        
        if (i < this.MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
          continue;
        }
      }
    }
    
    throw lastError;
  }

  async getAvailableClasses(): Promise<Class[]> {
    await this.supabase.ensureInitialized();
    return this.loadingService.withLoading(async () => {
      try {
        
        const { data, error } = await this.withRetry(async () => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          return await this.supabase.client
            .from('classes')
            .select(`
              *,
              reservations (
                id,
                user_id,
                status
              ),
              waiting_list (
                id,
                user_id,
                position
              )
            `)
            .gte('datetime', today.toISOString())
            .order('datetime', { ascending: true });
        });

        if (error) throw error;

        const processedClasses = (data as Class[]).map(classData => ({
          ...classData,
          reservations: classData.reservations?.filter(r => r.status === 'confirmed') || [],
          waiting_list: classData.waiting_list?.sort((a, b) => a.position - b.position) || []
        }));

        this.classesSubject.next(processedClasses);
        return processedClasses;
      } catch (error) {
        console.error('Error fetching classes:', error);
        this.notificationService.error('Error al carregar les classes disponibles. Si us plau, torna-ho a provar.');
        throw error;
      }
    });
  }

  async getUserReservations(): Promise<Reservation[]> {
    await this.supabase.ensureInitialized();
    return this.loadingService.withLoading(async () => {
      try {
        const session = await firstValueFrom(this.supabase.session$);
        if (!session?.user) throw new Error('User not authenticated');

        const { data, error } = await this.withRetry(async () => 
          this.supabase.client
            .from('reservations')
            .select(`
              *,
              class:classes (*)
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
        );

        if (error) throw error;

        this.reservationsSubject.next(data);
        return data;
      } catch (error) {
        console.error('Error fetching user reservations:', error);
        this.notificationService.error('Error al carregar les teves reserves. Si us plau, torna-ho a provar.');
        throw error;
      }
    });
  }

  async createReservation(classId: string): Promise<Reservation> {
    await this.supabase.ensureInitialized();
    return this.loadingService.withLoading(async () => {
      try {
        const session = await firstValueFrom(this.supabase.session$);
        if (!session?.user) throw new Error('User not authenticated');

        const availability = await this.getClassAvailability(classId);
        
        if (availability.reserved >= availability.total) {
          return this.addToWaitingList(classId);
        }

        const { data, error } = await this.withRetry(async () =>
          this.supabase.client
            .from('reservations')
            .insert([
              {
                user_id: session.user.id,
                class_id: classId,
                status: 'confirmed'
              }
            ])
            .select(`
              *,
              class:classes (*)
            `)
            .single()
        );

        if (error) throw error;

        await this.getUserReservations();
        await this.getAvailableClasses();
        this.notificationService.success('Reserva realitzada amb èxit');
        return data;
      } catch (error: any) {
        console.error('Error creating reservation:', error);
        if (error.message === 'Class is full') {
          return this.addToWaitingList(classId);
        }
        this.notificationService.error('Error al crear la reserva. Si us plau, torna-ho a provar.');
        throw error;
      }
    });
  }

  private async addToWaitingList(classId: string): Promise<any> {
    await this.supabase.ensureInitialized();
    try {
      const session = await firstValueFrom(this.supabase.session$);
      if (!session?.user) throw new Error('User not authenticated');

      const { data: lastPosition } = await this.withRetry(async () =>
        this.supabase.client
          .from('waiting_list')
          .select('position')
          .eq('class_id', classId)
          .order('position', { ascending: false })
          .limit(1)
          .single()
      );

      const nextPosition = (lastPosition?.position ?? 0) + 1;

      const { data, error } = await this.withRetry(async () =>
        this.supabase.client
          .from('waiting_list')
          .insert([
            {
              user_id: session.user.id,
              class_id: classId,
              position: nextPosition
            }
          ])
          .select()
          .single()
      );

      if (error) throw error;

      await this.getAvailableClasses();
      this.notificationService.info('T\'hem afegit a la llista d\'espera');
      return { ...data, status: 'waitlist' };
    } catch (error) {
      console.error('Error adding to waiting list:', error);
      this.notificationService.error('Error al afegir-te a la llista d\'espera. Si us plau, torna-ho a provar.');
      throw error;
    }
  }

  async cancelReservation(reservationId: string): Promise<void> {
    await this.supabase.ensureInitialized();
    return this.loadingService.withLoading(async () => {
      try {
        
        const { error } = await this.withRetry(async () =>
          this.supabase.client
            .from('reservations')
            .delete()
            .eq('id', reservationId)
        );

        if (error) throw error;

        await this.getUserReservations();
        await this.getAvailableClasses();
        this.notificationService.success('Reserva cancel·lada amb èxit');
      } catch (error) {
        console.error('Error canceling reservation:', error);
        this.notificationService.error('Error al cancel·lar la reserva. Si us plau, torna-ho a provar.');
        throw error;
      }
    });
  }

  async getClassAvailability(classId: string): Promise<{
    total: number;
    reserved: number;
    waiting: number;
  }> {
    await this.supabase.ensureInitialized();
    try {
      
      const { data: classData, error: classError } = await this.withRetry(async () =>
        this.supabase.client
          .from('classes')
          .select(`
            max_participants,
            reservations (count),
            waiting_list (count)
          `)
          .eq('id', classId)
          .single()
      );

      if (classError) throw classError;

      return {
        total: classData.max_participants,
        reserved: classData.reservations[0].count,
        waiting: classData.waiting_list[0].count
      };
    } catch (error) {
      console.error('Error getting class availability:', error);
      this.notificationService.error('Error al comprovar la disponibilitat. Si us plau, torna-ho a provar.');
      throw error;
    }
  }

  async cleanup() {
    try {
      for (const channel of Object.values(this.realtimeChannels)) {
        await channel.unsubscribe();
      }
      this.realtimeChannels = {};
      this.isSubscribed = false;
    } catch (error) {
      console.error('Error cleaning up realtime channels:', error);
    }
  }

  getUpcomingClasses(): Observable<Class[]> {
    return this.classes$.pipe(
      map(classes => {
        const now = new Date();
        return classes
          .filter(c => new Date(c.datetime) > now)
          .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
      })
    );
  }

  getClassesByDate(date: Date): Observable<Class[]> {
    return this.classes$.pipe(
      map(classes => {
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
        const nextDate = new Date(selectedDate);
        nextDate.setDate(nextDate.getDate() + 1);
        
        return classes.filter(c => {
          const classDate = new Date(c.datetime);
          return classDate >= selectedDate && classDate < nextDate;
        });
      })
    );
  }
}