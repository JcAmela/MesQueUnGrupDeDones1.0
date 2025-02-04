export interface Class {
  id: string;
  title: string;
  description: string;
  datetime: string;
  duration: string;
  max_participants: number;
  instructor_name: string;
  location: string;
  created_at: string;
  updated_at: string;
  reservations?: Array<{ id: string; user_id: string; status: string }>;
  waiting_list?: Array<{ id: string; user_id: string; position: number }>;
  isUserReservation?: boolean;
  confirmedReservations?: Array<{ id: string; user_id: string; status: string }>;
}

export interface Reservation {
  id: string;
  user_id: string;
  class_id: string;
  status: 'confirmed' | 'cancelled' | 'waitlist';
  qr_code: string | null;
  created_at: string;
  updated_at: string;
  class?: Class;
}

export interface WaitingListEntry {
  id: string;
  user_id: string;
  class_id: string;
  position: number;
  created_at: string;
}

export interface Profile {
  id: string;
  name: string;
  phone: string;
  preferred_language: string;
  created_at: string;
  updated_at: string;
}