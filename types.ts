export type Status = 'Backlog' | 'Pending Update' | 'In Progress' | 'Blocker' | 'QA' | 'Pushed to IoT' | 'Live' | 'Done';

export interface Update {
  id: string;
  date: string;
  description: string;
  person: string;
  provider?: string;
  status: Status;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  status: Status;
  updates: Update[];
}

export interface FilterNode {
  id: string;
  label: string;
  children?: FilterNode[];
}

export interface FilterState {
  level1: string | null;
  level2: string | null;
  level3: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  login: (name: string, email: string) => void;
  logout: () => void;
}

export interface ProjectContextType {
  projects: Project[];
  addProject: (data: Omit<Project, 'id' | 'updates'> & { initialStatus: Status, initialDescription?: string, initialPic?: string }) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addUpdate: (projectId: string, updateData: Omit<Update, 'id' | 'date' | 'provider'>) => void;
  editUpdate: (projectId: string, updateId: string, data: Partial<Update>) => void;
  deleteUpdate: (projectId: string, updateId: string) => void;
  customCategories: string[];
  addCategory: (category: string) => void;
  renameCategory: (oldName: string, newName: string) => void;
  deleteCategory: (name: string) => void;
  updateProviderName: (oldName: string, newName: string) => Promise<void>;
}