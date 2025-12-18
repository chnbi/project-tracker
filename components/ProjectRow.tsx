import React from 'react';
import { Project } from '../types';

interface ProjectRowProps {
  project: Project;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pending Update':
    case 'In Development':
      return 'bg-yellow-400';
    case 'Completed':
      return 'bg-green-500';
    case 'Review':
      return 'bg-blue-400';
    default:
      return 'bg-gray-400';
  }
};

export const ProjectRow: React.FC<ProjectRowProps> = ({ project }) => {
  return (
    <div className="group py-6 border-b border-gray-200 hover:bg-white transition-colors duration-200 grid grid-cols-12 gap-4 items-start">
      {/* Date */}
      <div className="col-span-12 md:col-span-2 text-sm text-primary font-medium font-mono">
        {project.date}
      </div>

      {/* Project Name */}
      <div className="col-span-12 md:col-span-4 pr-6">
        <h4 className="text-base text-primary leading-tight font-medium">
          {project.name}
        </h4>
      </div>

      {/* Description */}
      <div className="col-span-12 md:col-span-4 pr-4">
        <p className="text-sm text-primary leading-snug">
          {project.description}
        </p>
      </div>

      {/* Person */}
      <div className="col-span-6 md:col-span-1 text-sm text-primary">
        {project.person}
      </div>

      {/* Status */}
      <div className="col-span-6 md:col-span-1 flex items-center justify-end md:justify-start">
        <div className="flex items-center space-x-2">
          <span className={`w-3 h-3 rounded-full ${getStatusColor(project.status)} shadow-sm`} />
          <span className="text-sm text-primary whitespace-nowrap hidden lg:block">
            {project.status}
          </span>
        </div>
      </div>
    </div>
  );
};
