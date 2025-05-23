"use client"

import type React from "react"

import { cn } from "@/lib/utils"

interface DeploymentOptionCardProps {
  title: string
  description: string
  icon: React.ReactNode
  isActive: boolean
  onClick: () => void
}

export function DeploymentOptionCard({ title, description, icon, isActive, onClick }: DeploymentOptionCardProps) {
  return (
    <div
      className={cn(
        "border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:border-primary/50 hover:-translate-y-1",
        isActive ? "border-primary bg-primary/5" : "border-gray-200",
      )}
      onClick={onClick}
    >
      <h4 className="flex items-center gap-2 font-medium mb-2">
        <span className={cn(isActive ? "text-primary" : "text-gray-500")}>{icon}</span>
        {title}
      </h4>
      <p className="text-xs text-gray-600">{description}</p>
    </div>
  )
}
