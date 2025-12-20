import React, { useState } from 'react';
import { Project } from '../types';
import { STATUSES } from '../constants';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { ProjectHistory } from './ProjectHistory';
import { Trash } from 'lucide-react';
import { NotionSelect } from './NotionSelect';

interface ProjectGridRowProps {
    project: Project;
}

export const ProjectGridRow: React.FC<ProjectGridRowProps> = ({ project }) => {
    const { updateProject, deleteProject, projects } = useProjects();
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);

    // Derived Statuses
    const allStatuses = React.useMemo(() => {
        const used = new Set(projects.map(p => p.status));
        return Array.from(new Set([...STATUSES, ...Array.from(used)])).sort();
    }, [projects]);

    const latestUpdate = project.updates[0];
    const dateStr = latestUpdate ? latestUpdate.date : '—';
    const person = latestUpdate ? latestUpdate.person : 'Unknown';

    const handleStatusChange = (newStatus: string) => {
        if (!user) return;
        updateProject(project.id, { status: newStatus as any });
    };

    return (
        <>
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={`group flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-x-4 py-4 md:py-3 border-t hover:border-black/30 transition-colors cursor-pointer items-start ${isExpanded ? 'border-black' : 'border-black/10'}`}
            >
                {/* Mobile: Date above title | Desktop: Col 1 */}
                <div className="text-xs font-mono text-gray-400 md:col-span-1 md:mt-1">
                    {dateStr}
                </div>

                {/* Title & Description - Col 2 on desktop */}
                <div className="md:col-span-5">
                    <h3 className="text-base md:text-sm font-semibold md:font-medium text-black group-hover:underline decoration-1 underline-offset-4 transition-all">
                        {project.name}
                    </h3>
                    <p className="text-sm md:text-xs text-gray-500 md:text-gray-400 mt-1 md:mt-0.5 line-clamp-2 md:line-clamp-1 group-hover:text-gray-600 transition-colors">
                        {latestUpdate?.description || 'No updates'}
                    </p>
                </div>

                {/* Meta Row: Status, Category (+ PIC/Provider hidden on mobile) */}
                <div className="flex items-center gap-3 mt-2 md:mt-0 md:contents w-full">
                    {/* Status */}
                    <div className="md:col-span-2 md:mt-0.5" onClick={(e) => e.stopPropagation()}>
                        <NotionSelect
                            options={allStatuses}
                            value={project.status}
                            onChange={(val) => handleStatusChange(val as string)}
                            onAdd={(val) => handleStatusChange(val)}
                            readOnly={!user}
                        />
                    </div>

                    {/* PIC - Hidden on mobile */}
                    <div className="hidden md:block md:col-span-1 text-xs font-mono text-gray-400 mt-1 truncate" title={person}>
                        {person}
                    </div>

                    {/* Provider - Hidden on mobile */}
                    <div className="hidden md:block md:col-span-1 text-xs font-mono text-gray-400 mt-1 truncate" title={latestUpdate?.provider}>
                        {latestUpdate?.provider || '—'}
                    </div>

                    {/* Category + Delete */}
                    <div className="ml-auto md:col-span-2 flex items-center gap-2 md:flex-col md:items-end md:gap-1">
                        <span className="text-[10px] font-mono text-gray-400">
                            {project.category}
                        </span>
                        {user && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Delete project?')) deleteProject(project.id);
                                }}
                                className="text-gray-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                                title="Delete Project"
                            >
                                <Trash size={12} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="col-span-12 border-b border-black/10">
                    <ProjectHistory project={project} />
                </div>
            )}
        </>
    );
};
