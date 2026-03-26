import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import type { Event } from '@/hooks/useEvents';

interface SearchFiltersProps {
  events: Event[];
  onFilterChange: (filteredEvents: Event[]) => void;
}

const SearchFilters = ({ events, onFilterChange }: SearchFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Extrair categorias únicas dos eventos
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(events.map(event => event.category)));
  }, [events]);

  // Filtrar eventos baseado na busca e categorias selecionadas
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = searchTerm === '' || (
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.attractions.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.category.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(event.category);

      return matchesSearch && matchesCategory;
    });
  }, [events, searchTerm, selectedCategories]);

  // Atualizar filtros sempre que os filtros mudarem
  useEffect(() => {
    onFilterChange(filteredEvents);
  }, [filteredEvents, onFilterChange]);

  // Filtrar por categoria
  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Show': 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30',
      'Teatro': 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30',
      'Dança': 'bg-pink-500/20 text-pink-300 border-pink-500/30 hover:bg-pink-500/30',
      'Exposição': 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30',
      'Cinema': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30',
      'Festival': 'bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30',
      'Workshop': 'bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30',
      'Palestra': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30',
      'default': 'bg-gray-500/20 text-gray-300 border-gray-500/30 hover:bg-gray-500/30'
    };
    return colors[category] || colors.default;
  };

  const getSelectedCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Show': 'bg-purple-500 text-white border-purple-500',
      'Teatro': 'bg-red-500 text-white border-red-500',
      'Dança': 'bg-pink-500 text-white border-pink-500',
      'Exposição': 'bg-blue-500 text-white border-blue-500',
      'Cinema': 'bg-yellow-500 text-white border-yellow-500',
      'Festival': 'bg-green-500 text-white border-green-500',
      'Workshop': 'bg-orange-500 text-white border-orange-500',
      'Palestra': 'bg-indigo-500 text-white border-indigo-500',
      'default': 'bg-gray-500 text-white border-gray-500'
    };
    return colors[category] || colors.default;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="p-4 space-y-4">
        {/* Barra de pesquisa */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar eventos, locais, atrações..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 bg-background/50 border-border"
          />
        </div>

        {/* Filtros de categoria */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Categorias</span>
            {(selectedCategories.length > 0 || searchTerm) && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Limpar filtros
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {uniqueCategories.map(category => (
              <Badge
                key={category}
                className={`cursor-pointer border transition-all duration-200 ${
                  selectedCategories.includes(category)
                    ? getSelectedCategoryColor(category)
                    : getCategoryColor(category)
                }`}
                onClick={() => handleCategoryToggle(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Contador de eventos */}
        <div className="text-sm text-muted-foreground">
          {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''} encontrado{filteredEvents.length !== 1 ? 's' : ''}
          {selectedCategories.length > 0 && (
            <span className="ml-1">
              • {selectedCategories.length} categoria{selectedCategories.length !== 1 ? 's' : ''} selecionada{selectedCategories.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;