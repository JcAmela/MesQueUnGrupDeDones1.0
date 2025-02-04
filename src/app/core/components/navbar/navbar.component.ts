import { Component, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {
  isMenuOpen = false;
  isUserMenuOpen = false;

  constructor(
    public themeService: ThemeService,
    public supabase: SupabaseService,
    private router: Router
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Cerrar el menú de usuario si se hace clic fuera de él
    if (this.isUserMenuOpen) {
      const userMenu = document.querySelector('.user-menu');
      const userButton = document.querySelector('.user-button');
      if (userMenu && userButton) {
        const clickedElement = event.target as HTMLElement;
        if (!userMenu.contains(clickedElement) && !userButton.contains(clickedElement)) {
          this.closeUserMenu();
        }
      }
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      this.closeUserMenu();
    }
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  async signOut(): Promise<void> {
    try {
      await this.supabase.signOut();
      this.closeUserMenu();
      this.closeMenu();
      await this.router.navigate(['/']);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
}