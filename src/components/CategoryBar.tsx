import { Music, Drama, Palette, Film, PartyPopper, Wrench, Mic, Sparkles, Trophy } from 'lucide-react';

interface CategoryBarProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
}

const categoryMeta: Record<string, { icon: React.ReactNode; label: string }> = {
  'Show': { icon: <Music className="w-5 h-5" />, label: 'Shows' },
  'Teatro': { icon: <Drama className="w-5 h-5" />, label: 'Teatro' },
  'Dança': { icon: <Sparkles className="w-5 h-5" />, label: 'Dança' },
  'Exposição': { icon: <Palette className="w-5 h-5" />, label: 'Exposições' },
  'Cinema': { icon: <Film className="w-5 h-5" />, label: 'Cinema' },
  'Festival': { icon: <PartyPopper className="w-5 h-5" />, label: 'Festivais' },
  'Workshop': { icon: <Wrench className="w-5 h-5" />, label: 'Workshops' },
  'Palestra': { icon: <Mic className="w-5 h-5" />, label: 'Palestras' },
  'Esporte': { icon: <Trophy className="w-5 h-5" />, label: 'Esportes' },
};

const CategoryBar = ({ categories, selectedCategories, onCategoryToggle }: CategoryBarProps) => {
  if (categories.length === 0) return null;

  return (
    <section className="border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center gap-4 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => {
            const meta = categoryMeta[cat] || { icon: <Sparkles className="w-5 h-5" />, label: cat };
            const isSelected = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => onCategoryToggle(cat)}
                className={`flex flex-col items-center gap-1.5 min-w-[72px] group transition-all`}
              >
                <div
                  className={`w-14 h-14 rounded-full grid place-items-center transition-all border-2 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                      : 'bg-muted/60 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {meta.icon}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${
                  isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                }`}>
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryBar;
