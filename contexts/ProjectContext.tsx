import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, ProjectContextType, Status, Update } from '../types';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const { user } = useAuth();

  // Fetch data on mount or when user changes
  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // 1. Fetch Projects & Updates
      // Note: We need to join updates. Supabase returns nested data.
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          updates (*)
        `)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Map DB structure to our App structure
      const formattedProjects: Project[] = (projectsData || []).map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        status: p.status as Status,
        updates: (p.updates || [])
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Sort updates desc before mapping
          .map((u: any) => ({
            id: u.id,
            date: u.date,
            description: u.description,
            person: u.person,
            provider: u.provider,
            status: u.status as Status,
            // provider might be missing in older rows, ensure handled
          }))
      }));

      setProjects(formattedProjects);

      // 2. Fetch Categories
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('name');

      if (catError) console.error('Error fetching categories:', catError);
      else setCustomCategories((catData || []).map(c => c.name));

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Simple UUID v4 fallback
  const uuidv4 = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const addProject = async (data: Omit<Project, 'id' | 'updates'> & { initialStatus: Status, initialDescription?: string, initialPic?: string }) => {
    if (!user) {
      alert('You must be logged in to add a project.');
      return;
    }

    try {
      const projectId = uuidv4();
      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');

      console.log('Attempting to add project:', { projectId, userId: user.id, data });

      // 1. Insert Project
      const { error: projError } = await supabase.from('projects').insert({
        id: projectId,
        user_id: user.id,
        name: data.name,
        category: data.category,
        status: data.initialStatus
      });

      if (projError) {
        console.error('Supabase Project Insert Error:', projError);
        throw projError;
      }

      // 2. Insert Initial Update
      const { error: upError } = await supabase.from('updates').insert({
        project_id: projectId,
        date: today,
        description: data.initialDescription || 'Project initiated',
        person: data.initialPic || user.name, // Use provided PIC or fallback to user
        provider: user.name, // Record who created it
        status: data.initialStatus
      });

      if (upError) {
        console.error('Supabase Update Insert Error:', upError);
        // Note: Project was created, but update failed. You might want to delete the project or warn user.
        throw upError;
      }

      // Optimistic update or refetch
      fetchData();

    } catch (error: any) {
      console.error('FULL Error adding project:', error);
      alert(`Error adding project: ${error.message || JSON.stringify(error)}`);
    }
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    try {
      const updates: any = {};
      if (data.name) updates.name = data.name;
      if (data.category) updates.category = data.category;
      if (data.status) updates.status = data.status;

      const { error } = await supabase.from('projects').update(updates).eq('id', id);
      if (error) throw error;

      // If status changed, also update the latest update's status
      if (data.status) {
        const project = projects.find(p => p.id === id);
        if (project && project.updates.length > 0) {
          const latestUpdate = project.updates[0];
          await supabase.from('updates').update({ status: data.status }).eq('id', latestUpdate.id);
        }
      }

      fetchData();
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const addUpdate = async (projectId: string, updateData: Omit<Update, 'id' | 'date' | 'provider'>) => {
    if (!user) return; // Guard 

    try {
      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');

      const { error } = await supabase.from('updates').insert({
        project_id: projectId,
        date: today,
        description: updateData.description,
        person: updateData.person, // The PIC
        provider: user.name, // The logged in user
        status: updateData.status
      });

      if (error) throw error;

      // New update is always the latest - sync its status to the project
      await supabase.from('projects').update({ status: updateData.status }).eq('id', projectId);

      fetchData();
    } catch (error) {
      console.error('Error adding update:', error);
    }
  };

  // Missing in previous context but needed for types
  const editUpdate = async (projectId: string, updateId: string, data: Partial<Update>) => {
    try {
      const updates: any = {};
      if (data.description) updates.description = data.description;
      if (data.status) updates.status = data.status;
      if (data.person) updates.person = data.person;

      const { error } = await supabase.from('updates').update(updates).eq('id', updateId);
      if (error) throw error;

      // Check if this is the latest update - if so, sync status to project
      if (data.status) {
        const project = projects.find(p => p.id === projectId);
        if (project && project.updates.length > 0) {
          // Find the latest update (first in array, assuming sorted by date desc)
          const latestUpdate = project.updates[0];
          if (latestUpdate.id === updateId) {
            // This is the latest update, sync status to project
            await supabase.from('projects').update({ status: data.status }).eq('id', projectId);
          }
        }
      }

      fetchData();
    } catch (error) {
      console.error('Error editing update:', error);
    }
  };

  const deleteUpdate = async (projectId: string, updateId: string) => {
    try {
      const { error } = await supabase.from('updates').delete().eq('id', updateId);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting update:', error);
    }
  };

  const addCategory = async (category: string) => {
    if (!user) return;
    // Optimistic update
    if (!customCategories.includes(category)) {
      setCustomCategories(prev => [...prev, category].sort());
      try {
        const { error } = await supabase.from('categories').insert({
          name: category,
          created_by: user.id
        });
        if (error) throw error;
      } catch (e) {
        console.error("Error adding category", e);
        fetchData(); // Revert on error
      }
    }
  };

  const renameCategory = async (oldName: string, newName: string) => {
    if (!user) return;

    // Optimistic
    setCustomCategories(prev => prev.map(c => c === oldName ? newName : c).sort());

    try {
      // 1. Update Category Table
      const { error: catError } = await supabase
        .from('categories')
        .update({ name: newName })
        .eq('name', oldName);

      if (catError) throw catError;

      // 2. Update Projects that use this category (Supabase might cascade if FK, but likely logic needed)
      // Since we store category as string in projects table (denormalized usually or simple column), update it.
      await supabase.from('projects').update({ category: newName }).eq('category', oldName);

      // Re-fetch to sync
      fetchData();

    } catch (e) {
      console.error("Error renaming category", e);
      fetchData();
    }
  };

  const deleteCategory = async (name: string) => {
    if (!user) return;

    if (!confirm(`Are you sure you want to delete category "${name}"? Projects using it might lose their category.`)) return;

    // Optimistic
    setCustomCategories(prev => prev.filter(c => c !== name));

    try {
      const { error } = await supabase.from('categories').delete().eq('name', name);
      if (error) throw error;

      // Projects with this category might need handling? 
      // Ideally set to 'Uncategorized' or leave as is (broken link). 
      // Let's assume user knows risks or we just leave them.

    } catch (e) {
      console.error("Error deleting category", e);
      fetchData();
    }
  };

  const renameStatus = async (oldName: string, newName: string) => {
    if (!user || !newName.trim()) return;
    try {
      // Update all projects
      await supabase.from('projects').update({ status: newName }).eq('status', oldName);
      // Update all updates
      await supabase.from('updates').update({ status: newName }).eq('status', oldName);
      fetchData();
    } catch (e) {
      console.error("Error renaming status", e);
    }
  };

  const deleteStatus = async (name: string) => {
    if (!user) return;
    if (!confirm(`Delete status "${name}"? Projects with this status will be unaffected but the filter will disappear if no projects use it.`)) return;
    // Since statuses are dynamic/derived, we can't 'delete' them from a list unless we change the projects using them.
    // For now, maybe just warn? Or do we set them to 'Unknown'?
    // Let's offer to Bulk Change? Or just do nothing and explain.
    alert("To delete a status, please change the status of all projects using it to something else.");
  };

  const renamePerson = async (oldName: string, newName: string) => {
    if (!user || !newName.trim()) return;
    try {
      // Update updates person
      await supabase.from('updates').update({ person: newName }).eq('person', oldName);
      fetchData();
    } catch (e) {
      console.error("Error renaming person", e);
    }
  };

  const deletePerson = async (name: string) => {
    // Deleting a person usually means removing their history? Or just renaming to Unknown?
    // Let's advise renaming.
    alert("Cannot delete a person record directly. Try renaming them or re-assigning their updates.");
  };


  const updateProviderName = async (oldName: string, newName: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('updates')
        .update({ provider: newName })
        .eq('provider', oldName);

      if (error) {
        console.error('Error updating provider names:', error);
      } else {
        await fetchData(); // Refresh all data to reflect changes
      }
    } catch (err) {
      console.error('Error in updateProviderName:', err);
    }
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      addProject,
      updateProject,
      deleteProject,
      addUpdate,
      editUpdate,
      deleteUpdate,
      customCategories,
      addCategory,
      renameCategory,
      deleteCategory,
      renameStatus,
      deleteStatus,
      renamePerson,
      deletePerson,
      updateProviderName
    }}>
      {children}
    </ProjectContext.Provider>
  );
};


export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};
