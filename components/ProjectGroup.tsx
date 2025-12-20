import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { ChevronDown, ChevronUp, Trash, Plus } from 'lucide-react';
import { Project, Update, Status } from '../types';
import React, { useState, useEffect } from 'react';
import { STATUSES } from '../constants';

interface ProjectGroupProps {
  project: Project;
  forceExpand?: boolean;
}

const getStatusColor = (status: string) => {
  const s = status;
  if (s === 'Blocker') return 'bg-red-500';
  if (s === 'In Progress' || s === 'In Development') return 'bg-yellow-400';
  if (s === 'Pending Update') return 'bg-orange-400';
  if (s === 'QA' || s === 'Review') return 'bg-purple-300';
  if (s === 'IoT') return 'bg-blue-500';
  if (s === 'Live' || s === 'Completed') return 'bg-green-500';
  return 'bg-gray-300';
};

const UpdateRow: React.FC<{ update: Update; isEditing: boolean; editForm: any; setEditForm: any; onSave: () => void; onCancel: () => void; onEdit: () => void; onDelete: () => void; user: any; }> = ({ update, isEditing, editForm, setEditForm, onSave, onCancel, onEdit, onDelete, user }) => {
  const isProviderDifferent = update.provider && update.provider !== update.person;

  if (isEditing) {
    return (
      <div className="grid grid-cols-12 gap-4 px-2 py-3 border-b border-gray-100 bg-gray-50 items-start">
        <div className="col-span-1 flex items-center h-full pt-1.5">
          {/* Color dot static for now or editable if needed, let's keep it simple and just edit text/status */}
          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(editForm.status)}`} />
        </div>
        <div className="col-span-12 md:col-span-9 flex flex-col gap-2">
          <textarea
            value={editForm.description}
            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
            className="w-full text-sm p-2 border rounded font-mono"
            rows={2}
          />
          <div className="flex gap-2">
            <select
              value={editForm.status}
              onChange={e => setEditForm({ ...editForm, status: e.target.value })}
              className="text-xs p-1 border rounded"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button onClick={onSave} className="text-xs bg-black text-white px-2 py-1 rounded">Save</button>
            <button onClick={onCancel} className="text-xs bg-gray-200 text-black px-2 py-1 rounded">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group grid grid-cols-12 gap-4 px-2 py-3 border-b border-gray-100 hover:bg-white items-start transition-all duration-200 relative">
      <div className="col-span-1 flex items-center h-full pt-1.5">
        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(update.status)} ring-2 ring-transparent group-hover:ring-gray-100 transition-all`} />
      </div>
      <div className="col-span-12 md:col-span-2 font-mono text-xs text-secondary pt-0.5 opacity-80">
        {update.date}
      </div>
      <div className="col-span-12 md:col-span-5 text-sm text-primary leading-relaxed font-medium">
        {update.description}
      </div>
      <div className="col-span-6 md:col-span-2 text-xs text-secondary pt-0.5 flex flex-col">
        <span>{update.person}</span>
        {update.provider && (
          <span className="text-[9px] text-gray-400 font-mono">via {update.provider}</span>
        )}
      </div>
      <div className="col-span-6 md:col-span-1 text-[10px] font-mono text-secondary text-right uppercase pt-0.5">
        {update.status}
      </div>

      {/* Edit/Delete Actions (Only valid if logged in) */}
      {user && (
        <div className="col-span-1 opacity-0 group-hover:opacity-100 flex items-center justify-end gap-2 transition-opacity">
          <button onClick={onEdit} className="text-gray-400 hover:text-black" title="Edit">
            {/* Simple Edit Icon */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-500" title="Delete">
            {/* Simple Trash Icon */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export const ProjectGroup: React.FC<ProjectGroupProps> = ({ project, forceExpand = false }) => {
  const { addUpdate, deleteProject, editUpdate, deleteUpdate } = useProjects();
  const { user } = useAuth(); // Needed for access control
  const [isExpanded, setIsExpanded] = useState(forceExpand);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUpdate, setNewUpdate] = useState({ description: '', person: '', status: 'In Progress' as Status });
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ description: '', status: 'In Progress' as Status });

  useEffect(() => {
    if (forceExpand) setIsExpanded(true);
  }, [forceExpand]);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const handleAddUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdate.person) {
      alert("Please enter a Person In Charge (PIC)");
      return;
    }
    // Person is now passed expressly. Provider is handled in context.
    addUpdate(project.id, newUpdate);
    setShowAddForm(false);
    setNewUpdate({ description: '', person: '', status: 'In Progress' as Status });
  };

  const startEdit = (update: Update) => {
    setEditingUpdateId(update.id);
    setEditForm({ description: update.description, status: update.status });
  };

  const cancelEdit = () => {
    setEditingUpdateId(null);
  };

  const handleSaveEdit = async (updateId: string) => {
    await editUpdate(project.id, updateId, editForm);
    setEditingUpdateId(null);
  };

  const handleDeleteUpdate = async (updateId: string) => {
    if (confirm('Are you sure you want to delete this update?')) {
      await deleteUpdate(project.id, updateId);
    }
  };

  // Sorting updates by date (assuming ISO or standard format, but for now strictly taking index 0 as latest based on data structure)
  // Data is provided latest first in constants, so we use index 0.
  const latestUpdate = project.updates[0];
  const otherUpdates = project.updates.slice(1);

  return (
    <div className="mb-8 bg-gray-50/50 rounded-lg p-4 border border-transparent hover:border-gray-200 transition-colors">

      {/* Project Header (Clickable for accordion) */}
      <div
        onClick={toggleExpand}
        className="flex items-center justify-between cursor-pointer group select-none mb-4"
      >
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`} />
            <h2 className="text-xl font-semibold tracking-tight text-primary group-hover:text-black transition-colors">
              {project.name}
            </h2>
          </div>
          <div className="text-[10px] font-mono text-secondary uppercase tracking-wider mt-1.5 ml-[24px]">
            {project.category} {project.subCategory && `/ ${project.subCategory}`}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setShowAddForm(!showAddForm); }} className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 transition-colors">
                <Plus size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete project?')) deleteProject(project.id);
                }}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-200 transition-colors text-red-500"
              >
                <Trash size={18} />
              </button>
            </>
          )}
          <div className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 transition-colors">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddUpdate} className="mb-4 p-4 bg-white rounded-lg shadow">
          <textarea
            value={newUpdate.description}
            onChange={(e) => setNewUpdate({ ...newUpdate, description: e.target.value })}
            placeholder="Update description"
            className="w-full p-2 border rounded mb-2"
            required
          />
          <input
            type="text"
            value={newUpdate.person}
            onChange={(e) => setNewUpdate({ ...newUpdate, person: e.target.value })}
            placeholder="PIC (Person In Charge)"
            className="w-full p-2 border rounded mb-2"
            required
          />
          <select
            value={newUpdate.status}
            onChange={(e) => setNewUpdate({ ...newUpdate, status: e.target.value as Status })}
            className="w-full p-2 border rounded mb-2"
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add</button>
        </form>
      )
      }

      {/* Column Headers */}
      <div className="grid grid-cols-12 gap-4 px-2 py-2 text-[10px] font-mono text-secondary uppercase tracking-widest opacity-60 border-b border-gray-200 mb-2">
        <div className="col-span-1">Status</div>
        <div className="col-span-2">Date</div>
        <div className="col-span-6">Latest Update</div>
        <div className="col-span-2">PIC</div>
        <div className="col-span-1 text-right">State</div>
      </div>

      {/* Content */}
      <div className="flex flex-col">
        {/* Always show latest update (if exists) */}
        {latestUpdate && (
          <UpdateRow
            update={latestUpdate}
            isEditing={editingUpdateId === latestUpdate.id}
            editForm={editForm}
            setEditForm={setEditForm}
            onSave={() => handleSaveEdit(latestUpdate.id)}
            onCancel={cancelEdit}
            onEdit={() => startEdit(latestUpdate)}
            onDelete={() => handleDeleteUpdate(latestUpdate.id)}
            user={user}
          />
        )}

        {/* Show remaining updates if expanded */}
        {isExpanded && otherUpdates.length > 0 && (
          <div className="mt-2 pl-4 border-l-2 border-gray-200 ml-1.5 space-y-1">
            <div className="px-2 py-1 text-[10px] text-gray-400 font-mono uppercase">History Log</div>
            {otherUpdates.map(u => (
              <UpdateRow
                key={u.id}
                update={u}
                isEditing={editingUpdateId === u.id}
                editForm={editForm}
                setEditForm={setEditForm}
                onSave={() => handleSaveEdit(u.id)}
                onCancel={cancelEdit}
                onEdit={() => startEdit(u)}
                onDelete={() => handleDeleteUpdate(u.id)}
                user={user}
              />
            ))}
          </div>
        )}
      </div>
    </div >
  );
};