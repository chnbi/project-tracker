import { Project, FilterNode } from './types';

export const FILTERS: FilterNode[] = [
  { id: 'all', label: 'All' },
  {
    id: 'project',
    label: 'Project',
    children: [
      {
        id: 'yos',
        label: 'YOS',
        children: [
          { id: '5g', label: '5g advanced' },
          { id: 'revamp', label: 'Revamp' }
        ]
      },
      { id: 'yes.my', label: 'yes.my' },
      { id: 'cdn', label: 'CDN' },
      { id: 'ydbp', label: 'YDBP' },
      { id: 'person', label: 'PIC' }
    ]
  },
  { id: 'created_time', label: 'Created Time' },
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