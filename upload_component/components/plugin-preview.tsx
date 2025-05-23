interface PluginPreviewProps {
  name: string
  description: string
  tags: string[]
}

export function PluginPreview({ name, description, tags }: PluginPreviewProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-2">{name}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-sm">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
