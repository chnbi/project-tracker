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
                className={`group grid grid-cols-12 gap-x-4 py-3 border-t hover:border-black/30 transition-colors cursor-pointer items-start ${isExpanded ? 'border-black' : 'border-black/10'}`}
            >
                {/* Col 1: Date (1 col) */}
                <div className="col-span-1 text-xs font-mono text-gray-400 mt-1 truncate">
                    {dateStr}
                </div>

                {/* Col 2: Project (5 cols) - Expanded */}
                <div className="col-span-5">
                    <h3 className="text-sm font-medium text-black group-hover:underline decoration-1 underline-offset-4 transition-all">
                        {project.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 group-hover:text-gray-600 transition-colors">
                        {latestUpdate?.description || 'No updates'}
                    </p>
                </div>

                {/* Col 3: Status (2 cols) */}
                <div className="col-span-2 mt-0.5" onClick={(e) => e.stopPropagation()}>
                    <NotionSelect
                        options={allStatuses}
                        value={project.status}
                        onChange={(val) => handleStatusChange(val as string)}
                        onAdd={(val) => handleStatusChange(val)}
                        readOnly={!user}
                        className="w-full"
                    />
                </div>

                {/* Col 4: PIC (1 col) */}
                <div className="col-span-1 text-xs font-mono text-gray-400 mt-1 truncate" title={person}>
                    {person}
                </div>

                {/* Col 5: Provider (1 col) */}
                <div className="col-span-1 text-xs font-mono text-gray-400 mt-1 truncate" title={latestUpdate?.provider}>
                    {latestUpdate?.provider || '—'}
                </div>

                {/* Col 5: Category (2 cols) - Right aligned */}
                <div className="col-span-2 flex flex-col items-end gap-1 mt-1">
                    <span className="text-[10px] font-mono text-gray-400">
                        {project.category}
                    </span>
                    {user && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Delete project?')) deleteProject(project.id);
                            }}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                            title="Delete Project"
                        >
                            <Trash size={12} />
                        </button>
                    )}
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
