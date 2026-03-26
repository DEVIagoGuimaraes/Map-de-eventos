import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, MapPin, Calendar, Clock, DollarSign } from 'lucide-react';
import type { Event } from '@/hooks/useEvents';

interface EventsPanelProps {
  events: Event[];
  filteredEvents: Event[];
}

const EventsPanel = ({ events, filteredEvents }: EventsPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Show': '🎵',
      'Teatro': '🎭',
      'Dança': '💃',
      'Exposição': '🎨',
      'Cinema': '🎬',
      'Festival': '🎪',
      'Workshop': '🎯',
      'Palestra': '🎤',
      'Esporte': '⚽',
      'default': '🎫'
    };
    return icons[category] || icons.default;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Show': 'bg-primary/20 text-primary border-primary/30',
      'Teatro': 'bg-accent/20 text-accent border-accent/30',
      'Dança': 'bg-primary/15 text-primary border-primary/25',
      'Exposição': 'bg-accent/15 text-accent border-accent/25',
      'Cinema': 'bg-primary/20 text-primary border-primary/30',
      'Festival': 'bg-accent/20 text-accent border-accent/30',
      'Workshop': 'bg-primary/15 text-primary border-primary/25',
      'Palestra': 'bg-accent/15 text-accent border-accent/25',
      'default': 'bg-muted text-muted-foreground border-border'
    };
    return colors[category] || colors.default;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Gratuito' : `R$ ${price.toFixed(2)}`;
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Botão de expansão */}
      <div className="flex justify-center">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mb-2 bg-background/80 backdrop-blur-sm border shadow-lg hover:bg-accent"
        >
          <span className="mr-2">
            {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''}
          </span>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>

      {/* Painel de eventos */}
      {isExpanded && (
        <div className="bg-background/95 backdrop-blur-sm border-t border-border max-h-96 overflow-y-auto">
          <div className="p-4 space-y-3">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum evento encontrado com os filtros aplicados.</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <Card key={event.id} className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <Badge className={`${getCategoryColor(event.category)} border`}>
                        <span className="mr-1">{getCategoryIcon(event.category)}</span>
                        {event.category}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                      {event.name}
                    </h3>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                          <span>{event.time}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="font-medium text-primary">{formatPrice(event.ticketPrice)}</span>
                      </div>

                      {event.attractions && (
                        <p className="text-xs line-clamp-2 mt-2 text-muted-foreground/80">
                          {event.attractions}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPanel;