import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loading',
  template: `
    <div *ngIf="loading.loading$ | async" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-4">
        <lucide-icon name="loader-2" class="w-8 h-8 text-pink-600 animate-spin"></lucide-icon>
        <span class="text-lg font-medium text-gray-900 dark:text-white">Carregant...</span>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingComponent {
  constructor(public loading: LoadingService) {}
}