export interface Activity {
  title: string;
  image: string;
  description: string;
  schedule: string;
  benefits: string;
  location: {
    name: string;
    address: string;
    mapsUrl: string;
  };
}