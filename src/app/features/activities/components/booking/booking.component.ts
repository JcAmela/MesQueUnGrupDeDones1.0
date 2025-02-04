import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CalendlyService } from '../../services/calendly.service';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingComponent {
  constructor(public calendlyService: CalendlyService) {}
}