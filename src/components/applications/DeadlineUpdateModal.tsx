"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock } from "lucide-react";
import { useDeadlineUpdate } from "@/hooks/useDeadlineUpdate";
import { formatDate } from "@/utils/format";

interface DeadlineUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  currentDeadline?: string;
  applicationName?: string;
}

export function DeadlineUpdateModal({
  isOpen,
  onClose,
  leadId,
  currentDeadline,
  applicationName,
}: DeadlineUpdateModalProps) {
  const [deadlineDate, setDeadlineDate] = useState("");
  const deadlineUpdate = useDeadlineUpdate();

  // Initialize the date input when modal opens
  useEffect(() => {
    if (isOpen && currentDeadline) {
      // Convert the deadline to YYYY-MM-DD format for the date input
      try {
        const date = new Date(currentDeadline);
        // Use local date components to avoid timezone conversion issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        setDeadlineDate(formattedDate);
      } catch (error) {
        console.error("Error parsing current deadline:", error);
        setDeadlineDate("");
      }
    } else if (isOpen) {
      setDeadlineDate("");
    }
  }, [isOpen, currentDeadline]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deadlineDate) {
      return;
    }

    try {
      await deadlineUpdate.mutateAsync({
        leadId,
        deadlineDate,
      });
      onClose();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleClose = () => {
    if (!deadlineUpdate.isPending) {
      onClose();
    }
  };

  const isFormValid = deadlineDate && deadlineDate.trim() !== "";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Update Application Deadline
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {applicationName && (
            <div className="text-sm text-muted-foreground">
              <strong>Application:</strong> {applicationName}
            </div>
          )}
          
          {currentDeadline && (
            <div className="text-sm text-muted-foreground">
              <strong>Current Deadline:</strong> {formatDate(currentDeadline)}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="deadline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              New Deadline
            </Label>
            <Input
              id="deadline"
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              className="w-full"
              required
              min={new Date().toISOString().split('T')[0]} // Prevent selecting past dates
            />
            <p className="text-xs text-muted-foreground">
              Select the deadline for application lodgement
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={deadlineUpdate.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || deadlineUpdate.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {deadlineUpdate.isPending ? "Updating..." : "Update Deadline"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
