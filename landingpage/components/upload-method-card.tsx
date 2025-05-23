"use client"

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
    <button
      className={cn(
        "p-6 rounded-lg border-2 text-left transition-all",
        isActive
          ? "border-primary bg-primary/5"
          : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
      )}
      onClick={onClick}
    >
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </button>
  )
} 