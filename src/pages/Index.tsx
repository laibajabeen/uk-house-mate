import { useState, useEffect } from "react";
import { MapPin, Home, Clock, Zap } from "lucide-react";
import PropertySearch from "@/components/PropertySearch";
import PropertyCard from "@/components/PropertyCard";
import PropertyMap from "@/components/PropertyMap";
import TravelCalculator from "@/components/TravelCalculator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TravelTimeService, formatTravelTime, formatDistance } from "@/services/travelTimeService";
import heroImage from "@/assets/hero-property.jpg";

interface SearchFilters {
  location: string;
  minBudget: string;
  maxBudget: string;
  propertyType: string;
}

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  priceType: "week" | "month";
  propertyType: "room" | "flat" | "house" | "studio";
  bedrooms?: number;
  bathrooms?: number;
  image: string;
  latitude: number;
  longitude: number;
  distance?: string;
  travelTime?: string;
  available: boolean;
  calculatedTravelTimes?: Array<{
    destinationName: string;
    duration: string;
    distance: string;
    mode: string;
  }>;
}

interface TravelDestination {
  id: string;
  name: string;
  address: string;
  travelMode: "driving" | "transit" | "walking" | "bicycling";
}

// Mock data for demonstration
const mockProperties: Property[] = [
  {
    id: "1",
    title: "Cozy Room in Shared House - Camden",
    location: "Camden, London",
    price: 650,
    priceType: "month",
    propertyType: "room",
    bedrooms: 1,
    bathrooms: 1,
    image: heroImage,
    latitude: 51.5392,
    longitude: -0.1426,
    distance: "2.3 miles",
    travelTime: "25 min",
    available: true
  },
  {
    id: "2",
    title: "Modern Studio Apartment",
    location: "King's Cross, London",
    price: 1200,
    priceType: "month",
    propertyType: "studio",
    bathrooms: 1,
    image: heroImage,
    latitude: 51.5301,
    longitude: -0.1240,
    distance: "1.8 miles",
    travelTime: "20 min",
    available: true
  },
  {
    id: "3",
    title: "Spacious 2-Bed Flat",
    location: "Islington, London",
    price: 2000,
    priceType: "month",
    propertyType: "flat",
    bedrooms: 2,
    bathrooms: 1,
    image: heroImage,
    latitude: 51.5416,
    longitude: -0.1022,
    distance: "3.1 miles",
    travelTime: "35 min",
    available: false
  }
];

const Index = () => {
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null);
  const [travelDestinations, setTravelDestinations] = useState<TravelDestination[]>([]);
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
    toast({
      title: "Search Updated",
      description: `Searching for ${filters.propertyType || 'properties'} in ${filters.location || 'all areas'}`,
    });
  };

  const handleContact = (property: Property) => {
    toast({
      title: "Contact Request Sent",
      description: `Our agent will contact the landlord for "${property.title}" and get back to you soon.`,
    });
  };

  const handleViewDetails = (property: Property) => {
    toast({
      title: "Property Details",
      description: `Opening details for "${property.title}"`,
    });
  };


  const calculateTravelTimes = async (destinations: TravelDestination[]) => {
    if (destinations.length === 0) {
      // Reset travel times if no destinations
      setProperties(prevProperties => 
        prevProperties.map(property => ({
          ...property,
          calculatedTravelTimes: []
        }))
      );
      return;
    }

    setIsCalculating(true);
    const travelService = new TravelTimeService();

    try {
      const updatedProperties = await Promise.all(
        properties.map(async (property) => {
          const travelTimes = await travelService.calculateMultipleDestinations(
            [property.longitude, property.latitude],
            destinations.map(dest => ({
              address: dest.address,
              mode: dest.travelMode
            }))
          );

          const calculatedTravelTimes = destinations.map((dest, index) => {
            const result = travelTimes[index];
            return {
              destinationName: dest.name,
              duration: result ? formatTravelTime(result.duration) : 'N/A',
              distance: result ? formatDistance(result.distance) : 'N/A',
              mode: dest.travelMode
            };
          }).filter(time => time.duration !== 'N/A');

          return {
            ...property,
            calculatedTravelTimes
          };
        })
      );

      setProperties(updatedProperties);
      
      toast({
        title: "Travel Times Updated",
        description: `Calculated travel times for ${destinations.length} destination(s)`,
      });
    } catch (error) {
      console.error('Travel time calculation failed:', error);
      toast({
        title: "Calculation Failed",
        description: "Unable to calculate travel times. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Calculate travel times when destinations change
  useEffect(() => {
    calculateTravelTimes(travelDestinations);
  }, [travelDestinations]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary to-primary-hover text-primary-foreground py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Find Your Perfect Home in the UK
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-3xl mx-auto">
            Discover properties by budget and location, see travel times to your favorite places, 
            and let our agents handle the contact process for you.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
              <Home className="h-5 w-5" />
              <span>Budget-Based Search</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
              <Clock className="h-5 w-5" />
              <span>Travel Time Calculator</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
              <Zap className="h-5 w-5" />
              <span>Auto Contact Forms</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 container mx-auto px-6">
        <PropertySearch onSearch={handleSearch} />
      </section>

      {/* Main Content */}
      <section className="py-8 container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Travel Calculator Sidebar */}
          <div className="lg:col-span-1">
            <TravelCalculator 
              onDestinationsChange={setTravelDestinations}
            />
            {isCalculating && (
              <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-primary">Calculating travel times...</p>
              </div>
            )}
          </div>

          {/* Properties and Map */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  List View
                </TabsTrigger>
                <TabsTrigger value="map" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Map View
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">
                    Available Properties
                  </h2>
                  <span className="text-muted-foreground">
                    {properties.length} properties found
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {properties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onContact={handleContact}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="map" className="h-[600px]">
                <PropertyMap
                  properties={properties}
                  center={[51.5074, -0.1278]} // London center
                  onPropertyClick={handleViewDetails}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose RealEstate Buddy?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We make finding your perfect home easier with smart features designed for busy people.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-card rounded-xl shadow-card">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Budget Search</h3>
              <p className="text-muted-foreground">
                Find properties that match your exact budget and location preferences across the UK.
              </p>
            </div>
            <div className="text-center p-8 bg-card rounded-xl shadow-card">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Travel Time Insights</h3>
              <p className="text-muted-foreground">
                See exactly how long it takes to get to work, gym, or anywhere else that matters to you.
              </p>
            </div>
            <div className="text-center p-8 bg-card rounded-xl shadow-card">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Auto Contact Forms</h3>
              <p className="text-muted-foreground">
                Our agents handle all the paperwork and contact forms, so you don't have to.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;