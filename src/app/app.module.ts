import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { LucideAngularModule, Loader, User } from 'lucide-angular'; // Importa el ícono User
import { ActivitiesModule } from './features/activities/activities.module';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { registerLocaleData } from '@angular/common';
import localeCa from '@angular/common/locales/ca';

import { AppComponent } from './app.component';

registerLocaleData(localeCa);

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
  providers: [
    { provide: LOCALE_ID, useValue: 'ca' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }