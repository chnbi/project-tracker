import React, { useState } from 'react';
import { Project, Update } from '../types';
import { useProjects } from '../contexts/ProjectContext';
import { Plus, Trash2, Edit2, X, Check } from 'lucide-react';

interface ProjectHistoryProps {
  project: Project;
}

export const ProjectHistory: React.FC<ProjectHistoryProps> = ({ project }) => {
  const { addUpdate, deleteUpdate, editUpdate } = useProjects();
  const [isAdding, setIsAdding] = useState(false);
  const [newUpdateDesc, setNewUpdateDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdateDesc.trim()) return;

    addUpdate(project.id, {
      description: newUpdateDesc,
      person: 'Admin', // Default to 'Admin' for now, can be improved with Auth later
      status: project.status
    });
    setNewUpdateDesc('');
    setIsAdding(false);
  };

  const startEdit = (update: Update) => {
    setEditingId(update.id);
    setEditDesc(update.description);
  };

  const saveEdit = (updateId: string) => {
    if (editingId) {
      editUpdate(project.id, updateId, { description: editDesc });
      setEditingId(null);
    }
  };

  return (
    <div className="w-full py-4 border-t border-black/5">

      {!isAdding && (
        <div className="grid grid-cols-12 gap-x-4 mb-4">
          <div className="col-span-1"></div>
          <div className="col-span-5">
            <button
              onClick={() => setIsAdding(true)}
              className="text-[10px] font-mono text-gray-400 hover:text-black hover:underline uppercase tracking-wider"
            >
              + Add Update
            </button>
          </div>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleAddSubmit} className="grid grid-cols-12 gap-x-4 mb-6">
          <div className="col-span-1"></div>
          <div className="col-span-5">
            <textarea
              value={newUpdateDesc}
              onChange={(e) => setNewUpdateDesc(e.target.value)}
              placeholder="Type update..."
              className="w-full text-xs font-mono bg-transparent border-b border-black outline-none min-h-[40px] placeholder:text-gray-300 resize-none"
              autoFocus
            />
            <div className="flex gap-3 mt-2">
              <button type="submit" className="text-[10px] uppercase font-bold text-black hover:underline">Post</button>
              <button type="button" onClick={() => setIsAdding(false)} className="text-[10px] uppercase text-gray-400 hover:text-black">Cancel</button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {project.updates.map((update) => (
          <div key={update.id} className="group/item grid grid-cols-12 gap-x-4 text-xs items-baseline">
            {/* Col 1: Date */}
            <div className="col-span-1 font-mono text-gray-400 text-[10px]">
              {update.date.slice(0, 5)} {/* Short date dd.mm */}
            </div>

            {/* Col 2: Content (matches Project col) */}
            <div className="col-span-5">
              {editingId === update.id ? (
                <div className="flex gap-2 items-baseline">
                  <input
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full border-b border-black outline-none bg-transparent font-normal"
                    autoFocus
                  />
                  <button onClick={() => saveEdit(update.id)}><Check size={10} className="text-black" /></button>
                  <button onClick={() => setEditingId(null)}><X size={10} className="text-gray-400" /></button>
                </div>
              ) : (
                <p className="text-gray-600 font-normal leading-normal">
                  {update.description}
                </p>
              )}
            </div>

            {/* Col 3: Person (aligned with Status/PIC area somewhat?) */}
            {/* Actually let's put person in the Status/PIC columns area (col 3+4 = 4 cols) */}
            <div className="col-span-2 text-right">
              {/* Empty to align person with PIC column (which is col 4) if we skip col 3 */}
            </div>

            <div className="col-span-2 font-mono text-[10px] text-gray-300 group-hover/item:text-gray-500">
              {update.person}
            </div>

            {/* Col 5: Actions */}
            <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
              <button onClick={() => startEdit(update)} className="text-gray-300 hover:text-black">
                <Edit2 size={10} />
              </button>
              <button onClick={() => deleteUpdate(project.id, update.id)} className="text-gray-300 hover:text-red-600">
                <Trash2 size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
