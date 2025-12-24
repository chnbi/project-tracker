import { Project, FilterNode } from './types';

export const FILTERS: FilterNode[] = [
  { id: 'all', label: 'All' },
  { id: 'project', label: 'Project', children: [] },
  { id: 'status', label: 'Status' },
  { id: 'person_filter', label: 'PIC' }
];

export const STATUSES = [
  'Backlog',
  'Blocker',
  'Pending Update',
  'In Progress',
  'QA',
  'Deployed to IoT',
  'PDC',
  'Done'
];

export const PROJECTS: Project[] = [];