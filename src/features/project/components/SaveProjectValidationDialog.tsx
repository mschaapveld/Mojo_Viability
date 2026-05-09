import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface SaveProjectValidationDialogProps {
  open: boolean;
  onClose: () => void;
  onGoToSetup?: () => void;
  missingFields: string[];
}

export function SaveProjectValidationDialog({
  open,
  onClose,
  onGoToSetup,
  missingFields,
}: SaveProjectValidationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <DialogTitle>Project Information Required</DialogTitle>
          </div>
          <DialogDescription className="pt-4">
            To save this project, please provide the following required information:
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ul className="list-disc list-inside space-y-2 text-sm text-slate-700">
            {missingFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {onGoToSetup && (
            <Button onClick={onGoToSetup} className="bg-blue-600 hover:bg-blue-700">
              Go to Project Setup
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
