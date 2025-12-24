import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import { STATUSES } from '../constants';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { ProjectHistory } from './ProjectHistory';
import { Trash, Edit2, Check, X } from 'lucide-react';
import { NotionSelect } from './NotionSelect';

interface ProjectGridRowProps {
    project: Project;
}

export const ProjectGridRow: React.FC<ProjectGridRowProps> = ({ project }) => {
    const { updateProject, deleteProject, projects, customCategories } = useProjects();
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(project.name);
    const [editCategory, setEditCategory] = useState(project.category);
    const [resetTrigger, setResetTrigger] = useState(0);

    // Derived Statuses
    const allStatuses = useMemo(() => {
        const used = new Set(projects.map(p => p.status));
        return Array.from(new Set([...STATUSES, ...Array.from(used)])).sort();
    }, [projects]);

    // Derived Categories
    const allCategories = useMemo(() => {
        const used = new Set(projects.map(p => p.category));
        return Array.from(new Set([...customCategories, ...Array.from(used)])).sort();
    }, [projects, customCategories]);

    const latestUpdate = project.updates[0];
    const dateStr = latestUpdate ? latestUpdate.date : '—';
    const person = latestUpdate ? latestUpdate.person : 'Unknown';

    const handleStatusChange = (newStatus: string) => {
        if (!user) return;
        updateProject(project.id, { status: newStatus as any });
    };

    const startEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditName(project.name);
        setEditCategory(project.category);
        setIsEditing(true);
    };

    const cancelEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(false);
    };

    const saveEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!editName.trim()) return;
        updateProject(project.id, {
            name: editName.trim(),
            category: editCategory
        });
        setIsEditing(false);
    };

    const handleToggleExpand = () => {
        if (isEditing) return;
        const willExpand = !isExpanded;
        setIsExpanded(willExpand);
        if (willExpand) {
            setResetTrigger(prev => prev + 1); // Increment to reset show more
        }
    };

    return (
        <div className="relative">
            {/* Project Row Header - stays in place */}
            <div
                onClick={handleToggleExpand}
                className={`group flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-x-4 py-4 md:py-3 border-t transition-all duration-200 ${isEditing ? '' : 'cursor-pointer'} items-start ${isExpanded ? 'border-black/20 dark:border-white/20 bg-gray-50/50 dark:bg-white/5' : 'border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 hover:bg-gray-50/30 dark:hover:bg-white/5'}`}
            >
                {/* Mobile: Date above title | Desktop: Col 1 */}
                <div className={`text-xs font-mono md:col-span-1 md:mt-1 transition-colors duration-200 ${isExpanded ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {isExpanded ? '' : dateStr}
                </div>

                {/* Title & Description - Col 5 on desktop */}
                <div className="md:col-span-5">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-base md:text-sm font-semibold md:font-medium text-black dark:text-white bg-transparent border-b border-black dark:border-white outline-none py-0.5"
                            autoFocus
                        />
                    ) : (
                        <h3 className={`text-base md:text-sm font-semibold md:font-medium transition-all duration-200 ${isExpanded ? 'underline decoration-2 underline-offset-4' : 'group-hover:underline decoration-1 underline-offset-4'}`}>
                            {project.name}
                        </h3>
                    )}
                    {/* Description - hidden when expanded (shows in history instead) */}
                    <div className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? 'max-h-0 opacity-0 mt-0' : 'max-h-24 opacity-100 mt-1 md:mt-0.5'}`}>
                        <p className="text-sm md:text-xs text-gray-500 md:text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors break-words">
                            {latestUpdate?.description || 'No updates'}
                        </p>
                    </div>
                </div>

                {/* Meta Row: Status, PIC, Provider, Category - hidden when expanded on mobile */}
                <div className={`flex items-center gap-3 mt-2 md:mt-0 md:contents w-full transition-all duration-300 ease-out ${isExpanded ? 'max-h-0 opacity-0 overflow-hidden md:opacity-100 md:max-h-none' : 'max-h-20 opacity-100'}`}>
                    {/* Status - Col 2 */}
                    <div className="md:col-span-2 md:mt-0.5" onClick={(e) => e.stopPropagation()}>
                        {!isExpanded && (
                            <NotionSelect
                                options={allStatuses}
                                value={project.status}
                                onChange={(val) => handleStatusChange(val as string)}
                                onAdd={(val) => handleStatusChange(val)}
                                readOnly={!user}
                            />
                        )}
                    </div>

                    {/* PIC - Col 1 - Hidden on mobile */}
                    <div className="hidden md:block md:col-span-1 text-xs font-mono text-gray-400 mt-1 truncate" title={person}>
                        {!isExpanded && person}
                    </div>

                    {/* Provider - Col 1 - Hidden on mobile */}
                    <div className="hidden md:block md:col-span-1 text-xs font-mono text-gray-400 mt-1 truncate" title={latestUpdate?.provider}>
                        {!isExpanded && (latestUpdate?.provider || '—')}
                    </div>

                    {/* Category + Actions - Col 2 */}
                    <div className="ml-auto md:col-span-2 flex items-center gap-2 md:flex-col md:items-end md:gap-1">
                        {isEditing ? (
                            <div onClick={(e) => e.stopPropagation()} className="min-w-[100px]">
                                <NotionSelect
                                    options={allCategories}
                                    value={editCategory}
                                    onChange={(val) => setEditCategory(val as string)}
                                    onAdd={(val) => setEditCategory(val)}
                                    placeholder="Category"
                                />
                            </div>
                        ) : (
                            <span className="text-[10px] font-mono text-gray-400">
                                {project.category}
                            </span>
                        )}
                        {user && (
                            <div className="flex items-center gap-1">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={saveEditing}
                                            className="text-green-600 hover:bg-green-100 rounded-full p-1"
                                            title="Save"
                                        >
                                            <Check size={12} />
                                        </button>
                                        <button
                                            onClick={cancelEditing}
                                            className="text-gray-400 hover:bg-red-50 rounded-full p-1"
                                            title="Cancel"
                                        >
                                            <X size={12} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={startEditing}
                                            className="text-gray-300 hover:text-black transition-colors p-1 opacity-0 group-hover:opacity-100"
                                            title="Edit Project"
                                        >
                                            <Edit2 size={12} />
                                        </button>
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
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Update History Section - enhanced slide animation */}
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out origin-top transform ${isExpanded ? 'max-h-[2000px] opacity-100 scale-y-100' : 'max-h-0 opacity-0 scale-y-98'}
                    }`}
            >

                {/* Update section with subtle background - no dashed line */}
                <div className="bg-gray-50/70 dark:bg-white/5 py-0.5 mt-0">
                    <ProjectHistory project={project} resetTrigger={resetTrigger} />
                </div>
            </div>
        </div>
    );
};


