"use client"

import { Plus } from "lucide-react"

export function ImageUploadGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="aspect-video border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
        <div className="text-center">
          <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">添加截图</p>
        </div>
      </div>
    </div>
  )
} 