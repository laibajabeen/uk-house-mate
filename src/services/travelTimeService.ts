interface TravelTimeRequest {
  origin: [number, number]; // [longitude, latitude]
  destination: string | [number, number]; // address or coordinates
  mode: 'driving' | 'walking' | 'cycling';
}

interface TravelTimeResponse {
  duration: number; // in seconds
  distance: number; // in meters
  mode: string;
}

export class TravelTimeService {
  private baseUrl = 'https://router.project-osrm.org';

  constructor() {
    // No API key needed for OSRM
  }

  async calculateTravelTime(request: TravelTimeRequest): Promise<TravelTimeResponse | null> {
    try {
      // Convert address to coordinates if needed
      let destinationCoords: [number, number];
      
      if (typeof request.destination === 'string') {
        const geocoded = await this.geocodeAddress(request.destination);
        if (!geocoded) return null;
        destinationCoords = geocoded;
      } else {
        destinationCoords = request.destination;
      }

      const profile = this.getOSRMProfile(request.mode);
      const coordinates = `${request.origin[0]},${request.origin[1]};${destinationCoords[0]},${destinationCoords[1]}`;
      
      const url = `${this.baseUrl}/route/v1/${profile}/${coordinates}?overview=false&alternatives=false&steps=false`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.status}`);
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
      // Use Nominatim (OpenStreetMap) for free geocoding
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=gb&limit=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'RealEstate-App/1.0'
        }
      });
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        return null;
      }

      const result = data[0];
      return [parseFloat(result.lon), parseFloat(result.lat)]; // [longitude, latitude]
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  private getOSRMProfile(mode: string): string {
    switch (mode) {
      case 'driving': return 'driving';
      case 'walking': return 'foot';
      case 'cycling': return 'cycling';
      case 'bicycling': return 'cycling';
      default: return 'foot';
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