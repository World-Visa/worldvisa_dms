'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
  role?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
  maxSelections?: number;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  disabled = false,
  loading = false,
  error,
  className,
  maxSelections
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (optionValue: string) => {
    if (disabled) return;
    
    const isSelected = value.includes(optionValue);
    
    if (isSelected) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      if (maxSelections && value.length >= maxSelections) {
        return; // Don't add if max selections reached
      }
      onChange([...value, optionValue]);
    }
  };

  const handleRemove = (optionValue: string, event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  const getSelectedLabels = () => {
    return value.map(val => options.find(opt => opt.value === val)?.label).filter(Boolean);
  };

  const selectedLabels = getSelectedLabels();

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={cn(
          "w-full min-h-[40px] px-3 py-2 text-left bg-white border rounded-md shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
          error ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-gray-300",
          "hover:border-gray-400 transition-colors"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            ) : selectedLabels.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedLabels.slice(0, 2).map((label, index) => {
                  const optionValue = value[index];
                  return (
                    <span
                      key={optionValue}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {label}
                      <span
                        onClick={(e) => handleRemove(optionValue, e)}
                        className="hover:bg-blue-200 rounded-full p-0.5 cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleRemove(optionValue, e);
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </span>
                  );
                })}
                {selectedLabels.length > 2 && (
                  <span className="text-xs text-gray-500">
                    +{selectedLabels.length - 2} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search admins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                {searchTerm ? 'No admins found' : 'No admins available'}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value.includes(option.value);
                const isDisabled = maxSelections && value.length >= maxSelections && !isSelected;
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggle(option.value)}
                    disabled={!!isDisabled}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none",
                      "flex items-center justify-between",
                      isSelected && "bg-blue-50 text-blue-900",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{option.label}</div>
                        {option.role && (
                          <div className="text-xs text-gray-500 capitalize">
                            {option.role.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer with selection count */}
          {maxSelections && (
            <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
              {value.length}/{maxSelections} selected
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
