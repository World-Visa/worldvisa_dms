'use client';

import React, { useMemo, memo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { VisaApplication } from '@/types/applications';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/format';

interface VirtualizedTableProps {
  applications: VisaApplication[];
  onRowClick: (applicationId: string) => void;
  getSerialNumber: (index: number) => number;
}

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    applications: VisaApplication[];
    onRowClick: (applicationId: string) => void;
    getSerialNumber: (index: number) => number;
  };
}

// Memoized row component for optimal performance
const TableRow = memo(function TableRow({ index, style, data }: RowProps) {
  const { applications, onRowClick, getSerialNumber } = data;
  const application = applications[index];

  const handleClick = useCallback(() => {
    onRowClick(application.id);
  }, [onRowClick, application.id]);

  const serialNumber = useMemo(() => 
    getSerialNumber(index), 
    [getSerialNumber, index]
  );

  return (
    <div 
      style={style}
      className="flex items-center px-6 py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
      onClick={handleClick}
    >
      <div className="flex items-center space-x-6 w-full">
        {/* Serial Number */}
        <div className="w-16 text-sm text-gray-600">
          {serialNumber}
        </div>
        
        {/* Applicant Name */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {application.Name}
          </div>
        </div>
        
        {/* Email */}
        <div className="flex-1 min-w-0 hidden lg:block">
          <div className="text-sm text-gray-600 truncate">
            {application.Email}
          </div>
        </div>
        
        {/* Phone */}
        <div className="w-32 text-sm text-gray-600 hidden md:block">
          {application.Phone}
        </div>
        
        {/* Submitted At */}
        <div className="w-32 text-sm text-gray-600 hidden sm:block">
          {formatDate(application.Created_Time)}
        </div>
        
        {/* Attachments */}
        <div className="w-20 text-center">
          <Badge 
            variant={application.AttachmentCount > 0 ? "default" : "secondary"}
            className="text-xs"
          >
            {application.AttachmentCount}
          </Badge>
        </div>
      </div>
    </div>
  );
});

export const VirtualizedTable = memo(function VirtualizedTable({
  applications,
  onRowClick,
  getSerialNumber
}: VirtualizedTableProps) {
  // Memoize the row data to prevent unnecessary re-renders
  const rowData = useMemo(() => ({
    applications,
    onRowClick,
    getSerialNumber
  }), [applications, onRowClick, getSerialNumber]);

  // Calculate optimal height based on viewport
  const itemHeight = 72; // Height of each row
  const maxHeight = Math.min(applications.length * itemHeight, 600); // Max 600px height

  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="flex items-center px-6 py-3 bg-gray-50 border-b border-gray-200 font-medium text-sm text-gray-700">
        <div className="w-16">S.No</div>
        <div className="flex-1">Applicant Name</div>
        <div className="flex-1 hidden lg:block">Email</div>
        <div className="w-32 hidden md:block">Phone</div>
        <div className="w-32 hidden sm:block">Submitted At</div>
        <div className="w-20 text-center">Attachments</div>
      </div>
      
      {/* Virtualized List */}
      <List
        height={maxHeight}
        itemCount={applications.length}
        itemSize={itemHeight}
        itemData={rowData}
        overscanCount={5} // Render 5 extra items for smooth scrolling
      >
        {TableRow}
      </List>
    </div>
  );
});
