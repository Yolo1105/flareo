"use client"

import { cn } from "@/lib/utils"

interface Step {
  id: number
  label: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  maxCompletedStep: number
  onStepClick: (step: number) => void
}

export function StepIndicator({ steps, currentStep, maxCompletedStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="relative">
      <div className="flex justify-between items-center">
        {steps.map((step) => {
          const isCompleted = step.id < currentStep
          const isCurrent = step.id === currentStep
          const isClickable = step.id <= maxCompletedStep

          return (
            <div
              key={step.id}
              className={cn(
                "flex flex-col items-center relative z-10",
                isCompleted || isCurrent ? "text-primary" : "text-gray-400",
                isClickable ? "cursor-pointer" : "cursor-not-allowed",
              )}
              onClick={() => isClickable && onStepClick(step.id)}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mb-2 border-2",
                  isCurrent
                    ? "border-primary bg-primary text-white"
                    : isCompleted
                      ? "border-primary bg-white text-primary"
                      : "border-gray-200 bg-gray-200 text-white",
                )}
              >
                {step.id}
              </div>
              <span className="text-sm font-medium text-center">{step.label}</span>
            </div>
          )
        })}
      </div>

      {/* Progress line */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>
      </div>
    </div>
  )
} 