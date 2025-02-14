import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { LucideAngularModule, Loader } from 'lucide-angular';
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
    LucideAngularModule.pick({ Loader })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }