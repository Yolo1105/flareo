"use client"

import { Button } from "@/components/ui/button"
import { UploadMethodCard } from "@/components/upload-method-card"
import { FileUploadArea } from "@/components/file-upload-area"
import { Boxes, FileArchive, Github } from "lucide-react"

interface UploadStepProps {
  formData: any
  onChange: (field: string, value: any) => void
  onNext: () => void
}

export function UploadStep({ formData, onChange, onNext }: UploadStepProps) {
  const handleMethodChange = (method: string) => {
    onChange("uploadMethod", method)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">选择上传方式</h2>
      <p className="text-gray-600 mb-6">
        请选择一种方式上传您的插件代码。我们支持多种上传方式，选择最适合您的开发流程的方式。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <UploadMethodCard
          title="Dockerfile 上传"
          description="上传包含 Dockerfile 的项目目录，我们将自动构建并部署您的插件。"
          icon={<Boxes className="h-6 w-6" />}
          isActive={formData.uploadMethod === "dockerfile"}
          onClick={() => handleMethodChange("dockerfile")}
        />

        <UploadMethodCard
          title="镜像 TAR 包"
          description="上传预先构建好的 Docker 镜像 TAR 包，适合有特殊构建需求的插件。"
          icon={<FileArchive className="h-6 w-6" />}
          isActive={formData.uploadMethod === "tar"}
          onClick={() => handleMethodChange("tar")}
        />

        <UploadMethodCard
          title="GitHub 仓库"
          description="直接关联 GitHub 仓库，我们将自动拉取最新代码并构建部署。"
          icon={<Github className="h-6 w-6" />}
          isActive={formData.uploadMethod === "github"}
          onClick={() => handleMethodChange("github")}
        />
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b">上传文件</h3>
        <FileUploadArea />
      </div>

      <div className="flex justify-between">
        <Button variant="outline">保存草稿</Button>
        <Button onClick={onNext}>下一步：基本信息</Button>
      </div>
    </div>
  )
}
