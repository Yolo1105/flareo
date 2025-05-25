"use client"

import { cn } from "@/lib/utils"

interface ChecklistItemProps {
  icon: React.ReactNode
  title: string
  description: string
  status: "success" | "warning" | "error"
}

export function ChecklistItem({ icon, title, description, status }: ChecklistItemProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg border",
        status === "success" && "border-green-100 bg-green-50",
        status === "warning" && "border-amber-100 bg-amber-50",
        status === "error" && "border-red-100 bg-red-50"
      )}
    >
      <div className="mt-1">{icon}</div>
      <div>
        <h4 className="font-medium mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  )
} 