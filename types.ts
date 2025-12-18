export type Status = 'Pending Update' | 'In Progress' | 'Completed' | 'Review' | 'Blocker' | 'QA' | 'IoT' | 'Live';

export interface Update {
  id: string;
  date: string;
  description: string;
  person: string;
  status: Status;
}

export interface Project {
  id: string;
  name: string;
  category: string; 
  subCategory?: string;
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