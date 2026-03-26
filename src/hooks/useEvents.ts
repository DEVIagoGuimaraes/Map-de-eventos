import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Event {
  id: string;
  name: string;
  category: string;
  attractions: string;
  date: string;
  time: string;
  location: string;
  ticketPrice: number;
  coordinates: [number, number];
  imageUrl: string;
}

// Tipo para dados do banco (snake_case)
interface DatabaseEvent {
  id: string;
  name: string;
  category: string;
  attractions: string;
  date: string;
  time: string;
  location: string;
  ticket_price: number;
  coordinates_lat: number;
  coordinates_lng: number;
  image_url: string;
}

// Converter dados do banco para formato da aplicação
const transformDatabaseEvent = (dbEvent: DatabaseEvent): Event => ({
  id: dbEvent.id,
  name: dbEvent.name,
  category: dbEvent.category,
  attractions: dbEvent.attractions,
  date: dbEvent.date,
  time: dbEvent.time,
  location: dbEvent.location,
  ticketPrice: dbEvent.ticket_price,
  coordinates: [dbEvent.coordinates_lat, dbEvent.coordinates_lng],
  imageUrl: dbEvent.image_url,
});

// Converter dados da aplicação para formato do banco
const transformToDatabase = (event: Omit<Event, 'id' | 'coordinates'>, coordinates: [number, number]) => ({
  name: event.name,
  category: event.category,
  attractions: event.attractions,
  date: event.date,
  time: event.time,
  location: event.location,
  ticket_price: event.ticketPrice,
  coordinates_lat: coordinates[0],
  coordinates_lng: coordinates[1],
  image_url: event.imageUrl || '',
});

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar eventos do banco
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        throw error;
      }

      const transformedEvents = data.map(transformDatabaseEvent);
      setEvents(transformedEvents);
    } catch (err) {
      console.error('Erro ao buscar eventos:', err);
      setError('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  // Adicionar novo evento
  const addEvent = async (newEventData: Omit<Event, 'id' | 'coordinates'>) => {
    try {
      // Geocoding do endereço
      const location = newEventData.location.trim();
      let geocodeUrl;
      
      if (location.toLowerCase().includes('aracaju')) {
        geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location + ', Sergipe, Brasil')}&limit=1&countrycodes=br`;
      } else {
        geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location + ', Aracaju, Sergipe, Brasil')}&limit=1&countrycodes=br`;
      }
      
      console.log('Buscando coordenadas para:', location);
      const response = await fetch(geocodeUrl);
      const data = await response.json();
      
      let coordinates: [number, number];
      
      if (data && data.length > 0) {
        coordinates = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        console.log('Coordenadas encontradas:', coordinates);
        
        // Verificar se está dentro de Aracaju
        const isInAracaju = (
          coordinates[0] >= -11.2 && coordinates[0] <= -10.7 && 
          coordinates[1] >= -37.4 && coordinates[1] <= -36.8
        );
        
        if (!isInAracaju) {
          console.warn('Coordenadas fora de Aracaju, usando fallback');
          coordinates = [
            -10.9472 + (Math.random() - 0.5) * 0.05,
            -37.0731 + (Math.random() - 0.5) * 0.05
          ];
        }
      } else {
        coordinates = [
          -10.9472 + (Math.random() - 0.5) * 0.05,
          -37.0731 + (Math.random() - 0.5) * 0.05
        ];
        console.warn('Endereço não encontrado, usando coordenadas aproximadas');
      }

      // Verificar eventos próximos e aplicar deslocamento
      const existingEventsAtLocation = events.filter(event => {
        const distance = Math.sqrt(
          Math.pow(event.coordinates[0] - coordinates[0], 2) +
          Math.pow(event.coordinates[1] - coordinates[1], 2)
        );
        return distance < 0.0001;
      });

      if (existingEventsAtLocation.length > 0) {
        const offset = 0.0002;
        const angle = (existingEventsAtLocation.length * 60) * (Math.PI / 180);
        coordinates[0] += Math.cos(angle) * offset;
        coordinates[1] += Math.sin(angle) * offset;
      }

      // Inserir no banco
      const { data: insertedEvent, error } = await supabase
        .from('events')
        .insert([transformToDatabase(newEventData, coordinates)])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Atualizar estado local
      const newEvent = transformDatabaseEvent(insertedEvent);
      setEvents(prev => [...prev, newEvent]);
      
      return newEvent;
    } catch (err) {
      console.error('Erro ao adicionar evento:', err);
      setError('Erro ao adicionar evento');
      throw err;
    }
  };

  // Deletar evento
  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) {
        throw error;
      }

      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (err) {
      console.error('Erro ao deletar evento:', err);
      setError('Erro ao deletar evento');
      throw err;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    error,
    addEvent,
    deleteEvent,
    refetch: fetchEvents
  };
};