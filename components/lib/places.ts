export interface PlaceSelection {
  description: string;
  placeId?: string;
  location?: {
    lat: number;
    lng: number;
  };
}
