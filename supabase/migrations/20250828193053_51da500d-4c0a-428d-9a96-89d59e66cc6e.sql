-- Criar tabela de eventos
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  attractions TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  ticket_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  coordinates_lat DECIMAL(10,8) NOT NULL,
  coordinates_lng DECIMAL(10,8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Política para permitir que todos vejam todos os eventos (eventos são públicos)
CREATE POLICY "Eventos são visíveis para todos" 
ON public.events 
FOR SELECT 
USING (true);

-- Política para permitir que qualquer pessoa adicione eventos
CREATE POLICY "Qualquer pessoa pode criar eventos" 
ON public.events 
FOR INSERT 
WITH CHECK (true);

-- Política para permitir que qualquer pessoa atualize eventos
CREATE POLICY "Qualquer pessoa pode atualizar eventos" 
ON public.events 
FOR UPDATE 
USING (true);

-- Política para permitir que qualquer pessoa delete eventos
CREATE POLICY "Qualquer pessoa pode deletar eventos" 
ON public.events 
FOR DELETE 
USING (true);

-- Criar função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar timestamps automaticamente
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir alguns eventos de exemplo em Aracaju
INSERT INTO public.events (name, category, attractions, date, time, location, ticket_price, coordinates_lat, coordinates_lng) VALUES
('Festival de Jazz de Aracaju', 'Show', 'Diana Krall, Hermeto Pascoal, Zimbo Trio', '2024-02-15', '20:00', 'Teatro Tobias Barreto', 80.00, -10.9095, -37.0748),
('Mostra de Cinema Sergipano', 'Cinema', 'Filmes inéditos, Debates com diretores', '2024-02-20', '19:30', 'Shopping Jardins', 0, -10.9178, -37.0526),
('Espetáculo de Dança Contemporânea', 'Dança', 'Companhia de Dança da Cidade, Grupo Corpo', '2024-02-25', '21:00', 'Centro Cultural de Aracaju', 45.00, -10.9075, -37.0601),
('Exposição de Arte Digital', 'Exposição', 'Instalações interativas, Realidade virtual', '2024-03-01', '14:00', 'Museu da Gente Sergipana', 0, -10.9122, -37.0716);