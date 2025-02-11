export interface Sighting {
  id: string;
  location: string;
  latitude: number;
  longitude: number;
  description?: string;
  timestamp: string;
  lastConfirmedAt?: string;
  isActive?: boolean;
  confirmationCount?: number;
  inactiveCount?: number;
}

export interface RadiusOptions {
  radius: number;
  latitude: number;
  longitude: number;
}
