import React, { useState, useMemo } from 'react';
import { Project, Update, Status } from '../types';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { STATUSES } from '../constants';
import { NotionSelect } from './NotionSelect';

interface ProjectHistoryProps {
  project: Project;
}

export const ProjectHistory: React.FC<ProjectHistoryProps> = ({ project }) => {
  const { addUpdate, deleteUpdate, editUpdate, updateProject, projects, customCategories } = useProjects();
  const { user } = useAuth();

  // Derived Statuses
  const allStatuses = useMemo(() => {
    const used = new Set(projects.map(p => p.status));
    return Array.from(new Set([...STATUSES, ...Array.from(used)])).sort();
  }, [projects]);

  const [isAdding, setIsAdding] = useState(false);

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

  return (
    <div className="w-full py-2 border-t border-black/5 bg-gray-50/50">

      {/* --- ADD FORM --- */}
      {isAdding ? (
        <div className="relative group">
          <form onSubmit={handleAddSubmit} className="flex flex-col gap-2 md:grid md:grid-cols-12 md:gap-x-4 px-0 py-2 items-start border-b border-black/5 mb-2">

            {/* Date placeholder */}
            <div className="hidden md:block md:col-span-1 text-[10px] font-mono text-gray-300 mt-1.5">New</div>

            {/* Description */}
            <div className="md:col-span-5">
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Update description..."
                className="w-full text-xs font-medium bg-transparent border-b border-black outline-none min-h-[22px] placeholder:text-gray-300 resize-none py-1 leading-normal"
                autoFocus
              />
            </div>

            {/* Mobile: Status + PIC row | Desktop: separate cols */}
            <div className="flex items-center gap-3 md:hidden">
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
              <span className="text-[10px] font-mono text-gray-400">{user?.name || '—'}</span>
              {/* Mobile actions */}
              <button type="submit" className="text-black hover:bg-green-100 rounded-full p-1"><Check size={14} /></button>
              <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400 hover:bg-red-50 rounded-full p-1"><X size={14} /></button>
            </div>

            {/* Desktop: Status (2 cols) */}
            <div className="hidden md:block md:col-span-2 mt-1">
              <NotionSelect
                options={allStatuses}
                value={newStatus}
                onChange={(val) => setNewStatus(val as Status)}
                onAdd={(val) => setNewStatus(val as Status)}
                placeholder="Status"
              />
            </div>

            {/* Desktop: PIC (1 col) */}
            <div className="hidden md:block md:col-span-1 mt-1">
              <NotionSelect
                options={allPics}
                value={newPic}
                onChange={(val) => setNewPic(val as string)}
                onAdd={(val) => setNewPic(val)}
                placeholder="PIC"
              />
            </div>

            {/* Desktop: Provider (1 col) */}
            <div className="hidden md:block md:col-span-1 text-xs font-mono text-gray-400 truncate mt-1">
              {user?.name || '—'}
            </div>

            {/* Desktop: Actions (2 cols) */}
            <div className="hidden md:flex md:col-span-2 items-center justify-end gap-2 mt-1">
              <button type="submit" className="text-black hover:bg-green-100 rounded-full p-1"><Check size={14} /></button>
              <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400 hover:bg-red-50 rounded-full p-1"><X size={14} /></button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-x-4 mb-2">
          <div className="col-span-1"></div>
          <div className="col-span-5">
            <button
              onClick={handleStartAdd}
              className="text-[10px] font-mono text-gray-300 hover:text-black hover:underline uppercase tracking-wider flex items-center gap-1"
            >
              <Plus size={10} /> Add Update
            </button>
          </div>
        </div>
      )}

      {/* --- HISTORY LIST --- */}
      <div className="space-y-1">
        {project.updates.map((update) => {
          const isEditing = editingId === update.id;

          return (
            <div key={update.id} className={`group/item relative hover:bg-white/50 py-2 -mx-2 px-2 rounded ${isEditing ? 'bg-white/80' : ''}`}>

              {/* Mobile: Stacked layout | Desktop: 12-column grid matching project row */}
              <div className="flex flex-col gap-1 md:grid md:grid-cols-12 md:gap-x-4 md:items-start">

                {/* Date - Col 1 */}
                <div className="font-mono text-gray-400 text-[10px] md:text-xs md:col-span-1">
                  {update.date.slice(0, 5)}
                </div>

                {/* Description - Col 5 */}
                <div className="md:col-span-5">
                  {isEditing ? (
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full bg-transparent border-b border-black outline-none min-h-[22px] text-xs resize-none py-0.5 leading-normal"
                      autoFocus
                    />
                  ) : (
                    <p className="text-xs text-gray-600 font-normal leading-normal">
                      {update.description}
                    </p>
                  )}
                </div>

                {/* Mobile: Status + PIC left | Provider right */}
                <div className="flex items-center gap-3 md:hidden">
                  {/* Status - left aligned */}
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
                  {/* PIC - left aligned */}
                  <span className="font-mono text-xs text-gray-400">{update.person}</span>
                  {/* Spacer - pushes provider to right */}
                  <div className="flex-1" />
                  {/* Provider - right aligned like category */}
                  <span className="font-mono text-[10px] text-gray-400">{update.provider || '—'}</span>
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(update.id)} className="text-green-600 hover:bg-green-100 rounded-full p-1"><Check size={12} /></button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:bg-red-50 rounded-full p-1"><X size={12} /></button>
                      </>
                    ) : (
                      <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(update)} className="text-gray-300 hover:text-black p-1"><Edit2 size={10} /></button>
                        <button onClick={() => deleteUpdate(project.id, update.id)} className="text-gray-300 hover:text-red-600 p-1"><Trash2 size={10} /></button>
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
                <div className="hidden md:block md:col-span-1 text-xs font-mono text-gray-400 truncate" title={update.person}>
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
                <div className="hidden md:block md:col-span-1 text-xs font-mono text-gray-400 truncate" title={`by ${update.provider}`}>
                  <span className="text-gray-300">by</span> {update.provider || '—'}
                </div>

                {/* Desktop: Actions - Col 2 */}
                <div className="hidden md:flex md:col-span-2 items-center justify-end gap-1">
                  {isEditing ? (
                    <>
                      <button onClick={() => saveEdit(update.id)} className="text-green-600 hover:bg-green-100 rounded-full p-1"><Check size={12} /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:bg-red-50 rounded-full p-1"><X size={12} /></button>
                    </>
                  ) : (
                    <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(update)} className="text-gray-300 hover:text-black p-1"><Edit2 size={10} /></button>
                      <button onClick={() => deleteUpdate(project.id, update.id)} className="text-gray-300 hover:text-red-600 p-1"><Trash2 size={10} /></button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
