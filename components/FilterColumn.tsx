import React, { useState } from 'react';
import { FilterNode } from '../types';
import { Plus, Pencil, Trash } from 'lucide-react';

interface FilterColumnProps {
  title: string;
  items: FilterNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  levelIndex: number;
  onAdd?: (name: string) => void;
  onRename?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
}

export const FilterColumn: React.FC<FilterColumnProps> = ({
  title,
  items,
  selectedId,
  onSelect,
  onAdd,
  onRename,
  onDelete
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && onAdd) {
      onAdd(newName.trim());
      setNewName('');
      setIsAdding(false);
    }
  };

  const startRename = (id: string, currentLabel: string) => {
    setRenamingId(id);
    setRenameValue(currentLabel);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (renamingId && renameValue.trim() && onRename) {
      onRename(renamingId, renameValue.trim());
      setRenamingId(null);
    }
  };

  return (
    <div className="flex flex-col min-w-[200px] relative">
      {/* Fixed height header */}
      <div className="h-12 flex items-center justify-between mb-2 border-b border-black/10 dark:border-white/20 pr-2 group/header">
        <h3 className="text-xs font-bold uppercase tracking-widest">{title}</h3>
        {onAdd && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`text-black/20 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors ${isAdding ? 'text-black dark:text-white' : ''}`}
            title="Add New"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      <div className="flex flex-col space-y-0.5">
        {onAdd && isAdding && (
          <form onSubmit={handleAdd} className="mb-2 px-0">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full text-sm py-1 border-b border-black dark:border-white outline-none bg-transparent placeholder:text-black/20 dark:placeholder:text-white/30"
              placeholder={`New ${title}...`}
              autoFocus
              onBlur={() => !newName && setIsAdding(false)}
            />
          </form>
        )}

        {items.map((item, index) => {
          const isSelected = selectedId === item.id;
          const isRenaming = renamingId === item.id;

          if (isRenaming) {
            return (
              <form key={item.id} onSubmit={handleRenameSubmit} className="h-8 flex items-center px-0">
                <input
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  className="w-full text-xs py-0.5 border-b border-black outline-none bg-transparent font-mono"
                  autoFocus
                  onBlur={() => setRenamingId(null)}
                />
              </form>
            )
          }

          return (
            <div key={item.id} className="group flex items-center h-8 relative pr-8">
              <button
                onClick={() => onSelect(item.id)}
                className={`
                    flex items-center text-left text-sm px-0 transition-all duration-200 w-full
                    ${isSelected ? 'opacity-100 font-bold' : 'opacity-100' /* Keep opacity 100 to let text color handle dimming */}
                `}
              >
                <span className={`text-[10px] w-6 font-mono transition-opacity ${isSelected ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <span className={`${isSelected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground transition-colors'}`}>{item.label}</span>
              </button>

              {/* Actions (Only if handlers provided, which means Auth) */}
              {onRename && onDelete && item.id !== 'all' && (
                <div className="absolute right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background">
                  <button onClick={() => startRename(item.id, item.label)} className="text-muted-foreground/50 hover:text-foreground"><Pencil size={10} /></button>
                  <button onClick={() => { if (confirm('Delete category?')) onDelete(item.id) }} className="text-muted-foreground/50 hover:text-red-500"><Trash size={10} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};