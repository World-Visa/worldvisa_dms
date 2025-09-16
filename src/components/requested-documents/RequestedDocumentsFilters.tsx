'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RequestedDocumentsFilters {
  search: string;
  status: string;
  priority: string;
  requestedBy: string;
  requestedTo: string;
}

interface RequestedDocumentsFiltersProps {
  filters: RequestedDocumentsFilters;
  onFiltersChange: (filters: RequestedDocumentsFilters) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  totalCount?: number;
  filteredCount?: number;
}

export function RequestedDocumentsFilters({
  filters,
  onFiltersChange,
  onRefresh,
  isRefreshing = false,
  totalCount = 0,
  filteredCount = 0
}: RequestedDocumentsFiltersProps) {
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  const handleFilterChange = (key: keyof RequestedDocumentsFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: '',
      priority: '',
      requestedBy: '',
      requestedTo: ''
    });
  };

  // const getActiveFiltersCount = () => {
  //   return Object.values(filters).filter(value => value !== '').length;
  // };

  return (
    <div className="space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documents, categories, or users..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 w-full md:w-[50%] h-11 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Clear Filters</span>
            </Button>
          )}
        </div>
      </div>

    </div>
  );
}
