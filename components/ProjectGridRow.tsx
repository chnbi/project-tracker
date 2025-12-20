import React, { useState } from 'react';
import { Project } from '../types';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { ProjectHistory } from './ProjectHistory';

interface ProjectGridRowProps {
    project: Project;
}

export const ProjectGridRow: React.FC<ProjectGridRowProps> = ({ project }) => {
    const { updateProject } = useProjects();
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const latestUpdate = project.updates[0];
    const dateStr = latestUpdate ? latestUpdate.date : '—';
    const person = latestUpdate ? latestUpdate.person : 'Unknown';

    const handleStatusChange = (newStatus: string) => {
        if (!user) return; // Read only for guests
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
                <div className="col-span-2 mt-1">
                    <select
                        value={project.status}
                        onClick={(e) => e.stopPropagation()} // Prevent row expansion
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="appearance-none bg-transparent text-[10px] uppercase tracking-wider font-bold text-black border border-black px-1.5 py-px cursor-pointer hover:bg-black hover:text-white transition-colors outline-none"
                    >
                        {['Pending Update', 'In Progress', 'Completed', 'Review', 'Blocker', 'QA', 'IoT', 'Live'].map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                {/* Col 4: PIC (2 cols) */}
                <div className="col-span-2 text-xs font-mono text-gray-400 mt-1">
                    {person}
                </div>

                {/* Col 5: Category (2 cols) - Right aligned */}
                <div className="col-span-2 flex flex-col items-end gap-1 mt-1">
                    <span className="text-[10px] font-mono text-gray-400">
                        {project.category}
                    </span>
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
