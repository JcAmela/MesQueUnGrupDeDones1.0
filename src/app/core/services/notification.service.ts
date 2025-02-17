import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private snackBar: MatSnackBar) {}

  success(message: string, duration: number = 3000): void {
    this.snackBar.open(message, '', {
      duration,
      panelClass: ['snackbar-success']
    });
  }

  error(message: string, duration: number = 3000): void {
    this.snackBar.open(message, '', {
      duration,
      panelClass: ['snackbar-error']
    });
  }

  info(message: string, duration: number = 3000): void {
    this.snackBar.open(message, '', {
      duration,
      panelClass: ['snackbar-info']
    });
  }
}