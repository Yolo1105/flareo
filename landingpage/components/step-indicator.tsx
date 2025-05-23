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
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <button
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
              step.id === currentStep
                ? "bg-primary text-white"
                : step.id <= maxCompletedStep
                ? "bg-primary/10 text-primary cursor-pointer"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
            onClick={() => onStepClick(step.id)}
            disabled={step.id > maxCompletedStep}
          >
            {step.id}
          </button>
          <span
            className={cn(
              "ml-2 text-sm font-medium",
              step.id === currentStep
                ? "text-primary"
                : step.id <= maxCompletedStep
                ? "text-gray-600"
                : "text-gray-400"
            )}
          >
            {step.label}
          </span>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-full h-0.5 mx-4",
                step.id < maxCompletedStep ? "bg-primary" : "bg-gray-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
} 