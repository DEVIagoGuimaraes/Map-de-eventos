import { Search, Plus, Menu, Ticket } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddEvent: () => void;
}

const Header = ({ searchTerm, onSearchChange, onAddEvent }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top row: logo + nav */}
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2" />

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <button onClick={onAddEvent} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Plus className="w-4 h-4" />
              Criar evento
            </button>
            <a href="#eventos" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Ticket className="w-4 h-4" />
              Meus eventos
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={onAddEvent}>
              <Plus className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="pb-3 flex gap-2 items-center">
          <div className="relative flex-1 max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar experiências..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-10 rounded-full bg-muted/50 border-border focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
