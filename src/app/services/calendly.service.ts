import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CalendlyService {
  private renderer: Renderer2;
  private isOpen = new BehaviorSubject<boolean>(false);
  private selectedActivity = new BehaviorSubject<string>('');

  isOpen$ = this.isOpen.asObservable();
  selectedActivity$ = this.selectedActivity.asObservable();

  readonly calendlyUrls: { [key: string]: string } = {
    'Zumba Suau': 'https://calendly.com/mesqueungrup/zumba',
    'Pilates': 'https://calendly.com/mesqueungrup/pilates',
    'Microgimnàstica': 'https://calendly.com/mesqueungrup/microgimnastica'
  };

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  openCalendly(activity: string) {
    this.selectedActivity.next(activity);
    this.isOpen.next(true);
    this.loadCalendlyScript();
  }

  closeCalendly() {
    this.isOpen.next(false);
  }

  private loadCalendlyScript() {
    const script = this.renderer.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    this.renderer.appendChild(document.body, script);
  }
}