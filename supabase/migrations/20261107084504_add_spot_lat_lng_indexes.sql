CREATE INDEX IF NOT EXISTS idx_spots_latitude ON public.spots USING btree (latitude);  
CREATE INDEX IF NOT EXISTS idx_spots_longitude ON public.spots USING btree (longitude);  
CREATE INDEX IF NOT EXISTS idx_spots_lat_lng ON public.spots USING btree (latitude, longitude); 
