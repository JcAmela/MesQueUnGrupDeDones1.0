import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'addDuration'
})
export class AddDurationPipe implements PipeTransform {
  transform(time: string, duration: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const durationMatch = duration.match(/(\d+):(\d+):(\d+)/);
    
    if (!durationMatch) return time;
    
    const [_, durationHours, durationMinutes] = durationMatch.map(Number);
    
    const date = new Date();
    date.setHours(hours, minutes);
    date.setHours(date.getHours() + durationHours);
    date.setMinutes(date.getMinutes() + durationMinutes);
    
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
}