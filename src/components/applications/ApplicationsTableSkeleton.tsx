'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const ApplicationsTableSkeleton = memo(function ApplicationsTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-48" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Table Header Skeleton */}
          <div className="grid grid-cols-6 gap-4 p-4 border-b">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40 hidden lg:block" />
            <Skeleton className="h-4 w-24 hidden md:block" />
            <Skeleton className="h-4 w-28 hidden sm:block" />
            <Skeleton className="h-4 w-16" />
          </div>
          
          {/* Table Rows Skeleton */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b last:border-b-0">
              <Skeleton className="h-4 w-8" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
              <Skeleton className="h-4 w-full hidden lg:block" />
              <Skeleton className="h-4 w-full hidden md:block" />
              <Skeleton className="h-4 w-full hidden sm:block" />
              <div className="flex justify-center">
                <Skeleton className="h-6 w-8 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

// Skeleton for search results
export const SearchResultsSkeleton = memo(function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      
      {/* Results Skeleton */}
      <ApplicationsTableSkeleton />
    </div>
  );
});

// Skeleton for filters
export const FiltersSkeleton = memo(function FiltersSkeleton() {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Section */}
        <div className="flex gap-2 items-center max-w-2xl w-full">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-20" />
        </div>
        
        {/* Filters Section */}
        <div className="flex flex-wrap gap-4 items-center">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
});
