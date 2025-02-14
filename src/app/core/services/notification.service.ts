import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  success(message: string): void {
    this.snackBar.open(message, 'Tancar', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['bg-green-600', 'text-white']
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Tancar', {
      duration: 7000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['bg-red-600', 'text-white']
    });
  }

  info(message: string): void {
    this.snackBar.open(message, 'Tancar', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['bg-blue-600', 'text-white']
    });
  }

  loading(message: string): void {
    this.snackBar.open(message, '', {
      duration: 3000, // Duración del mensaje
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      panelClass: ['bg-yellow-600', 'text-white']
    });
  }
}