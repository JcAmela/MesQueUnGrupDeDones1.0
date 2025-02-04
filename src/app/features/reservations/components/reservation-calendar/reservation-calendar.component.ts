import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatCalendarCellCssClasses } from '@angular/material/datepicker';
import { SupabaseReservationsService } from '../../services/supabase-reservations.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Class } from '../../models/reservation.types';
import { BehaviorSubject, Observable, Subject, combineLatest, of } from 'rxjs';
import { map, takeUntil, startWith, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-reservation-calendar',
  templateUrl: './reservation-calendar.component.html',
  styleUrls: ['./reservation-calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReservationCalendarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private selectedDateSubject = new BehaviorSubject<Date>(new Date());
  private classesWithDates$ = this.reservationsService.classes$.pipe(
    map(classes => {
      const dateMap = new Map<string, number>();
      classes.forEach(c => {
        const date = new Date(c.datetime).toDateString();
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      });
      return dateMap;
    }),
    catchError(error => {
      console.error('Error processing classes:', error);
      this.notificationService.error('Error al processar les classes. Si us plau, refresca la pàgina.');
      return of(new Map<string, number>());
    })
  );
  
  selectedDate$ = this.selectedDateSubject.asObservable();
  filteredClasses$: Observable<Class[]>;
  currentUserId$ = this.supabase.user$.pipe(
    map(user => user?.id),
    catchError(error => {
      console.error('Error getting user ID:', error);
      this.notificationService.error('Error d\'autenticació. Si us plau, torna a iniciar sessió.');
      return of(null);
    })
  );

  // Add minDate to restrict past dates
  minDate = new Date();
  
  constructor(
    private reservationsService: SupabaseReservationsService,
    private supabase: SupabaseService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    // Set minDate to start of today
    this.minDate.setHours(0, 0, 0, 0);

    this.filteredClasses$ = combineLatest([
      this.reservationsService.classes$,
      this.selectedDate$.pipe(startWith(new Date())),
      this.currentUserId$
    ]).pipe(
      map(([classes, selectedDate, userId]) => {
        // Filter classes for the selected date
        return classes
          .filter(c => {
            const classDate = new Date(c.datetime);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Filter out past classes
            if (classDate < today) {
              return false;
            }

            // Compare only the date part
            const selectedDateStart = new Date(selectedDate);
            selectedDateStart.setHours(0, 0, 0, 0);
            const selectedDateEnd = new Date(selectedDate);
            selectedDateEnd.setHours(23, 59, 59, 999);

            return classDate >= selectedDateStart && classDate <= selectedDateEnd;
          })
          .map(c => ({
            ...c,
            isUserReservation: c.reservations?.some(r => r.user_id === userId && r.status === 'confirmed') ?? false,
            confirmedReservations: c.reservations?.filter(r => r.status === 'confirmed') ?? []
          }))
          .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
      }),
      catchError(error => {
        console.error('Error filtering classes:', error);
        this.notificationService.error('Error al filtrar les classes. Si us plau, refresca la pàgina.');
        return of([]);
      }),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit() {
    this.loadClasses();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadClasses() {
    try {
      await this.reservationsService.getAvailableClasses();
    } catch (error) {
      console.error('Error loading classes:', error);
      this.notificationService.error('Error al carregar les classes. Si us plau, torna-ho a provar.');
    }
  }

  dateClass = (date: Date): MatCalendarCellCssClasses => {
    const dateString = date.toDateString();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If date is in the past, add disabled class
    if (date < today) {
      return 'past-date';
    }

    return this.classesWithDates$.pipe(
      map(dateMap => {
        if (dateMap instanceof Map && dateMap.has(dateString)) {
          return 'has-classes';
        }
        return '';
      })
    );
  };

  onDateSelected(date: Date | null) {
    if (date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Prevent selecting past dates
      if (date < today) {
        this.notificationService.error('No es poden seleccionar dates passades');
        return;
      }

      this.selectedDateSubject.next(date);
      this.loadClasses(); // Reload classes when date changes
      this.cdr.detectChanges();
    }
  }

  async makeReservation(classData: Class) {
    try {
      const classDate = new Date(classData.datetime);
      const now = new Date();

      // Check if class is in the past
      if (classDate < now) {
        this.notificationService.error('No es poden fer reserves per a classes passades');
        return;
      }

      await this.reservationsService.createReservation(classData.id);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error making reservation:', error);
      // Error message is handled by the service
    }
  }

  isClassFull(classData: Class): boolean {
    return (classData.confirmedReservations?.length ?? 0) >= classData.max_participants;
  }

  hasReservation(classData: Class): boolean {
    return classData.isUserReservation ?? false;
  }

  isPastClass(classData: Class): boolean {
    return new Date(classData.datetime) < new Date();
  }

  getReservationsCount(reservations: Array<{ id: string; user_id: string; status: string }> | undefined): number {
    return reservations?.filter(r => r.status === 'confirmed').length ?? 0;
  }

  getWaitingListCount(classData: Class): number {
    return classData.waiting_list?.length ?? 0;
  }

  getAvailabilityText(classData: Class): string {
    const available = classData.max_participants - (classData.confirmedReservations?.length ?? 0);
    if (available === 0) return 'Classe completa';
    return `${available} ${available === 1 ? 'plaça disponible' : 'places disponibles'}`;
  }

  getAvailabilityClass(classData: Class): string {
    const available = classData.max_participants - (classData.confirmedReservations?.length ?? 0);
    if (available === 0) return 'text-red-500';
    if (available <= 3) return 'text-orange-500';
    return 'text-green-500';
  }

  getEndTime(datetime: string, duration: string): string {
    const startDate = new Date(datetime);
    const [hours, minutes] = duration.split(':').map(Number);
    const endDate = new Date(startDate.getTime());
    endDate.setHours(endDate.getHours() + hours);
    endDate.setMinutes(endDate.getMinutes() + minutes);
    return endDate.toLocaleTimeString('ca', { hour: '2-digit', minute: '2-digit' });
  }
}