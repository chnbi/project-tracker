import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Plus } from 'lucide-react';
import { getColorForString } from '../utils/colors';

interface Option {
    id: string;
    label: string;
}

interface NotionSelectProps {
    options: (string | Option)[]; // Can be simple strings or objects
    value: string | string[]; // Single string or array for multi
    onChange: (value: string | string[]) => void;
    onAdd?: (newValue: string) => void; // Handler if user creates new
    placeholder?: string;
    multi?: boolean;
    className?: string; // Wrapper classes
    readOnly?: boolean;
}

export const NotionSelect: React.FC<NotionSelectProps> = ({
    options,
    value,
    onChange,
    onAdd,
    placeholder = "Select...",
    multi = false,
    className = "",
    readOnly = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Normalize options to objects
    const normalizedOptions: Option[] = options.map(o =>
        typeof o === 'string' ? { id: o, label: o } : o
    );

    // Normalize value to array
    const currentValues = Array.isArray(value) ? value : (value ? [value] : []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        if (multi) {
            if (currentValues.includes(optionValue)) {
                onChange(currentValues.filter(v => v !== optionValue));
            } else {
                onChange([...currentValues, optionValue]);
            }
        } else {
            onChange(optionValue);
            setIsOpen(false);
        }
        setSearch('');
    };

    const handleCreate = () => {
        if (onAdd && search.trim()) {
            onAdd(search.trim());
            handleSelect(search.trim());
        }
    };

    // Filter options
    const filteredOptions = normalizedOptions.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase())
    );

    const showCreate = onAdd && search.trim() && !filteredOptions.some(o => o.label.toLowerCase() === search.toLowerCase());

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Trigger Area */}
            <div
                onClick={() => !readOnly && setIsOpen(!isOpen)}
                className={`flex flex-wrap items-center gap-1 p-1 min-h-[28px] cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${readOnly ? 'cursor-default' : ''}`}
            >
                {currentValues.length > 0 ? (
                    currentValues.map(val => {
                        const colorClass = getColorForString(val);
                        return (
                            <span key={val} className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium leading-4 ${colorClass.class} border border-transparent`}>
                                {val}
                                {!readOnly && multi && (
                                    <X
                                        size={10}
                                        className="ml-1 cursor-pointer opacity-50 hover:opacity-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelect(val);
                                        }}
                                    />
                                )}
                            </span>
                        );
                    })
                ) : (
                    <span className="text-gray-400 text-xs px-1">{placeholder}</span>
                )}
            </div>

            {/* Popover */}
            {isOpen && !readOnly && (
                <div
                    className="absolute top-full left-0 z-50 w-64 mt-1 rounded-md shadow-xl border border-transparent dark:border-gray-700 py-1 text-sm animate-in fade-in zoom-in-95 duration-100"
                    style={{ backgroundColor: 'var(--background)' }}
                >
                    <div className="px-2 pb-2 pt-1 border-b border-transparent dark:border-gray-700">
                        <input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)} // Don't close on space
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (filteredOptions.length > 0) handleSelect(filteredOptions[0].id);
                                    else if (showCreate) handleCreate();
                                }
                            }}
                            placeholder="Search or create..."
                            className="w-full text-xs p-1.5 bg-secondary text-foreground rounded border-none dark:border dark:border-gray-600 outline-none focus:ring-1 focus:ring-black/10 dark:focus:ring-white/20 transition-shadow placeholder:text-muted-foreground"
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto py-1">
                        <div className="px-2 py-1 text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Select an option</div>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => {
                                const isSelected = currentValues.includes(option.id);
                                const colorClass = getColorForString(option.id);

                                return (
                                    <div
                                        key={option.id}
                                        onClick={() => handleSelect(option.id)}
                                        className={`flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-secondary transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-500/10' : ''}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${colorClass.class}`}></span> {/* Dot indicator */}
                                            <span className={`px-2 py-0.5 rounded text-xs ${colorClass.class}`}>
                                                {option.label}
                                            </span>
                                        </div>
                                        {isSelected && <CheckIcon size={12} className="text-blue-500" />}
                                    </div>
                                );
                            })
                        ) : (
                            !showCreate && <div className="px-3 py-2 text-gray-400 dark:text-gray-500 text-xs italic">No matching options</div>
                        )}

                        {showCreate && (
                            <div
                                onClick={handleCreate}
                                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary text-muted-foreground border-t border-gray-100 dark:border-gray-700 mt-1"
                            >
                                <Plus size={14} />
                                <span>Create "{search}"</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper Icon
const CheckIcon = ({ className, size }: { className?: string, size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
