'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { Building2, CalendarIcon } from 'lucide-react';
import { Company } from '@/types/documents';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AddCompanyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCompany: (company: Company) => void;
  existingCompanies: Company[];
  maxCompanies: number;
}

export function AddCompanyDialog({ 
  isOpen, 
  onClose, 
  onAddCompany, 
  existingCompanies, 
  maxCompanies 
}: AddCompanyDialogProps) {
  const [companyName, setCompanyName] = useState('');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to calculate experience duration
  const calculateExperience = (from: Date, to: Date): string => {
    const diffInMonths = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
    const years = Math.floor(diffInMonths / 12);
    const months = diffInMonths % 12;
    
    if (years > 0 && months > 0) {
      return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`;
    } else if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else {
      return `${months} month${months > 1 ? 's' : ''}`;
    }
  };

  // Function to format date for API
  const formatDateForAPI = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    if (companyName.trim().length < 2) {
      toast.error('Company name must be at least 2 characters long');
      return;
    }

    if (!fromDate) {
      toast.error('Please select a start date');
      return;
    }

    if (!toDate) {
      toast.error('Please select an end date');
      return;
    }

    if (fromDate >= toDate) {
      toast.error('Start date must be before end date');
      return;
    }

    if (existingCompanies.some(company => company.name.toLowerCase() === companyName.trim().toLowerCase())) {
      toast.error('Company with this name already exists');
      return;
    }

    if (existingCompanies.length >= maxCompanies) {
      toast.error(`Maximum ${maxCompanies} companies allowed`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const experienceDuration = calculateExperience(fromDate, toDate);
      const fromDateStr = formatDateForAPI(fromDate);
      const toDateStr = formatDateForAPI(toDate);
      
      // Normalize company name to lowercase for consistent matching
      const normalizedCompanyName = companyName.trim().toLowerCase();
      const displayCompanyName = companyName.trim(); // Keep original case for display
      
      const newCompany: Company = {
        name: normalizedCompanyName, // Store as lowercase for consistent matching
        fromDate: fromDateStr,
        toDate: toDateStr,
        category: `${normalizedCompanyName} Company Documents`, // Use lowercase for category
        description: `Worked at ${displayCompanyName} from ${format(fromDate, 'MMM dd, yyyy')} to ${format(toDate, 'MMM dd, yyyy')} (${experienceDuration})` // Keep original case in description
      };
      
      await onAddCompany(newCompany);
      setCompanyName('');
      setFromDate(undefined);
      setToDate(undefined);
      onClose();
      toast.success(`Company "${displayCompanyName}" added successfully!`);
    } catch {
      toast.error('Failed to add company. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setCompanyName('');
      setFromDate(undefined);
      setToDate(undefined);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center py-2 gap-2">
            <Building2 className="h-5 w-5" />
            Add New Company
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              type="text"
              placeholder="Enter company name (e.g., WorldVisa)"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isSubmitting}
              className="w-full border h-11 border-gray-200 rounded-lg"
              maxLength={50}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11 border-gray-200",
                      !fromDate && "text-muted-foreground"
                    )}
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "MMM dd, yyyy") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    defaultMonth={fromDate || new Date()}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                    captionLayout='dropdown'
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-3">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11 border-gray-200",
                      !toDate && "text-muted-foreground"
                    )}
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "MMM dd, yyyy") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    defaultMonth={toDate || fromDate || new Date()}
                    disabled={(date) => 
                      date > new Date() || 
                      date < new Date("1900-01-01") ||
                      (fromDate ? date <= fromDate : false)
                    }
                    initialFocus
                    captionLayout='dropdown'
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Experience Summary */}
          {fromDate && toDate && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Experience:</strong> {calculateExperience(fromDate, toDate)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {format(fromDate, "MMM dd, yyyy")} - {format(toDate, "MMM dd, yyyy")}
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {existingCompanies.length}/{maxCompanies} companies added
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !companyName.trim() || !fromDate || !toDate}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4" />
                  Add Company
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

