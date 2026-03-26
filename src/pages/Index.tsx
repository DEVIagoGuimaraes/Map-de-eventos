import { useState, useMemo } from 'react';
import MapView from '@/components/MapView';
import EventForm from '@/components/EventForm';
import Header from '@/components/Header';
import CategoryBar from '@/components/CategoryBar';
import EventCard from '@/components/EventCard';
import { useEvents, Event } from '@/hooks/useEvents';
import { useGeolocation } from '@/hooks/useGeolocation';
import { calculateDistance } from '@/lib/distance';
import { ArrowDownUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type SortMode = 'date' | 'proximity';

const Index = () => {
  const { events, loading, error, addEvent, refetch } = useEvents();
  const geolocation = useGeolocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('date');

  const userLocation = useMemo(() => {
    if (geolocation.granted && geolocation.latitude !== null && geolocation.longitude !== null) {
      return [geolocation.latitude, geolocation.longitude] as [number, number];
    }
    return undefined;
  }, [geolocation.granted, geolocation.latitude, geolocation.longitude]);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(events.map(e => e.category)));
  }, [events]);

  // Calculate distances for all events
  const eventsWithDistance = useMemo(() => {
    return events.map(event => ({
      event,
      distance: userLocation
        ? calculateDistance(userLocation[0], userLocation[1], event.coordinates[0], event.coordinates[1])
        : undefined,
    }));
  }, [events, userLocation]);

  const filteredAndSortedEvents = useMemo(() => {
    let result = eventsWithDistance.filter(({ event }) => {
      const matchesSearch = searchTerm === '' || (
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.attractions.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(event.category);
      return matchesSearch && matchesCategory;
    });

    if (sortMode === 'proximity' && userLocation) {
      result.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    return result;
  }, [eventsWithDistance, searchTerm, selectedCategories, sortMode, userLocation]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleAddEvent = async (newEventData: Omit<Event, 'id' | 'coordinates'>) => {
    try {
      await addEvent(newEventData);
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">Erro ao carregar eventos</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddEvent={() => setIsFormOpen(true)}
      />

      <CategoryBar
        categories={uniqueCategories}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
      />

      {/* Map section */}
      <section className="border-b border-border">
        <div className="h-[350px] relative">
          <MapView
            events={filteredAndSortedEvents.map(e => e.event)}
            userLocation={userLocation}
          />
        </div>
      </section>

      {/* Events grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8" id="eventos">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {selectedCategories.length > 0 ? 'Eventos filtrados' : 'Explore eventos'}
          </h2>
          <div className="flex items-center gap-3">
            {userLocation && (
              <Button
                variant={sortMode === 'proximity' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortMode(prev => prev === 'proximity' ? 'date' : 'proximity')}
                className="text-xs gap-1.5"
              >
                <ArrowDownUp className="w-3.5 h-3.5" />
                {sortMode === 'proximity' ? 'Mais próximos' : 'Ordenar por proximidade'}
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              {filteredAndSortedEvents.length} evento{filteredAndSortedEvents.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {filteredAndSortedEvents.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">Nenhum evento encontrado</p>
            <p className="text-sm mt-1">Tente ajustar seus filtros</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAndSortedEvents.map(({ event, distance }) => (
              <EventCard key={event.id} event={event} distance={distance} />
            ))}
          </div>
        )}
      </section>

      <EventForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddEvent}
      />
    </div>
  );
};

export default Index;
