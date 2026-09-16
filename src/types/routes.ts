export interface Coordinates {
  lat: number;
  lon: number;
}

export interface GeocodeRequest {
  address: string;
}

export interface GeocodeSuggestion {
  id: string;
  lat: number;
  lon: number;
  label: string;
  primary: string;
  secondary: string;
}

export interface RoutesRequest {
  lat: number;
  lon: number;
  steps: number;
  stepLength: number;
}

export interface RouteResult {
  distance: number;
  duration: number;
  steps: number;
  geometry: Coordinates[];
  seed: number;
}

export interface RoutesResponse {
  targetDistance: number;
  routes: RouteResult[];
}
