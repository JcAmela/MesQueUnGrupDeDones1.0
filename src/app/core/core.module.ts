import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Menu, X, ChevronUp, User, ChevronDown, Calendar, LogOut, PlusCircle } from 'lucide-angular';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { LoadingComponent } from './components/loading/loading.component';
import { ThemeService } from './services/theme.service';
import { NotificationService } from './services/notification.service';
import { LoadingService } from './services/loading.service';

@NgModule({
  declarations: [
    NavbarComponent,
    FooterComponent,
    NotFoundComponent,
    LoadingComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatSnackBarModule,
    LucideAngularModule.pick({
      Menu,
      X,
      ChevronUp,
      ChevronDown,
      User,
      Calendar,
      LogOut,
      PlusCircle
    })
  ],
  exports: [
    NavbarComponent,
    FooterComponent,
    NotFoundComponent,
    LoadingComponent
  ],
  providers: [
    ThemeService,
    NotificationService,
    LoadingService
  ]
})
export class CoreModule { }