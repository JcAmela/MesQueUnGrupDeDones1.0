import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { QRCodeModule } from 'angularx-qrcode';
import { LucideAngularModule, Calendar, List, Clock, MapPin, Dumbbell, XCircle, PlusCircle, CalendarX } from 'lucide-angular';

import { ReservationCalendarComponent } from './components/reservation-calendar/reservation-calendar.component';
import { MyReservationsComponent } from './components/my-reservations/my-reservations.component';
import { AddDurationPipe } from './pipes/add-duration.pipe';
import { AuthGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: ReservationCalendarComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'my-reservations',
    component: MyReservationsComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    ReservationCalendarComponent,
    MyReservationsComponent,
    AddDurationPipe
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    QRCodeModule,
    LucideAngularModule.pick({
      Calendar,
      List,
      Clock,
      MapPin,
      Dumbbell,
      XCircle,
      PlusCircle,
      CalendarX
    })
  ]
})
export class ReservationsModule { }