import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ThemeService } from './core/services/theme.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  // Hero image showing diverse senior women in an active group setting
  readonly heroImage = "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=1920";
  showHero = true;

  constructor(
    public themeService: ThemeService,
    private router: Router
  ) {
    // Subscribe to router events to hide hero on specific pages
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Only show hero on the home page
      this.showHero = event.url === '/' || event.url === '';
    });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}