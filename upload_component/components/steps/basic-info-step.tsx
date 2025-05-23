"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageUploadGrid } from "@/components/image-upload-grid"
import { PluginPreview } from "@/components/plugin-preview"

interface BasicInfoStepProps {
  formData: any
  onChange: (field: string, value: any) => void
  onNext: () => void
  onPrevious: () => void
}

export function BasicInfoStep({ formData, onChange, onNext, onPrevious }: BasicInfoStepProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    onChange(name, value)
  }

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsString = e.target.value
    const tagsArray = tagsString
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag)
    onChange("tags", tagsArray)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">填写插件基本信息</h2>
      <p className="text-gray-600 mb-6">详细的插件信息有助于用户更好地了解您的插件功能和使用方式。</p>

      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b">基础信息</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <Label htmlFor="pluginName">插件名称 *</Label>
            <Input
              id="pluginName"
              name="pluginName"
              placeholder="输入插件名称，最多30个字符"
              value={formData.pluginName}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pluginId">插件标识符 *</Label>
            <Input
              id="pluginId"
              name="pluginId"
              placeholder="英文字母、数字和连字符，如my-awesome-plugin"
              value={formData.pluginId}
              onChange={handleInputChange}
            />
            <p className="text-sm text-gray-500">唯一标识符，发布后不可更改</p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <Label htmlFor="description">插件简介 *</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="简要描述插件的主要功能和价值，最多200个字符"
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">标签</Label>
          <Input
            id="tags"
            name="tags"
            placeholder="输入标签，用逗号分隔，如：API,网关,微服务"
            value={formData.tags.join(", ")}
            onChange={handleTagsChange}
          />
          <p className="text-sm text-gray-500">最多添加5个标签，有助于用户搜索发现</p>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b">详细描述</h3>
        <div className="space-y-2">
          <Label htmlFor="detailedDescription">功能详情 *</Label>
          <div className="border rounded-md p-4 min-h-[200px] bg-white">
            <p className="text-gray-500">支持Markdown格式，可插入图片、代码块和表格等</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b">插件截图</h3>
        <p className="text-gray-600 mb-4">上传至少一张截图展示插件界面或功能，建议尺寸1280x720px</p>
        <ImageUploadGrid />
      </div>

      <div className="mb-8 bg-gray-50 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">预览效果</h3>
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">实时更新</span>
        </div>
        <PluginPreview
          name={formData.pluginName || "插件名称"}
          description={formData.description || "插件简介将显示在这里..."}
          tags={formData.tags.length > 0 ? formData.tags : ["标签1", "标签2", "标签3"]}
        />
      </div>

      <div className="flex justify-between">
        <div className="space-x-2">
          <Button variant="outline" onClick={onPrevious}>
            上一步
          </Button>
          <Button variant="outline">保存草稿</Button>
        </div>
        <Button onClick={onNext}>下一步：部署配置</Button>
      </div>
    </div>
  )
}
