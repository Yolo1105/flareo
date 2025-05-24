"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageUploadGrid } from "@/components/image-upload-grid"
import { PluginPreview } from "@/components/plugin-preview"

interface BasicInfoStepProps {
  formData: {
    name: string
    identifier: string
    description: string
    tags: string[]
  }
  onChange: (data: Partial<BasicInfoStepProps["formData"]>) => void
  onNext: () => void
}

export function BasicInfoStep({ formData, onChange, onNext }: BasicInfoStepProps) {
  const handleTagChange = (value: string) => {
    const tags = value.split(",").map((tag) => tag.trim())
    onChange({ tags })
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">基本信息</h2>
        <p className="text-gray-600">填写插件的基本信息，这些信息将展示在插件详情页</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">插件名称</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="输入插件名称"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="identifier">插件标识符</Label>
            <Input
              id="identifier"
              value={formData.identifier}
              onChange={(e) => onChange({ identifier: e.target.value })}
              placeholder="输入插件标识符"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">插件描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="输入插件描述"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">标签</Label>
            <Input
              id="tags"
              value={formData.tags.join(", ")}
              onChange={(e) => handleTagChange(e.target.value)}
              placeholder="输入标签，用逗号分隔"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">插件截图</h3>
            <ImageUploadGrid />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">预览</h3>
            <PluginPreview
              name={formData.name}
              description={formData.description}
              tags={formData.tags}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline">保存草稿</Button>
        <Button onClick={onNext}>下一步</Button>
      </div>
    </div>
  )
} 