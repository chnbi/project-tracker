-- This script sets up your Supabase database tables, types, and security policies.
-- Run this in your Supabase project's SQL Editor.

-- 1. Create a custom type for the status enum
CREATE TYPE public.update_status AS ENUM (
    'Pending Update',
    'In Progress',
    'Completed',
    'Review',
    'Blocker',
    'QA',
    'IoT',
    'Live'
);

-- 2. Create the projects table
-- This table will store your main project entries.
CREATE TABLE public.projects (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    category text NOT NULL,
    sub_category text NULL,
    -- Link to the user who created the project
    owner_id uuid NOT NULL REFERENCES auth.users(id),
    CONSTRAINT projects_pkey PRIMARY KEY (id)
);

-- 3. Create the updates table
-- This table will store the history of updates for each project.
CREATE TABLE public.updates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    description text NOT NULL,
    status public.update_status NOT NULL,
    -- Link to the project this update belongs to. Deletes the update if the project is deleted.
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    -- Link to the user who posted the update
    user_id uuid NOT NULL REFERENCES auth.users(id),
    CONSTRAINT updates_pkey PRIMARY KEY (id)
);

-- 4. Enable Row Level Security (RLS)
-- This is a critical security step. It ensures users can only access data they're allowed to.
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for 'projects'
-- These rules define who can see, create, update, or delete projects.

-- Allow any authenticated user to see all projects.
CREATE POLICY "Allow authenticated users to see all projects"
ON public.projects FOR SELECT USING (auth.role() = 'authenticated');

-- Users can only create projects where they are the owner.
CREATE POLICY "Allow users to insert their own projects"
ON public.projects FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Users can only update projects they own.
CREATE POLICY "Allow owners to update their own projects"
ON public.projects FOR UPDATE USING (auth.uid() = owner_id);

-- Users can only delete projects they own.
CREATE POLICY "Allow owners to delete their own projects"
ON public.projects FOR DELETE USING (auth.uid() = owner_id);


-- 6. Create RLS Policies for 'updates'
-- These rules define who can interact with project updates.

-- Allow any authenticated user to see all updates.
CREATE POLICY "Allow authenticated users to see all updates"
ON public.updates FOR SELECT USING (auth.role() = 'authenticated');

-- Users can add updates and are marked as the author.
CREATE POLICY "Allow users to insert updates as themselves"
ON public.updates FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update updates they created.
CREATE POLICY "Allow authors to update their own updates"
ON public.updates FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete updates they created.
CREATE POLICY "Allow authors to delete their own updates"
ON public.updates FOR DELETE USING (auth.uid() = user_id);
