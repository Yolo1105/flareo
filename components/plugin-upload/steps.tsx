import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
}

interface StepsProps {
  steps: Step[];
  currentStep: number;
}

export function Steps({ steps, currentStep }: StepsProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full border-2',
              currentStep === index
                ? 'border-primary bg-primary text-primary-foreground'
                : currentStep > index
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted-foreground text-muted-foreground'
            )}
          >
            {index + 1}
          </div>
          <span
            className={cn(
              'ml-2 text-sm font-medium',
              currentStep >= index ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {step.title}
          </span>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'w-24 h-0.5 mx-4',
                currentStep > index ? 'bg-primary' : 'bg-muted-foreground'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
} 