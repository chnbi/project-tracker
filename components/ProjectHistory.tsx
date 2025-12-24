import React, { useState, useMemo, useEffect } from 'react';
import { Project, Update, Status } from '../types';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { STATUSES } from '../constants';
import { NotionSelect } from './NotionSelect';

interface ProjectHistoryProps {
  project: Project;
  resetTrigger?: number; // Trigger to reset visible count
}

const UPDATES_PER_PAGE = 5;

export const ProjectHistory: React.FC<ProjectHistoryProps> = ({ project, resetTrigger }) => {
  const { addUpdate, deleteUpdate, editUpdate, updateProject, projects, customCategories } = useProjects();
  const { user } = useAuth();

  // Derived Statuses
  const allStatuses = useMemo(() => {
    const used = new Set(projects.map(p => p.status));
    return Array.from(new Set([...STATUSES, ...Array.from(used)])).sort();
  }, [projects]);

  const [isAdding, setIsAdding] = useState(false);
  const [visibleCount, setVisibleCount] = useState(UPDATES_PER_PAGE);

  // Reset visible count when resetTrigger changes (when row is re-expanded)
  useEffect(() => {
    setVisibleCount(UPDATES_PER_PAGE);
  }, [resetTrigger]);

  // Add State
  const [newDesc, setNewDesc] = useState('');
  const [newPic, setNewPic] = useState('');
  const [newStatus, setNewStatus] = useState<Status>('In Progress');
  const [newCategory, setNewCategory] = useState('');

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<Status>('In Progress');
  const [editPic, setEditPic] = useState('');

  // Derive unique PICs for dropdown
  const allPics = useMemo(() => {
    const pics = new Set<string>();
    projects.forEach(p => {
      p.updates.forEach(u => pics.add(u.person));
    });
    return Array.from(pics).sort();
  }, [projects]);

  const handleStartAdd = () => {
    setIsAdding(true);
    setNewDesc('');
    setNewPic(project.updates[0]?.person || 'Admin');
    setNewStatus(project.status);
    setNewCategory(project.category);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    addUpdate(project.id, {
      description: newDesc,
      person: newPic || 'Admin',
      status: newStatus
    });

    updateProject(project.id, {
      status: newStatus,
      category: newCategory,
    });

    setIsAdding(false);
  };

  const startEdit = (update: Update) => {
    setEditingId(update.id);
    setEditDesc(update.description);
    setEditStatus(update.status);
    setEditPic(update.person);
  };

  const saveEdit = (updateId: string) => {
    if (editingId) {
      editUpdate(project.id, updateId, {
        description: editDesc,
        status: editStatus,
        person: editPic
      });
      setEditingId(null);
    }
  };

  // Visible updates and remaining count
  const visibleUpdates = project.updates.slice(0, visibleCount);
  const remainingCount = project.updates.length - visibleCount;
  const hasMore = remainingCount > 0;

  const showMore = () => {
    setVisibleCount(prev => Math.min(prev + UPDATES_PER_PAGE, project.updates.length));
  };

  return (
    <div className="w-full">

      {/* --- ADD FORM --- */}
      {isAdding ? (
        <form onSubmit={handleAddSubmit} className="flex flex-col gap-2 md:grid md:grid-cols-12 md:gap-x-4 py-3 items-start border-b border-black/10 dark:border-white/10 mb-2">

          {/* Date placeholder - Col 1 */}
          <div className="hidden md:block md:col-span-1 text-[10px] font-mono text-gray-400 dark:text-gray-500 mt-1.5">New</div>

          {/* Description - Col 5 */}
          <div className="w-full md:col-span-5">
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Update description..."
              className="w-full text-xs font-medium bg-transparent border-b border-black dark:border-white outline-none min-h-[22px] placeholder:text-gray-300 dark:placeholder:text-gray-600 resize-none py-1 leading-normal"
              autoFocus
            />
          </div>

          {/* Mobile: Status + PIC + Actions row */}
          <div className="flex items-center gap-3 md:hidden w-full">
            <NotionSelect
              options={allStatuses}
              value={newStatus}
              onChange={(val) => setNewStatus(val as Status)}
              onAdd={(val) => setNewStatus(val as Status)}
              placeholder="Status"
            />
            <NotionSelect
              options={allPics}
              value={newPic}
              onChange={(val) => setNewPic(val as string)}
              onAdd={(val) => setNewPic(val)}
              placeholder="PIC"
            />
            <div className="flex-1" />
            <button type="submit" className="text-black dark:text-white hover:bg-green-100 dark:hover:bg-green-900 rounded-full p-1"><Check size={14} /></button>
            <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-full p-1"><X size={14} /></button>
          </div>

          {/* Desktop: Status - Col 2 */}
          <div className="hidden md:block md:col-span-2 mt-0.5">
            <NotionSelect
              options={allStatuses}
              value={newStatus}
              onChange={(val) => setNewStatus(val as Status)}
              onAdd={(val) => setNewStatus(val as Status)}
              placeholder="Status"
            />
          </div>

          {/* Desktop: PIC - Col 1 */}
          <div className="hidden md:block md:col-span-1 mt-0.5">
            <NotionSelect
              options={allPics}
              value={newPic}
              onChange={(val) => setNewPic(val as string)}
              onAdd={(val) => setNewPic(val)}
              placeholder="PIC"
            />
          </div>

          {/* Desktop: Provider - Col 1 */}
          <div className="hidden md:block md:col-span-1 text-xs font-mono text-gray-400 dark:text-gray-500 truncate mt-1.5">
            {user?.name || '—'}
          </div>

          {/* Desktop: Actions - Col 2 */}
          <div className="hidden md:flex md:col-span-2 items-center justify-end gap-2 mt-0.5">
            <button type="submit" className="text-black dark:text-white hover:bg-green-100 dark:hover:bg-green-900 rounded-full p-1"><Check size={14} /></button>
            <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-full p-1"><X size={14} /></button>
          </div>
        </form>
      ) : (
        <div className="flex md:grid md:grid-cols-12 md:gap-x-4 pb-2">
          <div className="hidden md:block md:col-span-1"></div>
          <div className="md:col-span-5">
            <button
              onClick={handleStartAdd}
              className="text-[10px] font-mono text-gray-400 hover:text-black dark:hover:text-white hover:underline uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              <Plus size={10} /> Add Update
            </button>
          </div>
        </div>
      )}

      {/* --- HISTORY LIST --- */}
      <div className="space-y-0">
        {visibleUpdates.map((update, index) => {
          const isEditing = editingId === update.id;
          const isFirst = index === 0;

          return (
            <div
              key={update.id}
              className={`group/item flex flex-col gap-1 md:grid md:grid-cols-12 md:gap-x-4 py-2.5 items-start transition-colors rounded ${isEditing ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'hover:bg-white/80 dark:hover:bg-white/5'} ${isFirst ? 'bg-white/60 dark:bg-white/5' : ''}`}
            >
              {/* Date - Col 1 */}
              <div className={`font-mono text-[10px] md:text-xs md:col-span-1 ${isFirst ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {update.date.slice(0, 5)}
              </div>

              {/* Description - Col 5 */}
              <div className="w-full md:col-span-5">
                {isEditing ? (
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full bg-transparent border-b border-black dark:border-white outline-none min-h-[22px] text-xs resize-none py-0.5 leading-normal"
                    autoFocus
                  />
                ) : (
                  <p className={`text-sm md:text-xs text-gray-500 md:text-gray-400 dark:text-gray-500 leading-relaxed break-words`}>
                    {update.description}
                  </p>
                )}
              </div>

              {/* Mobile: Status + PIC + Provider + Actions row */}
              <div className="flex items-center gap-3 md:hidden w-full mt-1">
                <div className="shrink-0">
                  {isEditing ? (
                    <NotionSelect
                      options={allStatuses}
                      value={editStatus}
                      onChange={(val) => setEditStatus(val as Status)}
                      onAdd={(val) => setEditStatus(val as Status)}
                    />
                  ) : (
                    <NotionSelect
                      options={allStatuses}
                      value={update.status}
                      onChange={() => { }}
                      readOnly
                      className="pointer-events-none"
                    />
                  )}
                </div>
                <span className="font-mono text-xs text-gray-400 dark:text-gray-500">{update.person}</span>
                <div className="flex-1" />
                <span className="font-mono text-[10px] text-gray-400 dark:text-gray-500">{update.provider || '—'}</span>
                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <button onClick={() => saveEdit(update.id)} className="text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 rounded-full p-1"><Check size={12} /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-full p-1"><X size={12} /></button>
                    </>
                  ) : (
                    <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(update)} className="text-gray-300 dark:text-gray-600 hover:text-black dark:hover:text-white p-1"><Edit2 size={10} /></button>
                      <button onClick={() => deleteUpdate(project.id, update.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-600 dark:hover:text-red-400 p-1"><Trash2 size={10} /></button>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop: Status - Col 2 */}
              <div className="hidden md:block md:col-span-2">
                {isEditing ? (
                  <NotionSelect
                    options={allStatuses}
                    value={editStatus}
                    onChange={(val) => setEditStatus(val as Status)}
                    onAdd={(val) => setEditStatus(val as Status)}
                  />
                ) : (
                  <NotionSelect
                    options={allStatuses}
                    value={update.status}
                    onChange={() => { }}
                    readOnly
                    className="pointer-events-none"
                  />
                )}
              </div>

              {/* Desktop: PIC - Col 1 */}
              <div className="hidden md:block md:col-span-1 text-xs font-mono text-gray-400 dark:text-gray-500 truncate" title={update.person}>
                {isEditing ? (
                  <NotionSelect
                    options={allPics}
                    value={editPic}
                    onChange={(val) => setEditPic(val as string)}
                    onAdd={(val) => setEditPic(val)}
                  />
                ) : (
                  update.person
                )}
              </div>

              {/* Desktop: Provider - Col 1 */}
              <div className="hidden md:block md:col-span-1 text-xs font-mono text-gray-400 dark:text-gray-500 truncate" title={`by ${update.provider}`}>
                <span className="text-gray-300 dark:text-gray-600">by</span> {update.provider || '—'}
              </div>

              {/* Desktop: Actions - Col 2 */}
              <div className="hidden md:flex md:col-span-2 items-center justify-end gap-1">
                {isEditing ? (
                  <>
                    <button onClick={() => saveEdit(update.id)} className="text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 rounded-full p-1"><Check size={12} /></button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-full p-1"><X size={12} /></button>
                  </>
                ) : (
                  <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(update)} className="text-gray-300 dark:text-gray-600 hover:text-black dark:hover:text-white p-1"><Edit2 size={10} /></button>
                    <button onClick={() => deleteUpdate(project.id, update.id)} className="text-gray-300 dark:text-gray-600 hover:text-red-600 dark:hover:text-red-400 p-1"><Trash2 size={10} /></button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Show More Button - Simplified */}
      {hasMore && (
        <div className="pt-3 pb-1">
          <button
            onClick={showMore}
            className="text-[11px] font-mono text-gray-400 hover:text-blue-600 dark:hover:text-white hover:underline transition-colors"
          >
            Show more...
          </button>
        </div>
      )}
    </div>
  );
};
