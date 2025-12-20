import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, ProjectContextType, Status, Update } from '../types';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customSubCategories, setCustomSubCategories] = useState<Record<string, string[]>>({});
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
        subCategory: p.sub_category, // Map snake_case to camelCase
        status: p.status as Status,
        updates: (p.updates || []).map((u: any) => ({
          id: u.id,
          date: u.date,
          description: u.description,
          person: u.person,
          status: u.status as Status
        })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Sort updates desc
      }));

      setProjects(formattedProjects);

      // 2. Fetch Categories
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('name');

      if (catError) console.error('Error fetching categories:', catError);
      else setCustomCategories((catData || []).map(c => c.name));

      // 3. Fetch Subcategories
      const { data: subCatData, error: subCatError } = await supabase
        .from('subcategories')
        .select('category_name, name');

      if (subCatError) console.error('Error fetching subcategories:', subCatError);
      else {
        const subMap: Record<string, string[]> = {};
        subCatData?.forEach(sc => {
          if (!subMap[sc.category_name]) subMap[sc.category_name] = [];
          subMap[sc.category_name].push(sc.name);
        });
        setCustomSubCategories(subMap);
      }

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

  const addProject = async (data: Omit<Project, 'id' | 'updates'> & { initialStatus: Status, initialDescription?: string }) => {
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
        sub_category: data.subCategory,
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
        person: user.name,
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
      if (data.subCategory) updates.sub_category = data.subCategory;
      if (data.status) updates.status = data.status;

      const { error } = await supabase.from('projects').update(updates).eq('id', id);
      if (error) throw error;

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

  const addUpdate = async (projectId: string, updateData: Omit<Update, 'id' | 'date'>) => {
    try {
      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');

      const { error } = await supabase.from('updates').insert({
        project_id: projectId,
        date: today,
        description: updateData.description,
        person: updateData.person,
        status: updateData.status
      });

      if (error) throw error;
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
      // Person usually doesn't change history but we can support it

      const { error } = await supabase.from('updates').update(updates).eq('id', updateId);
      if (error) throw error;
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
    if (!user) return; // Only auth users can add meta
    // Optimistic update
    if (!customCategories.includes(category)) {
      setCustomCategories(prev => [...prev, category]);
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

  const addSubCategory = async (category: string, subCategory: string) => {
    if (!user) return;

    // Optimistic check
    const existing = customSubCategories[category] || [];
    if (!existing.includes(subCategory)) {
      // Optimistic UI update could be complex with state, let's just push and fetch for safety for now or straightforward state
      try {
        const { error } = await supabase.from('subcategories').insert({
          category_name: category,
          name: subCategory,
          created_by: user.id
        });
        if (error) throw error;
        fetchData();
      } catch (e) {
        console.error("Error adding subcategory", e);
      }
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
      customSubCategories,
      addSubCategory
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
