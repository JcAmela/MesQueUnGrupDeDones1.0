import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class CalendlyService {
  private isOpen = new BehaviorSubject<boolean>(false);
  private selectedActivity = new BehaviorSubject<string>('');

  isOpen$ = this.isOpen.asObservable();
  selectedActivity$ = this.selectedActivity.asObservable();

  readonly calendlyUrls: { [key: string]: string } = {
    'Zumba Suau': 'https://calendly.com/mesqueungrup/zumba',
    'Pilates': 'https://calendly.com/mesqueungrup/pilates',
    'Microgimnàstica': 'https://calendly.com/mesqueungrup/microgimnastica'
  };

  openCalendly(activity: string): void {
    this.selectedActivity.next(activity);
    this.isOpen.next(true);
  }

  closeCalendly(): void {
    this.isOpen.next(false);
  }
}