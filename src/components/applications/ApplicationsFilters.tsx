'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Search, User, Phone, Mail } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select';


interface ApplicationsFiltersProps {
  search: string;
  searchType: 'name' | 'phone' | 'email';
  dateRange: DateRange | undefined;
  limit: number;
  isSearchMode?: boolean;
  onSearchChange: (value: string) => void;
  onSearchTypeChange: (type: 'name' | 'phone' | 'email') => void;
  onSearchClick: () => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onLimitChange: (value: number) => void;
  onClearFilters: () => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
}

export function ApplicationsFilters({
  search,
  searchType,
  dateRange,
  limit,
  isSearchMode = false,
  onSearchChange,
  onSearchTypeChange,
  onSearchClick,
  onDateRangeChange,
  onLimitChange,
  onClearFilters,
  onKeyPress,
}: ApplicationsFiltersProps) {
  return (
    <div>
      <div className='w-full'>
        <div className="flex flex-col  lg:flex-row md:justify-between gap-4">
          {/* Search Bar */}
          <div className="flex gap-2 items-center max-w-2xl w-full">
            {/* Search Type Selector */}
            <Select value={searchType} onValueChange={onSearchTypeChange}>
              <SelectTrigger className='w-[140px] border border-gray-300 rounded-lg h-10'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Search by</SelectLabel>
                  <SelectItem value="name">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Name
                    </div>
                  </SelectItem>
                  <SelectItem value="phone">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </div>
                  </SelectItem>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Search Input */}
            <div className="relative border border-gray-300 rounded-lg flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={`Search by ${searchType}...`}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyPress={onKeyPress}
                className="pl-10 h-10"
              />
            </div>
            
            <Button 
              onClick={onSearchClick}
              disabled={!search.trim()}
              className={`h-10 rounded-lg ${
                isSearchMode 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-primary hover:bg-primary/90 hover:text-gray-200 text-white'
              }`}
              variant='outline'
            >
                {isSearchMode ? 'Search Again' : 'Search'}
            </Button>
          </div>

          {/* Date Range Filter */}
          <div className='flex flex-wrap gap-4 items-center'>

            <div className="w-full sm:w-auto">
              <DateRangePicker
                value={dateRange}
                onChange={onDateRangeChange}
                placeholder="Select date range"
              />
            </div>

            {/* Limit Selector */}
            <div className="flex items-center gap-2">
              <Select value={limit.toString()} onValueChange={(value) => onLimitChange(Number(value))}>
                <SelectTrigger className='w-[180px] border border-gray-300 rounded-lg'>
                  <SelectValue placeholder="Select page limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Page Limit</SelectLabel>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="whitespace-nowrap"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}