import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Calendar, Clock, MapPin, Ticket, Music, Share2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Event } from '@/hooks/useEvents';

const categoryEmojis: Record<string, string> = {
  'Show': '🎵', 'Teatro': '🎭', 'Dança': '💃', 'Exposição': '🎨',
  'Cinema': '🎬', 'Festival': '🎪', 'Workshop': '🎯', 'Palestra': '🎤',
};

const MiniMap = ({ coordinates, location }: { coordinates: [number, number]; location: string }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    }).setView(coordinates, 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    const icon = L.divIcon({
      className: 'mini-map-marker',
      html: `<div style="width:32px;height:32px;background:hsl(var(--primary));border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid hsl(var(--background));box-shadow:0 2px 8px rgba(0,0,0,0.3);">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    L.marker(coordinates, { icon }).addTo(map);

    return () => { map.remove(); };
  }, [coordinates]);

  return (
    <div className="rounded-xl overflow-hidden border border-border">
      <div ref={mapRef} className="h-48 sm:h-64 w-full" />
      <a
        href={`https://www.google.com/maps?q=${coordinates[0]},${coordinates[1]}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-3 text-sm text-primary hover:bg-muted/50 transition-colors"
      >
        <MapPin className="w-4 h-4" />
        Abrir no Google Maps
      </a>
    </div>
  );
};

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setEvent({
          id: data.id,
          name: data.name,
          category: data.category,
          attractions: data.attractions,
          date: data.date,
          time: data.time,
          location: data.location,
          ticketPrice: data.ticket_price,
          coordinates: [data.coordinates_lat, data.coordinates_lng],
          imageUrl: data.image_url,
        });
      }
      setLoading(false);
    };
    fetchEvent();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
  };

  const formatPrice = (price: number) =>
    price === 0 ? 'Gratuito' : `R$ ${price.toFixed(2)}`;

  const handleShare = async () => {
    if (navigator.share && event) {
      await navigator.share({ title: event.name, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-72 w-full" />
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl text-muted-foreground">Evento não encontrado</p>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero image */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-accent/20 grid place-items-center">
            <span className="text-8xl opacity-50">
              {categoryEmojis[event.category] || '🎫'}
            </span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/60 backdrop-blur-sm hover:bg-background/80 rounded-full"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/60 backdrop-blur-sm hover:bg-background/80 rounded-full"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-16 relative z-10 pb-12">
        <Badge className="mb-3 bg-primary/15 text-primary">
          {categoryEmojis[event.category]} {event.category}
        </Badge>

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
          {event.name}
        </h1>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
            <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Data</p>
              <p className="text-sm font-medium text-foreground capitalize">
                {formatDate(event.date)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
            <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Horário</p>
              <p className="text-sm font-medium text-foreground">{event.time}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
            <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Local</p>
              <p className="text-sm font-medium text-foreground">{event.location}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
            <Ticket className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Ingresso</p>
              <p className="text-sm font-semibold text-primary">
                {formatPrice(event.ticketPrice)}
              </p>
            </div>
          </div>
        </div>

        {/* Attractions */}
        {event.attractions && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Music className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Atrações</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {event.attractions}
            </p>
          </div>
        )}

        {/* Mini Map */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Localização</h2>
          </div>
          <MiniMap coordinates={event.coordinates} location={event.location} />
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
