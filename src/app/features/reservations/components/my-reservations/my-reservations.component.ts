import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { SupabaseReservationsService } from '../../services/supabase-reservations.service';
import { Observable, map } from 'rxjs';
import { Class, Reservation } from '../../models/reservation.types';
import { MatCalendarCellCssClasses } from '@angular/material/datepicker';

type ViewOption = 'month' | 'list';

@Component({
  selector: 'app-my-reservations',
  templateUrl: './my-reservations.component.html',
  styleUrls: ['./my-reservations.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyReservationsComponent {
  reservations$: Observable<Reservation[]> =
    this.reservationsService.reservations$;
  upcomingClasses$: Observable<Class[]> =
    this.reservationsService.getUpcomingClasses();
  viewOptions: ViewOption[] = ['list', 'month'];
  view: ViewOption = 'list';
  selectedDate: Date = new Date();

  // Cancel dialog state
  showingCancelDialog = false;
  reservationToCancel: Reservation | null = null;

  constructor(
    private reservationsService: SupabaseReservationsService,
    private cdr: ChangeDetectorRef
  ) {
    this.loadReservations();
  }

  private async loadReservations(): Promise<void> {
    try {
      await this.reservationsService.getUserReservations();
    } catch (error) {
      console.error('Error loading reservations:', error);
    }
  }

  getViewIcon(view: ViewOption): string {
    return {
      list: 'list',
      month: 'calendar',
    }[view];
  }

  getViewLabel(view: ViewOption): string {
    return {
      list: 'Llista',
      month: 'Calendari',
    }[view];
  }

  showCancelConfirmation(reservation: Reservation): void {
    this.reservationToCancel = reservation;
    this.showingCancelDialog = true;
    this.cdr.detectChanges();
  }

  hideCancelDialog(): void {
    this.showingCancelDialog = false;
    this.reservationToCancel = null;
    this.cdr.detectChanges();
  }

  async confirmCancel(): Promise<void> {
    if (!this.reservationToCancel) return;

    try {
      const reservationId = this.reservationToCancel.id;
      this.hideCancelDialog(); // Cerrar el diálogo inmediatamente
      await this.reservationsService.cancelReservation(reservationId);
      await this.loadReservations(); // Recargar las reservas
    } catch (error) {
      console.error('Error canceling reservation:', error);
    }
  }

  getUpcomingReservations(reservations: Reservation[]): Reservation[] {
    const now = new Date();
    return reservations
      .filter((r) => r.class && new Date(r.class.datetime) >= now)
      .sort((a, b) => {
        if (!a.class?.datetime || !b.class?.datetime) return 0;
        return (
          new Date(a.class.datetime).getTime() -
          new Date(b.class.datetime).getTime()
        );
      });
  }

  getPastReservations(reservations: Reservation[]): Reservation[] {
    const now = new Date();
    return reservations
      .filter((r) => r.class && new Date(r.class.datetime) < now)
      .sort((a, b) => {
        if (!a.class?.datetime || !b.class?.datetime) return 0;
        return (
          new Date(b.class.datetime).getTime() -
          new Date(a.class.datetime).getTime()
        );
      });
  }

  changeView(newView: ViewOption): void {
    this.view = newView;
    this.cdr.detectChanges();
  }

  onDateSelected(date: Date | null): void {
    if (date) {
      this.selectedDate = date;
      this.cdr.detectChanges();
    }
  }

  dateClass = (date: Date): MatCalendarCellCssClasses => {
    const dateStr = date.toISOString().split('T')[0];
    return this.reservations$.pipe(
      map((reservations: Reservation[]) => {
        const hasReservation = reservations.some((reservation) => {
          if (!reservation.class?.datetime) return false;
          const classDate = new Date(reservation.class.datetime);
          return classDate.toISOString().split('T')[0] === dateStr;
        });
        return hasReservation ? 'has-event' : '';
      })
    );
  };
}
