import { Project, FilterNode } from './types';

export const FILTERS: FilterNode[] = [
  { id: 'all', label: 'All' },
  { id: 'project', label: 'Project', children: [] },
  { id: 'status', label: 'Status' },
  { id: 'person_filter', label: 'PIC' }
];

export const STATUSES = [
  'Backlog',
  'Pending Update',
  'In Progress',
  'Blocker',
  'QA',
  'Pushed to IoT',
  'Live',
  'Done'
];

export const PROJECTS: Project[] = [];