'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DescriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: string;
  description: string;
}

export const DescriptionDialog = ({
  isOpen,
  onClose,
  documentType,
  description,
}: DescriptionDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {documentType} - Description
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="prose max-w-none">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {description}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
