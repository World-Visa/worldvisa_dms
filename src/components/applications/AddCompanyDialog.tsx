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
import { Building2, CalendarIcon, Check } from 'lucide-react';
import { Company } from '@/types/documents';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  generateCurrentEmploymentDescription, 
  generatePastEmploymentDescription 
} from '@/utils/dateCalculations';

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
    const [isCurrentEmployment, setIsCurrentEmployment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to calculate experience duration (for past employment)
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

  // Function to calculate current employment duration
  const calculateCurrentExperience = (from: Date): string => {
    const now = new Date();
    const diffInMonths = (now.getFullYear() - from.getFullYear()) * 12 + (now.getMonth() - from.getMonth());
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

    // Only validate end date if not current employment
    if (!isCurrentEmployment) {
      if (!toDate) {
        toast.error('Please select an end date');
        return;
      }

      if (fromDate >= toDate) {
        toast.error('Start date must be before end date');
        return;
      }
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
      const fromDateStr = formatDateForAPI(fromDate);
      const toDateStr = isCurrentEmployment ? null : formatDateForAPI(toDate!);
      
      // Normalize company name to lowercase for consistent matching
      const normalizedCompanyName = companyName.trim().toLowerCase();
      const displayCompanyName = companyName.trim(); // Keep original case for display
      
      // Generate appropriate description based on employment type
      const description = isCurrentEmployment
        ? generateCurrentEmploymentDescription(displayCompanyName, fromDateStr)
        : generatePastEmploymentDescription(displayCompanyName, fromDateStr, toDateStr!);
      
      const newCompany: Company = {
        name: normalizedCompanyName, // Store as lowercase for consistent matching
        fromDate: fromDateStr,
        toDate: toDateStr,
        isCurrentEmployment: isCurrentEmployment,
        category: `${displayCompanyName} Company Documents`, // Use original case for category display
        description: description
      };
      
      await onAddCompany(newCompany);
      setCompanyName('');
      setFromDate(undefined);
      setToDate(undefined);
      setIsCurrentEmployment(false);
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
      setIsCurrentEmployment(false);
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

          {/* Current Employment Checkbox */}
          <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isCurrentEmployment"
                checked={isCurrentEmployment}
                onChange={(e) => setIsCurrentEmployment(e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="isCurrentEmployment" className="text-sm font-medium text-blue-800 cursor-pointer">
                Currently working here
              </Label>
            </div>
            {isCurrentEmployment && (
              <div className="flex items-center text-xs text-blue-600">
                <Check className="h-3 w-3 mr-1" />
                End date not required
              </div>
            )}
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
            {!isCurrentEmployment && (
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
            )}
          </div>

          {/* Experience Summary */}
          {fromDate && (
            <div className={cn(
              "p-3 border rounded-lg",
              isCurrentEmployment 
                ? "bg-green-50 border-green-200" 
                : "bg-blue-50 border-blue-200"
            )}>
              <p className={cn(
                "text-sm",
                isCurrentEmployment ? "text-green-800" : "text-blue-800"
              )}>
                <strong>Experience:</strong> {
                  isCurrentEmployment 
                    ? calculateCurrentExperience(fromDate)
                    : toDate ? calculateExperience(fromDate, toDate) : "Select end date"
                }
              </p>
              <p className={cn(
                "text-xs mt-1",
                isCurrentEmployment ? "text-green-600" : "text-blue-600"
              )}>
                {isCurrentEmployment 
                  ? `Since ${format(fromDate, "MMM dd, yyyy")} (Current)`
                  : toDate ? `${format(fromDate, "MMM dd, yyyy")} - ${format(toDate, "MMM dd, yyyy")}` 
                  : `From ${format(fromDate, "MMM dd, yyyy")}`
                }
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
              disabled={isSubmitting || !companyName.trim() || !fromDate || (!isCurrentEmployment && !toDate)}
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

