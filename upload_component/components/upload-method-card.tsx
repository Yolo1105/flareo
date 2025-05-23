"use client"

import type React from "react"

import { cn } from "@/lib/utils"

interface UploadMethodCardProps {
  title: string
  description: string
  icon: React.ReactNode
  isActive: boolean
  onClick: () => void
}

export function UploadMethodCard({ title, description, icon, isActive, onClick }: UploadMethodCardProps) {
  return (
    <div
      className={cn(
        "border-2 rounded-lg p-6 cursor-pointer transition-all duration-300 hover:border-primary/50 hover:-translate-y-1",
        isActive ? "border-primary bg-primary/5" : "border-gray-200",
      )}
      onClick={onClick}
    >
      <h3 className="flex items-center gap-2 font-semibold mb-2 text-gray-900">
        <span className={cn(isActive ? "text-primary" : "text-gray-500")}>{icon}</span>
        {title}
      </h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}
