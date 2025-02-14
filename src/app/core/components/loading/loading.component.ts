import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loading',
  template: `
    <div *ngIf="loading.loading$ | async" class="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center h-full w-full">
      <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 flex flex-col items-center space-y-6">
        <lucide-icon name="loader" class="w-12 h-12 text-indigo-500 animate-spin"></lucide-icon>
        <span class="text-xl font-semibold text-gray-800 dark:text-gray-200">Cargando...</span>
        <p class="text-sm text-gray-600 dark:text-gray-400">Por favor, espere un momento...</p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingComponent {
  constructor(public loading: LoadingService) {}
}
