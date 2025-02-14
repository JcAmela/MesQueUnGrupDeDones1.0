import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { LucideAngularModule, Loader, User } from 'lucide-angular'; // Importa el ícono User
import { ActivitiesModule } from './features/activities/activities.module';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    CoreModule,
    ActivitiesModule,
    MatIconModule,
    MatSnackBarModule,
    LucideAngularModule.pick({ Loader, User }) // Incluye el ícono User
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }