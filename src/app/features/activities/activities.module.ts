import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { LucideAngularModule, Calendar, MapPin, ExternalLink } from 'lucide-angular';

import { ActivitiesComponent } from './activities.component';
import { ActivityCardComponent } from './components/activity-card/activity-card.component';
import { BookingComponent } from './components/booking/booking.component';
import { CalendlyService } from './services/calendly.service';
import { SafePipe } from './pipes/safe.pipe';

const routes: Routes = [
  { path: '', component: ActivitiesComponent }
];

@NgModule({
  declarations: [
    ActivitiesComponent,
    ActivityCardComponent,
    BookingComponent,
    SafePipe
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    LucideAngularModule.pick({ Calendar, MapPin, ExternalLink })
  ],
  exports: [
    BookingComponent
  ],
  providers: [CalendlyService]
})
export class ActivitiesModule { }