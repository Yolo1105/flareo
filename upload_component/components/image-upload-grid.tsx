import { ImageIcon } from "lucide-react"

export function ImageUploadGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((index) => (
        <div
          key={index}
          className="aspect-video border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors"
        >
          <ImageIcon className="h-6 w-6 text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">添加截图</span>
        </div>
      ))}
    </div>
  )
}
