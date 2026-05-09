import { CheckCircle2, Loader2, AlertCircle, Cloud } from 'lucide-react';
import { SaveStatus } from '@/features/project/hooks/useProjectAutoSave';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  error?: string | null;
  onRetry?: () => void;
}

export function SaveStatusIndicator({ status, error, onRetry }: SaveStatusIndicatorProps) {
  if (status === 'unsaved') {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'saved':
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-success" />,
          text: 'Saved',
          tooltip: 'All changes saved',
          className: 'text-success',
        };
      case 'saving':
        return {
          icon: <Loader2 className="h-4 w-4 text-info animate-spin" />,
          text: 'Saving...',
          tooltip: 'Saving your changes',
          className: 'text-info',
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4 text-destructive" />,
          text: 'Not saved',
          tooltip: error || 'Failed to save changes',
          className: 'text-destructive',
        };
      default:
        return {
          icon: <Cloud className="h-4 w-4 text-muted-foreground/60" />,
          text: 'Unsaved',
          tooltip: 'Changes not yet saved',
          className: 'text-muted-foreground/60',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-card/50 border border-border">
            {config.icon}
            <span className={`text-sm font-medium ${config.className}`}>
              {config.text}
            </span>
            {status === 'error' && onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetry}
                className="h-6 px-2 text-xs"
              >
                Retry
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
