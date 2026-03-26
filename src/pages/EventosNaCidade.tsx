import { useState, useEffect, useCallback } from 'react';
import MapView from '@/components/MapView';
import EventForm from '@/components/EventForm';
import FloatingAddButton from '@/components/FloatingAddButton';
import SearchFilters from '@/components/SearchFilters';
import EventsPanel from '@/components/EventsPanel';
import { useEvents, Event } from '@/hooks/useEvents';

const EventosNaCidade = () => {
  const { events, loading, error, addEvent } = useEvents();
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Atualizar filteredEvents quando events mudarem
  useEffect(() => {
    setFilteredEvents(events);
  }, [events]);

  const handleFilterChange = useCallback((filtered: Event[]) => {
    setFilteredEvents(filtered);
  }, []);

  const handleAddEvent = async (newEventData: Omit<Event, 'id' | 'coordinates'>) => {
    try {
      const newEvent = await addEvent(newEventData);
      setFilteredEvents(prev => [...prev, newEvent]);
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
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
    <div className="relative h-screen w-screen">
      <SearchFilters 
        events={events} 
        onFilterChange={handleFilterChange}
      />
      <div className="pt-[140px] pb-[60px] h-full">
        <MapView events={filteredEvents} />
      </div>
      <EventsPanel 
        events={events}
        filteredEvents={filteredEvents}
      />
      <FloatingAddButton onClick={() => setIsFormOpen(true)} />
      <EventForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddEvent}
      />
    </div>
  );
};

export default EventosNaCidade;