import { Plus } from 'lucide-react';

interface FloatingAddButtonProps {
  onClick: () => void;
}

const FloatingAddButton = ({ onClick }: FloatingAddButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="floating-button"
      aria-label="Adicionar novo evento"
    >
      <Plus className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
    </button>
  );
};

export default FloatingAddButton;