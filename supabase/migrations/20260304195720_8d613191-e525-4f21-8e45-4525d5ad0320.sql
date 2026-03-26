INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true);

CREATE POLICY "Allow public upload to event-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-images');

CREATE POLICY "Allow public read from event-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');