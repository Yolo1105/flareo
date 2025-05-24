"use client"

import { Card } from "@/components/ui/card"

interface PluginPreviewProps {
  name: string
  description: string
  tags: string[]
}

export function PluginPreview({ name, description, tags }: PluginPreviewProps) {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="bg-gray-100 text-gray-700 text-sm px-2 py-1 rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    </Card>
  )
} 