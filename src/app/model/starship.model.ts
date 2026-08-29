export interface Starship {
  id: number;
  name: string;
  model: string;
  manufacturer: string;
  crew: string;
  passenger: string;
  hyperdrive_rating: string;
  url:string;
}

export interface SWAPIResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Starship[];
}

