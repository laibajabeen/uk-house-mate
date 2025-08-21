interface TravelTimeRequest {
  origin: [number, number]; // [longitude, latitude]
  destination: string; // address or coordinates
  mode: 'driving' | 'walking' | 'cycling';
}

interface TravelTimeResponse {
  duration: number; // in seconds
  distance: number; // in meters
  mode: string;
}

export class TravelTimeService {
  private apiKey: string;
  private baseUrl = 'https://api.mapbox.com/directions/v5/mapbox';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async calculateTravelTime(request: TravelTimeRequest): Promise<TravelTimeResponse | null> {
    try {
      // Convert address to coordinates if needed
      let destinationCoords: string;
      
      if (typeof request.destination === 'string') {
        const geocoded = await this.geocodeAddress(request.destination);
        if (!geocoded) return null;
        destinationCoords = `${geocoded[0]},${geocoded[1]}`;
      } else {
        destinationCoords = `${request.destination[0]},${request.destination[1]}`;
      }

      const profile = this.getMapboxProfile(request.mode);
      const coordinates = `${request.origin[0]},${request.origin[1]};${destinationCoords}`;
      
      const url = `${this.baseUrl}/${profile}/${coordinates}?access_token=${this.apiKey}&geometries=geojson`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.routes || data.routes.length === 0) {
        return null;
      }

      const route = data.routes[0];
      
      return {
        duration: route.duration,
        distance: route.distance,
        mode: request.mode
      };
    } catch (error) {
      console.error('Travel time calculation error:', error);
      return null;
    }
  }

  private async geocodeAddress(address: string): Promise<[number, number] | null> {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${this.apiKey}&country=GB&limit=1`;
      
      const response = await fetch(url);
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (!data.features || data.features.length === 0) {
        return null;
      }

      const coordinates = data.features[0].geometry.coordinates;
      return [coordinates[0], coordinates[1]]; // [longitude, latitude]
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  private getMapboxProfile(mode: string): string {
    switch (mode) {
      case 'driving': return 'driving';
      case 'walking': return 'walking';
      case 'cycling': return 'cycling';
      default: return 'walking';
    }
  }

  async calculateMultipleDestinations(
    propertyCoords: [number, number],
    destinations: Array<{ address: string; mode: string }>
  ): Promise<Array<TravelTimeResponse | null>> {
    const promises = destinations.map(dest => 
      this.calculateTravelTime({
        origin: propertyCoords,
        destination: dest.address,
        mode: dest.mode as any
      })
    );

    return Promise.all(promises);
  }
}

export function formatTravelTime(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  
  const km = meters / 1000;
  if (km < 10) {
    return `${km.toFixed(1)}km`;
  }
  
  return `${Math.round(km)}km`;
}