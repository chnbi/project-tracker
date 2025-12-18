import React from 'react';
import { FilterNode } from '../types';

interface FilterColumnProps {
  title: string;
  items: FilterNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  levelIndex: number;
}

export const FilterColumn: React.FC<FilterColumnProps> = ({
  title,
  items,
  selectedId,
  onSelect,
}) => {
  return (
    <div className="flex flex-col min-w-[200px] relative">
      {/* Fixed height header for alignment calculation */}
      <div className="h-12 flex items-center mb-2">
        <h3 className="text-sm font-medium text-primary uppercase tracking-wide opacity-80">{title}</h3>
      </div>
      
      <div className="flex flex-col space-y-0">
        {items.map((item, index) => {
          const isSelected = selectedId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`
                flex items-center text-left text-sm px-2 rounded-sm transition-all duration-300 h-8
                ${isSelected ? 'bg-gray-200 font-medium text-primary translate-x-1' : 'text-secondary hover:text-primary hover:bg-gray-50'}
              `}
            >
              <span className="text-[10px] w-6 opacity-40 font-mono">
                {(index + 1).toString().padStart(2, '0')}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};