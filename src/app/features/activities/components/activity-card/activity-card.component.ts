import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Activity } from '../../models/activity.interface';
import { CalendlyService } from '../../services/calendly.service';

@Component({
  selector: 'app-activity-card',
  templateUrl: './activity-card.component.html',
  styleUrls: ['./activity-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityCardComponent {
  @Input() activity!: Activity;

  constructor(public calendlyService: CalendlyService) {}
}