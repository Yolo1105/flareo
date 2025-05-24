"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ChecklistItem } from "@/components/checklist-item"
import { CheckCircle, AlertTriangle } from "lucide-react"

interface PublishStepProps {
  formData: {
    agreeTerms: boolean
  }
  onChange: (field: string, value: any) => void
  onPrevious: () => void
}

export function PublishStep({ formData, onChange, onPrevious }: PublishStepProps) {
  const handleAgreeTerms = (checked: boolean) => {
    onChange("agreeTerms", checked)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">发布前确认</h2>
      <p className="text-gray-600 mb-6">在正式发布前，请确认以下检查项，确保您的插件符合平台要求。</p>

      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b">发布前检查</h3>

        <div className="space-y-4">
          <ChecklistItem
            icon={<CheckCircle className="h-6 w-6 text-green-500" />}
            title="基本信息完整"
            description="插件名称、描述和标签已填写完整"
            status="success"
          />

          <ChecklistItem
            icon={<CheckCircle className="h-6 w-6 text-green-500" />}
            title="插件文件已上传"
            description="插件源代码或镜像文件已成功上传"
            status="success"
          />

          <ChecklistItem
            icon={<CheckCircle className="h-6 w-6 text-green-500" />}
            title="部署配置已设置"
            description="已配置插件的部署方式和资源需求"
            status="success"
          />

          <ChecklistItem
            icon={<AlertTriangle className="h-6 w-6 text-amber-500" />}
            title="插件截图不足"
            description="建议上传至少3张截图展示插件功能"
            status="warning"
          />

          <ChecklistItem
            icon={<AlertTriangle className="h-6 w-6 text-amber-500" />}
            title="详细文档不足"
            description="建议提供更详细的使用文档和示例"
            status="warning"
          />
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 pb-2 border-b">发布协议</h3>

        <div className="bg-gray-50 p-6 rounded-lg mb-6 max-h-[200px] overflow-y-auto">
          <h4 className="font-semibold mb-2">插件发布协议</h4>
          <p className="mb-2">通过发布插件，您同意以下条款：</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>您拥有或已获授权发布此插件的所有内容</li>
            <li>您的插件不包含恶意代码或侵犯他人知识产权的内容</li>
            <li>您同意平台对每笔交易收取15%的服务费</li>
            <li>您将及时响应用户的问题和反馈</li>
            <li>您同意遵守平台的社区准则和服务条款</li>
          </ol>
        </div>

        <div className="flex items-center space-x-2 mb-6">
          <Checkbox id="agreeTerms" checked={formData.agreeTerms} onCheckedChange={handleAgreeTerms} />
          <Label htmlFor="agreeTerms" className="text-sm">
            我已阅读并同意《插件发布协议》
          </Label>
        </div>
      </div>

      <div className="flex justify-between">
        <div className="space-x-2">
          <Button variant="outline" onClick={onPrevious}>
            上一步
          </Button>
          <Button variant="outline">保存草稿</Button>
        </div>
        <Button disabled={!formData.agreeTerms}>发布插件</Button>
      </div>
    </div>
  )
} 