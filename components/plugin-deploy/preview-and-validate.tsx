"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { DeploymentMethod, DeploymentConfig } from "@/lib/types/deployment"
import { AlertTriangle, CheckCircle, Pencil } from "lucide-react"

interface PreviewAndValidateProps {
  config: DeploymentConfig
  deploymentMethod: DeploymentMethod
  onPrevious: () => void
  onNext: () => void
}

export function PreviewAndValidate({ config, deploymentMethod, onPrevious, onNext }: PreviewAndValidateProps) {
  const getDeploymentMethodName = (method: DeploymentMethod) => {
    switch (method) {
      case "api":
        return "API调用"
      case "iframe":
        return "iframe嵌入"
      case "docker":
        return "Docker容器"
      case "kubernetes":
        return "Kubernetes部署"
      default:
        return "未知"
    }
  }

  return (
    <Card>
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">步骤 3：预览与验证</h2>
        <p className="text-muted-foreground mt-1">检查您的配置并进行部署前验证。</p>
      </div>
      <div className="p-6">
        {/* 配置摘要 */}
        <div className="mb-6">
          {/* 基础配置摘要 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3 pb-2 border-b">
              <h3 className="text-lg font-semibold">基础配置</h3>
              <Button variant="ghost" size="sm" className="text-primary flex items-center gap-1">
                <Pencil size={16} />
                编辑
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex">
                <div className="w-2/5 font-medium text-gray-600 pr-4">实例名称</div>
                <div className="w-3/5">{config.basic.name}</div>
              </div>
              <div className="flex">
                <div className="w-2/5 font-medium text-gray-600 pr-4">版本</div>
                <div className="w-3/5">{config.basic.version}</div>
              </div>
              <div className="flex">
                <div className="w-2/5 font-medium text-gray-600 pr-4">部署区域</div>
                <div className="w-3/5">
                  {config.basic.region === "cn-east"
                    ? "中国东部（上海）"
                    : config.basic.region === "cn-north"
                      ? "中国北部（北京）"
                      : config.basic.region === "cn-south"
                        ? "中国南部（广州）"
                        : config.basic.region === "us-west"
                          ? "美国西部（硅谷）"
                          : config.basic.region === "us-east"
                            ? "美国东部（弗吉尼亚）"
                            : "欧洲中部（法兰克福）"}
                </div>
              </div>
              <div className="flex">
                <div className="w-2/5 font-medium text-gray-600 pr-4">部署方式</div>
                <div className="w-3/5 text-primary font-medium">{getDeploymentMethodName(deploymentMethod)}</div>
              </div>
            </div>
          </div>

          {/* API配置摘要 - 仅在API部署方式下显示 */}
          {deploymentMethod === "api" && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-3 pb-2 border-b">
                <h3 className="text-lg font-semibold">API配置</h3>
                <Button variant="ghost" size="sm" className="text-primary flex items-center gap-1">
                  <Pencil size={16} />
                  编辑
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex">
                  <div className="w-2/5 font-medium text-gray-600 pr-4">API速率限制</div>
                  <div className="w-3/5">
                    {config.api?.rateLimit === "100"
                      ? "100次/分钟（基础）"
                      : config.api?.rateLimit === "500"
                        ? "500次/分钟（标准）"
                        : config.api?.rateLimit === "1000"
                          ? "1000次/分钟（专业）"
                          : "5000次/分钟（企业）"}
                  </div>
                </div>
                <div className="flex">
                  <div className="w-2/5 font-medium text-gray-600 pr-4">请求超时时间</div>
                  <div className="w-3/5">{config.api?.timeout}秒</div>
                </div>
                <div className="flex">
                  <div className="w-2/5 font-medium text-gray-600 pr-4">认证方式</div>
                  <div className="w-3/5">
                    {config.api?.authMethod === "api-key"
                      ? "API密钥"
                      : config.api?.authMethod === "oauth2"
                        ? "OAuth 2.0"
                        : "JWT令牌"}
                  </div>
                </div>
                <div className="flex">
                  <div className="w-2/5 font-medium text-gray-600 pr-4">允许的CORS源</div>
                  <div className="w-3/5">{config.api?.corsOrigins === "*" ? "*（所有源）" : config.api?.corsOrigins}</div>
                </div>
              </div>
            </div>
          )}

          {/* 环境变量摘要 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3 pb-2 border-b">
              <h3 className="text-lg font-semibold">环境变量</h3>
              <Button variant="ghost" size="sm" className="text-primary flex items-center gap-1">
                <Pencil size={16} />
                编辑
              </Button>
            </div>
            <div className="space-y-2">
              {config.env.map((env: import("@/lib/types/deployment").EnvVar, index: number) => (
                <div key={index} className="flex">
                  <div className="w-2/5 font-medium text-gray-600 pr-4">{env.name}</div>
                  <div className="w-3/5">{env.type === "sensitive" ? "••••••••••••••••（敏感）" : env.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 高级选项摘要 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3 pb-2 border-b">
              <h3 className="text-lg font-semibold">高级选项</h3>
              <Button variant="ghost" size="sm" className="text-primary flex items-center gap-1">
                <Pencil size={16} />
                编辑
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex">
                <div className="w-2/5 font-medium text-gray-600 pr-4">缓存时间</div>
                <div className="w-3/5">{config.advanced.cacheTtl}秒</div>
              </div>
              <div className="flex">
                <div className="w-2/5 font-medium text-gray-600 pr-4">启用功能</div>
                <div className="w-3/5">
                  {config.advanced.features
                    ?.map((feature: string) =>
                      feature === "metrics" ? "指标收集" : feature === "auto-scaling" ? "自动扩缩容" : "自动备份",
                    )
                    .join(", ") || "无"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 验证结果 */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle size={20} className="text-secondary" />
            验证通过
          </h3>
          <p className="text-gray-600 mb-3">您的配置已通过验证，可以进行部署。</p>
          <div className="flex flex-wrap gap-3">
            <div className="bg-white p-3 rounded-md flex-1 min-w-[200px]">
              <div className="font-medium mb-1">预估资源</div>
              <div className="text-gray-600 text-sm">CPU: 0.5核 / 内存: 1GB</div>
            </div>
            <div className="bg-white p-3 rounded-md flex-1 min-w-[200px]">
              <div className="font-medium mb-1">预估成本</div>
              <div className="text-gray-600 text-sm">¥99/月（包含在您的订阅中）</div>
            </div>
            <div className="bg-white p-3 rounded-md flex-1 min-w-[200px]">
              <div className="font-medium mb-1">预估部署时间</div>
              <div className="text-gray-600 text-sm">约2-3分钟</div>
            </div>
          </div>
        </div>

        {/* 部署前提示 */}
        <div className="bg-warning/10 border-l-4 border-warning p-3 rounded-md">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle size={18} className="text-warning" />
            部署前须知
          </h4>
          <ul className="ml-4 text-gray-700 text-sm space-y-1">
            <li>部署完成后，您将获得API密钥和访问URL，请妥善保管。</li>
            <li>首次API调用可能需要几秒钟的冷启动时间。</li>
            <li>您可以随时在个人中心查看和管理已部署的插件实例。</li>
            <li>如需技术支持，请通过社区或支持渠道联系我们。</li>
          </ul>
        </div>
      </div>
      <div className="p-6 bg-gray-50 border-t flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          返回上一步
        </Button>
        <Button onClick={onNext}>开始部署</Button>
      </div>
    </Card>
  )
}
