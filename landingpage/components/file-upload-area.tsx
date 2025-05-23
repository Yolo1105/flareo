"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"

export function FileUploadArea() {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    // Handle file drop here
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-semibold">拖拽文件到此处上传</h3>
      <p className="mt-1 text-xs text-gray-500">或</p>
      <button className="mt-2 text-sm text-primary hover:text-primary/80">
        点击选择文件
      </button>
    </div>
  )
} 