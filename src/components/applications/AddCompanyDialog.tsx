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
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';
import { Company } from '@/types/documents';

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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (fromDate > toDate) {
      toast.error('Start date cannot be after end date');
      return;
    }

    if (existingCompanies.some(company => company.name === companyName.trim())) {
      toast.error('Company with this name already exists');
      return;
    }

    if (existingCompanies.length >= maxCompanies) {
      toast.error(`Maximum ${maxCompanies} companies allowed`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const newCompany: Company = {
        name: companyName.trim(),
        fromDate,
        toDate,
        category: `${companyName.trim()} Company Documents`
      };
      
      await onAddCompany(newCompany);
      setCompanyName('');
      setFromDate('');
      setToDate('');
      onClose();
      toast.success(`Company "${companyName.trim()}" added successfully!`);
    } catch {
      toast.error('Failed to add company. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setCompanyName('');
      setFromDate('');
      setToDate('');
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
              <Label htmlFor="fromDate">From (Month/Year)</Label>
              <Input
                id="fromDate"
                type="month"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full border h-11 border-gray-200 rounded-lg"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="toDate">To (Month/Year)</Label>
              <Input
                id="toDate"
                type="month"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full border h-11 border-gray-200 rounded-lg"
              />
            </div>
          </div>

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
