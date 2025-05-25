"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Upload } from "lucide-react"

interface FileUploadAreaProps {
  onFileSelect?: (file: File) => void
  accept?: string
  maxSize?: number // in bytes
}

export function FileUploadArea({
  onFileSelect,
  accept = ".dockerfile,.Dockerfile,.tar,.tar.gz",
  maxSize = 100 * 1024 * 1024, // 100MB
}: FileUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    setError(null)

    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFile = (file: File) => {
    if (file.size > maxSize) {
      setError(`文件大小不能超过 ${maxSize / 1024 / 1024}MB`)
      return
    }

    if (accept && !accept.split(",").some((ext) => file.name.endsWith(ext))) {
      setError("不支持的文件类型")
      return
    }

    onFileSelect?.(file)
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-gray-300 hover:border-gray-400"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleFileInput}
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="cursor-pointer flex flex-col items-center"
      >
        <Upload className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium mb-2">
          拖放文件到这里，或点击选择文件
        </p>
        <p className="text-sm text-gray-500">
          支持的文件类型：{accept}
          <br />
          最大文件大小：{maxSize / 1024 / 1024}MB
        </p>
      </label>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  )
} 