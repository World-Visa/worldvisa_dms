'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const DOCUMENT_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'bank-statement', label: 'Bank Statement' },
  { value: 'itr', label: 'ITR (Income Tax Return)' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'employment-letter', label: 'Employment Letter' },
  { value: 'educational-certificates', label: 'Educational Certificates' },
  { value: 'medical-certificate', label: 'Medical Certificate' },
  { value: 'travel-insurance', label: 'Travel Insurance' },
  { value: 'visa-application-form', label: 'Visa Application Form' },
  { value: 'photographs', label: 'Photographs' },
  { value: 'financial-documents', label: 'Financial Documents' },
  { value: 'accommodation-proof', label: 'Accommodation Proof' },
  { value: 'travel-itinerary', label: 'Travel Itinerary' },
  { value: 'sponsor-letter', label: 'Sponsor Letter' },
  { value: 'birth-certificate', label: 'Birth Certificate' },
  { value: 'marriage-certificate', label: 'Marriage Certificate' },
];

interface DocumentTypeSelectorProps {
  selectedDocumentType: string;
  onDocumentTypeChange: (documentType: string) => void;
}

export function DocumentTypeSelector({ selectedDocumentType, onDocumentTypeChange }: DocumentTypeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customDocumentType, setCustomDocumentType] = useState('');

  const handleDocumentSelect = (currentValue: string) => {
    onDocumentTypeChange(currentValue === selectedDocumentType ? '' : currentValue);
    setOpen(false);
  };

  const handleAddCustomDocument = () => {
    if (customDocumentType.trim()) {
      onDocumentTypeChange(customDocumentType.trim());
      setCustomDocumentType('');
      setIsCustomMode(false);
    }
  };

  const handleToggleCustomMode = () => {
    setIsCustomMode(!isCustomMode);
    setCustomDocumentType('');
    onDocumentTypeChange('');
    setSearchValue('');
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Document Type</label>
      <div className="flex items-center gap-2">
        {!isCustomMode ? (
          <div className='flex flex-col w-full'>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="flex-1 justify-between"
                >
                  {selectedDocumentType
                    ? DOCUMENT_TYPES.find((doc) => doc.value === selectedDocumentType)?.label || selectedDocumentType
                    : "Select document type..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Search document type..." 
                    className="h-9"
                    value={searchValue}
                    onValueChange={setSearchValue}
                  />
                  <CommandList className="max-h-[200px] overflow-y-auto">
                    <CommandEmpty>No document type found.</CommandEmpty>
                    <CommandGroup>
                      {DOCUMENT_TYPES
                        .filter((doc) => 
                          doc.label.toLowerCase().includes(searchValue.toLowerCase())
                        )
                        .map((doc) => (
                          <CommandItem
                            key={doc.value}
                            value={doc.value}
                            onSelect={() => handleDocumentSelect(doc.value)}
                          >
                            {doc.label}
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                selectedDocumentType === doc.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200"></span>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-secondary px-2 text-muted-foreground">or</span>
              </div>
            </div>
            <Button
              variant="link"
              size="sm"
              onClick={handleToggleCustomMode}
              className="text-sm underline"
            >
              Add new document
            </Button>
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder="Enter custom document type"
              value={customDocumentType}
              onChange={(e) => setCustomDocumentType(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddCustomDocument();
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCustomDocument}
              disabled={!customDocumentType.trim()}
              className="flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleCustomMode}
              className="text-sm"
            >
              Cancel
            </Button>
          </>
        )}
      </div>
      {selectedDocumentType && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Selected:</span>
          <span className="text-sm font-medium">{selectedDocumentType}</span>
        </div>
      )}
    </div>
  );
}
