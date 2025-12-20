import React, { useState } from 'react';
import { FilterNode } from '../types';
import { Plus } from 'lucide-react';

interface FilterColumnProps {
  title: string;
  items: FilterNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  levelIndex: number;
  onAdd?: (name: string) => void;
}

export const FilterColumn: React.FC<FilterColumnProps> = ({
  title,
  items,
  selectedId,
  onSelect,
  onAdd
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && onAdd) {
      onAdd(newName.trim());
      setNewName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col min-w-[200px] relative">
      {/* Fixed height header */}
      <div className="h-12 flex items-center justify-between mb-2 border-b border-black/10 pr-2 group/header">
        <h3 className="text-xs font-bold text-black uppercase tracking-widest">{title}</h3>
        {onAdd && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`text-black/20 hover:text-black transition-colors ${isAdding ? 'text-black' : ''}`}
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
              className="w-full text-sm py-1 border-b border-black outline-none bg-transparent placeholder:text-black/20"
              placeholder={`New ${title}...`}
              autoFocus
              onBlur={() => !newName && setIsAdding(false)}
            />
          </form>
        )}

        {items.map((item, index) => {
          const isSelected = selectedId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`
                flex items-center text-left text-sm px-0 transition-all duration-200 h-8 hover:opacity-100 group
                ${isSelected ? 'opacity-100 font-bold' : 'opacity-40 hover:opacity-100'}
              `}
            >
              <span className={`text-[10px] w-6 font-mono transition-opacity ${isSelected ? 'text-black' : 'text-gray-400 group-hover:text-black'}`}>
                {(index + 1).toString().padStart(2, '0')}
              </span>
              <span className={`${isSelected ? 'text-black' : 'text-black/80'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};