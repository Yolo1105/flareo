"use client"

import { cn } from "@/lib/utils"

interface StepIndicatorProps {
  currentStep: number
  onStepClick?: (step: number) => void
}

export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  const steps = [
    { label: "选择部署方式" },
    { label: "配置参数" },
    { label: "预览和验证" },
    { label: "部署执行" },
    { label: "部署完成" },
  ]

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const clickable = index < currentStep && !!onStepClick
        return (
          <div key={index} className="flex items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                index === currentStep
                  ? "bg-primary text-primary-foreground"
                  : clickable
                    ? "bg-primary/20 text-primary cursor-pointer"
                    : "bg-gray-100 text-gray-400",
              )}
              onClick={clickable ? () => onStepClick(index) : undefined}
              style={{ cursor: clickable ? "pointer" : "default" }}
            >
              {index + 1}
            </div>
            <div
              className={cn(
                "ml-2 text-sm font-medium transition-colors",
                index === currentStep
                  ? "text-primary"
                  : clickable
                    ? "text-gray-600 cursor-pointer"
                    : "text-gray-400",
              )}
              onClick={clickable ? () => onStepClick(index) : undefined}
              style={{ cursor: clickable ? "pointer" : "default" }}
            >
              {step.label}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-16 h-0.5 mx-4",
                  index < currentStep ? "bg-primary" : "bg-gray-200",
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
