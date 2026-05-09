import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { ProjectData } from '@/lib/types/projectTypes';
import { getNextRequiredStep, getStepMetadata, markStepComplete } from '@/lib/walkthrough';

interface WalkthroughNavigationProps {
  project: ProjectData;
  currentStepNumber: number;
  onNavigate: (route: string) => void;
  onUpdate?: (updates: Partial<ProjectData>) => void;
  showPrevious?: boolean;
  disabled?: boolean;
}

export function WalkthroughNavigation({
  project,
  currentStepNumber,
  onNavigate,
  onUpdate,
  showPrevious = true,
  disabled = false,
}: WalkthroughNavigationProps) {
  const nextStep = getNextRequiredStep(project, currentStepNumber);
  const previousStep = getStepMetadata(currentStepNumber - 1);

  const handleContinue = () => {
    if (disabled) return;

    if (onUpdate) {
      const updates = markStepComplete(project, currentStepNumber);
      onUpdate(updates);
    }

    if (nextStep) {
      onNavigate(nextStep.route);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (previousStep) {
      onNavigate(previousStep.route);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!nextStep) return null;

  const isGoingBack = nextStep.stepNumber < currentStepNumber;
  const isFinalStep = nextStep.stepNumber === 10 && !isGoingBack;

  let buttonText = '';
  if (isGoingBack) {
    buttonText = `Go back to Step ${nextStep.stepNumber}: ${nextStep.stepName}`;
  } else if (isFinalStep) {
    buttonText = 'Continue to Build your Business Plan';
  } else {
    buttonText = `Continue to Step ${nextStep.stepNumber}: ${nextStep.stepName}`;
  }

  return (
    <div className="flex items-center justify-between gap-4 pt-6 border-t">
      {showPrevious && previousStep ? (
        <Button
          variant="outline"
          onClick={handlePrevious}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {previousStep.stepName}
        </Button>
      ) : (
        <div />
      )}

      <Button
        onClick={handleContinue}
        disabled={disabled}
        className="gap-2 bg-brand hover:bg-brand/90 text-brand-foreground"
      >
        {buttonText}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
