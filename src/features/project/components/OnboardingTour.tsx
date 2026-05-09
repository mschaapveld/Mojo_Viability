import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calculator, Clock, TrendingUp, DollarSign, ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingTourProps {
  open: boolean;
  onComplete: () => void;
}

const steps = [
  {
    title: 'Welcome to MojoBusiness.ai',
    description: 'Your intelligent business viability partner. Let\'s take a quick tour of the tools available to help you model your business opportunity.',
    icon: null,
  },
  {
    title: 'Break-Even Analysis',
    description: 'Start with Simple or Detailed Break-Even tools to understand the minimum sales you need to cover costs and achieve your desired return.',
    icon: Calculator,
  },
  {
    title: 'Hours of Operation',
    description: 'Plan your weekly schedule across different service periods. This feeds into your sales distribution model.',
    icon: Clock,
  },
  {
    title: 'Sales Distribution',
    description: 'Model how your sales break down by day and service period. The tool automatically adjusts for days you\'re closed.',
    icon: TrendingUp,
  },
  {
    title: 'Fitout & Financing',
    description: 'Calculate your startup costs and financing requirements. Model loans, equipment rental, and understand your capital needs.',
    icon: DollarSign,
  },
  {
    title: 'Save Your Work',
    description: 'Create an account to save projects to the cloud, export to Excel/PDF, and compare multiple business models. Ready to get started?',
    icon: null,
  },
];

export function OnboardingTour({ open, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('mojobusiness_onboarding_completed', 'true');
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('mojobusiness_onboarding_completed', 'true');
    onComplete();
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {Icon && <Icon className="h-8 w-8 text-blue-600" />}
            <DialogTitle className="text-2xl">{step.title}</DialogTitle>
          </div>
          <DialogDescription className="text-base leading-relaxed">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 my-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-blue-600'
                  : index < currentStep
                  ? 'w-2 bg-blue-400'
                  : 'w-2 bg-slate-300'
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="ghost" onClick={handleSkip}>
            Skip Tour
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            )}
            <Button onClick={handleNext}>
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                "Let's Go!"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
