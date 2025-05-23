"use client"

import { cn } from "@/lib/utils"

interface PricingOptionCardProps {
  title: string
  description: string
  isActive: boolean
  onClick: () => void
}

export function PricingOptionCard({ title, description, isActive, onClick }: PricingOptionCardProps) {
  return (
    <div
      className={cn(
        "border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-primary/50",
        isActive ? "border-primary bg-primary/5" : "border-gray-200",
      )}
      onClick={onClick}
    >
      <h4 className={cn("font-medium mb-1", isActive ? "text-primary" : "text-gray-900")}>{title}</h4>
      <p className="text-xs text-gray-600">{description}</p>
    </div>
  )
}
