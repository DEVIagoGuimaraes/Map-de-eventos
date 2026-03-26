import { MapPin, Calendar, Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import type { Event } from '@/hooks/useEvents';
import { formatDistance } from '@/lib/distance';

interface EventCardProps {
  event: Event;
  distance?: number; // in km
}

const categoryColors: Record<string, string> = {
  'Show': 'bg-primary/15 text-primary',
  'Teatro': 'bg-accent/15 text-accent-foreground',
  'Dança': 'bg-primary/15 text-primary',
  'Exposição': 'bg-accent/15 text-accent-foreground',
  'Cinema': 'bg-primary/15 text-primary',
  'Festival': 'bg-accent/15 text-accent-foreground',
  'Workshop': 'bg-primary/15 text-primary',
  'Palestra': 'bg-accent/15 text-accent-foreground',
};

const categoryEmojis: Record<string, string> = {
  'Show': '🎵', 'Teatro': '🎭', 'Dança': '💃', 'Exposição': '🎨',
  'Cinema': '🎬', 'Festival': '🎪', 'Workshop': '🎯', 'Palestra': '🎤',
};

const EventCard = ({ event, distance }: EventCardProps) => {
  const navigate = useNavigate();
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Gratuito' : `R$ ${price.toFixed(2)}`;
  };

  return (
    <Card className="overflow-hidden border-border/50 hover:shadow-floating transition-all duration-300 group cursor-pointer" onClick={() => navigate(`/evento/${event.id}`)}>
      {/* Cover image or fallback */}
      <div className="h-36 relative overflow-hidden">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-accent/20 grid place-items-center">
            <span className="text-5xl opacity-60">{categoryEmojis[event.category] || '🎫'}</span>
          </div>
        )}
        <Badge className={`absolute top-2 left-2 text-xs ${categoryColors[event.category] || 'bg-muted text-muted-foreground'}`}>
          {event.category}
        </Badge>
        {distance !== undefined && (
          <Badge className="absolute top-2 right-2 text-xs bg-background/80 text-foreground backdrop-blur-sm border-none">
            <Navigation className="w-3 h-3 mr-1" />
            {formatDistance(distance)}
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground line-clamp-2 text-sm leading-snug group-hover:text-primary transition-colors">
          {event.name}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span>{formatDate(event.date)} • {event.time}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="line-clamp-1">{event.location}</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-sm font-semibold text-primary">
            {formatPrice(event.ticketPrice)}
          </p>
          {distance !== undefined && (
            <span className="text-xs text-muted-foreground">
              {formatDistance(distance)} de você
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
