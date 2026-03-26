CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  attractions TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  ticket_price NUMERIC NOT NULL DEFAULT 0,
  coordinates_lat DOUBLE PRECISION NOT NULL DEFAULT 0,
  coordinates_lng DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert access" ON public.events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public delete access" ON public.events FOR DELETE TO anon, authenticated USING (true);