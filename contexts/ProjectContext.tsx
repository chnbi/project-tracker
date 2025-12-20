import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, ProjectContextType, Status, Update } from '../types';
import { storage } from '../utils/storage';
import { PROJECTS as SEED_DATA } from '../constants';
import { useAuth } from './AuthContext';

const DATA_KEY = 'minusone_data';

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customSubCategories, setCustomSubCategories] = useState<Record<string, string[]>>({});
  const { user } = useAuth();

  // Initialize data
  useEffect(() => {
    const storedProjects = storage.get<Project[]>(DATA_KEY, []);
    const storedCategories = storage.get<string[]>('minusone_categories', []);
    const storedSubCategories = storage.get<Record<string, string[]>>('minusone_subcategories', {});

    if (storedProjects.length === 0) {
      setProjects(SEED_DATA);
      storage.set(DATA_KEY, SEED_DATA);
    } else {
      setProjects(storedProjects);
    }
    setCustomCategories(storedCategories);
    setCustomSubCategories(storedSubCategories);
  }, []);

  // Persist on change
  useEffect(() => {
    if (projects.length > 0) {
      storage.set(DATA_KEY, projects);
    }
  }, [projects]);

  useEffect(() => {
    storage.set('minusone_categories', customCategories);
  }, [customCategories]);

  useEffect(() => {
    storage.set('minusone_subcategories', customSubCategories);
  }, [customSubCategories]);

  const addProject = (data: Omit<Project, 'id' | 'updates'> & { initialStatus: Status, initialDescription?: string }) => {
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');

    const newUpdate: Update = {
      id: crypto.randomUUID(),
      date: today,
      description: data.initialDescription || 'Project initiated',
      person: user?.name || 'Unknown',
      status: data.initialStatus
    };

    const newProject: Project = {
      id: crypto.randomUUID(),
      name: data.name,
      category: data.category,
      subCategory: data.subCategory,
      status: data.initialStatus,
      updates: [newUpdate]
    };

    setProjects(prev => [newProject, ...prev]);
  };

  const updateProject = (id: string, data: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const addUpdate = (projectId: string, updateData: Omit<Update, 'id' | 'date'>) => {
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');

    const newUpdate: Update = {
      id: crypto.randomUUID(),
      date: today,
      ...updateData
    };

    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          updates: [newUpdate, ...p.updates]
        };
      }
      return p;
    }));
  };

  const editUpdate = (projectId: string, updateId: string, data: Partial<Update>) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          updates: p.updates.map(u => u.id === updateId ? { ...u, ...data } : u)
        };
      }
      return p;
    }));
  };

  const deleteUpdate = (projectId: string, updateId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          updates: p.updates.filter(u => u.id !== updateId)
        };
      }
      return p;
    }));
  };



  const addCategory = (category: string) => {
    if (!customCategories.includes(category)) {
      setCustomCategories(prev => [...prev, category]);
    }
  };

  const addSubCategory = (category: string, subCategory: string) => {
    setCustomSubCategories(prev => {
      const existing = prev[category] || [];
      if (!existing.includes(subCategory)) {
        return { ...prev, [category]: [...existing, subCategory] };
      }
      return prev;
    });
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
