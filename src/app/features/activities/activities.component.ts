import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Activity } from './models/activity.interface';

@Component({
  selector: 'app-activities',
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivitiesComponent {
  readonly activities: Activity[] = [
    {
      title: 'Zumba Suau',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=800',
      description: 'Ball i exercici adaptat per a totes les edats. Classes divertides i energètiques que milloren la coordinació i la resistència.',
      schedule: 'Dilluns i Dimecres 10:00 - 11:00',
      benefits: 'Millora el ritme, la coordinació i la resistència cardiovascular',
      location: {
        name: 'Centre Cívic La Salut',
        address: 'Av. Marquès de Sant Mori, s/n, 08914 Badalona',
        mapsUrl: 'https://maps.google.com/?q=Centre+Civic+La+Salut+Badalona'
      }
    },
    {
      title: 'Pilates',
      image: 'https://images.unsplash.com/photo-1571019613576-2b22c76fd955?auto=format&fit=crop&q=80&w=800',
      description: 'Exercicis suaus per millorar la flexibilitat i l\'equilibri. Ideal per enfortir els músculs i millorar la postura.',
      schedule: 'Dimarts i Dijous 10:00 - 11:00',
      benefits: 'Enforteix el cos, millora la flexibilitat i l\'equilibri',
      location: {
        name: 'Centre Cívic La Salut',
        address: 'Av. Marquès de Sant Mori, s/n, 08914 Badalona',
        mapsUrl: 'https://maps.google.com/?q=Centre+Civic+La+Salut+Badalona'
      }
    },
    {
      title: 'Microgimnàstica',
      image: 'https://images.unsplash.com/photo-1571847140471-1d7766e825ea?auto=format&fit=crop&q=80&w=800',
      description: 'Exercicis adaptats per mantenir-nos en forma. Sessions suaus i progressives per millorar la mobilitat.',
      schedule: 'Divendres 10:00 - 11:00',
      benefits: 'Millora la mobilitat i el benestar general',
      location: {
        name: 'Centre Cívic Torre Mena',
        address: 'Carrer de Ramiro de Maeztu, 25, 08914 Badalona',
        mapsUrl: 'https://maps.google.com/?q=Centre+Civic+Torre+Mena+Badalona'
      }
    }
  ];
}