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
      { id: 'person', label: 'Person' }
    ]
  },
  { id: 'created_time', label: 'Created Time' },
  { id: 'status', label: 'Status' },
  { id: 'person_filter', label: 'Person' }
];

export const PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'YOS and CDN Revamp - Switch to Yes',
    category: 'yos',
    subCategory: '5g',
    updates: [
      {
        id: 'u1',
        date: '17.12.2025',
        description: 'App integration needed for activation flow',
        person: 'Sami',
        status: 'Pending Update',
      },
      {
        id: 'u4',
        date: '10.12.2025',
        description: 'Initial requirements gathering completed',
        person: 'Sami',
        status: 'In Progress',
      }
    ]
  },
  {
    id: 'p2',
    name: 'Broadband Page Card',
    category: 'yes.my',
    updates: [
      {
        id: 'u2',
        date: '15.12.2025',
        description: 'Backend API connection failing intermittently',
        person: 'Hem',
        status: 'Blocker',
      },
      {
        id: 'u3',
        date: '14.12.2025',
        description: 'Design mockups approved by marketing',
        person: 'Hem',
        status: 'QA',
      }
    ]
  },
  {
    id: 'p3',
    name: 'MyDigital ID Integration',
    category: 'cdn',
    updates: [
      {
        id: 'u5',
        date: '10.12.2025',
        description: 'IoT sensor data stream configuration',
        person: 'Sarah',
        status: 'IoT',
      }
    ]
  },
  {
    id: 'p4',
    name: 'Newsroom CMS Update',
    category: 'ydbp',
    updates: [
      {
        id: 'u6',
        date: '08.12.2025',
        description: 'Production deployment successful',
        person: 'Mike',
        status: 'Live',
      }
    ]
  }
];