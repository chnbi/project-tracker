-- This script creates a public 'profiles' table to store user data
-- that is safe to be publicly available, like names and avatar URLs.
-- It also includes a trigger to automatically create a profile when a new user signs up.

-- 1. Create the 'profiles' table
-- This table will store public user data.
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- 2. Set up RLS for the 'profiles' table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- 3. Create a trigger to automatically create a profile for new users
-- This function will be called every time a new user is created in the auth.users table.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new row into public.profiles, taking the user's ID and name from the auth table.
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger that executes the function after a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
