-- Create user_locations table
CREATE TABLE public.user_locations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    accuracy real NULL, -- Single precision float
    altitude real NULL, -- Single precision float
    timestamp timestamptz NOT NULL, -- Timestamp with time zone
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT user_locations_pkey PRIMARY KEY (id),
    CONSTRAINT user_locations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Policies for user_locations
-- Users can insert their own location data
CREATE POLICY "Allow users to insert their own location"
ON public.user_locations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can select their own location data
CREATE POLICY "Allow users to select their own location"
ON public.user_locations
FOR SELECT
USING (auth.uid() = user_id);

-- (Optional: Add policies for update/delete if needed later)
-- CREATE POLICY "Allow users to update their own location"
-- ON public.user_locations
-- FOR UPDATE
-- USING (auth.uid() = user_id)
-- WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Allow users to delete their own location"
-- ON public.user_locations
-- FOR DELETE
-- USING (auth.uid() = user_id);

-- Add comments to table and columns for clarity
COMMENT ON TABLE public.user_locations IS 'Stores location data for users.';
COMMENT ON COLUMN public.user_locations.id IS 'Primary key for the location entry.';
COMMENT ON COLUMN public.user_locations.user_id IS 'Foreign key referencing the user in auth.users.';
COMMENT ON COLUMN public.user_locations.latitude IS 'Latitude of the user''s location.';
COMMENT ON COLUMN public.user_locations.longitude IS 'Longitude of the user''s location.';
COMMENT ON COLUMN public.user_locations.accuracy IS 'Accuracy of the location reading in meters.';
COMMENT ON COLUMN public.user_locations.altitude IS 'Altitude of the user''s location in meters, if available.';
COMMENT ON COLUMN public.user_locations.timestamp IS 'Timestamp when the location was recorded by the device.';
COMMENT ON COLUMN public.user_locations.created_at IS 'Timestamp when the location record was created in the database.';
