import type React from "react"
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
        "flex items-start gap-3 p-4 rounded-md",
        status === "success"
          ? "bg-green-50"
          : status === "warning"
            ? "bg-amber-50"
            : status === "error"
              ? "bg-red-50"
              : "",
      )}
    >
      {icon}
      <div>
        <h4 className="font-medium mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  )
}
