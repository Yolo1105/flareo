"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Pencil, Trash2 } from "lucide-react"
import type { DeploymentMethod, DeploymentConfig } from "@/lib/types/deployment"

interface ConfigurationFormProps {
  config: DeploymentConfig
  deploymentMethod: DeploymentMethod
  onUpdateConfig: (section: keyof DeploymentConfig, data: any) => void
  onPrevious: () => void
  onNext: () => void
}

export function ConfigurationForm({
  config,
  deploymentMethod,
  onUpdateConfig,
  onPrevious,
  onNext,
}: ConfigurationFormProps) {
  const [newEnvVar, setNewEnvVar] = useState({
    name: "",
    value: "",
    type: "text" as "text" | "sensitive",
  })

  const updateBasicConfig = (field: string, value: string) => {
    onUpdateConfig("basic", { ...config.basic, [field]: value })
  }

  const updateApiConfig = (field: string, value: string) => {
    onUpdateConfig("api", { ...config.api, [field]: value })
  }

  const updateAdvancedConfig = (field: string, value: string | string[]) => {
    onUpdateConfig("advanced", { ...config.advanced, [field]: value })
  }

  const addEnvVar = () => {
    if (newEnvVar.name && newEnvVar.value) {
      onUpdateConfig("env", [...config.env, { ...newEnvVar }])
      setNewEnvVar({ name: "", value: "", type: "text" })
    }
  }

  const removeEnvVar = (index: number) => {
    const newEnvVars = [...config.env]
    newEnvVars.splice(index, 1)
    onUpdateConfig("env", newEnvVars)
  }

  const toggleFeature = (feature: string) => {
    const features = config.advanced.features || []
    if (features.includes(feature)) {
      updateAdvancedConfig(
        "features",
        features.filter((f: string) => f !== feature),
      )
    } else {
      updateAdvancedConfig("features", [...features, feature])
    }
  }

  return (
    <Card>
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">步骤 2：配置参数</h2>
        <p className="text-muted-foreground mt-1">
          设置
          {deploymentMethod === "api"
            ? "API调用"
            : deploymentMethod === "iframe"
              ? "iframe嵌入"
              : deploymentMethod === "docker"
                ? "Docker容器"
                : "Kubernetes部署"}
          部署所需的配置参数。
        </p>
      </div>
      <div className="p-6">
        {/* 基础配置 */}
        <h3 className="text-lg font-semibold mb-4">基础配置</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="md:col-span-2">
            <Label htmlFor="instance-name">实例名称</Label>
            <Input
              id="instance-name"
              value={config.basic.name}
              onChange={(e) => updateBasicConfig("name", e.target.value)}
              placeholder="例如：数据可视化工具-生产环境"
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">为您的插件实例指定一个唯一名称，便于识别和管理。</p>
          </div>

          <div>
            <Label htmlFor="instance-version">版本</Label>
            <Select value={config.basic.version} onValueChange={(value) => updateBasicConfig("version", value)}>
              <SelectTrigger id="instance-version" className="mt-1">
                <SelectValue placeholder="选择版本" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2.1.0">2.1.0（最新）</SelectItem>
                <SelectItem value="2.0.1">2.0.1</SelectItem>
                <SelectItem value="2.0.0">2.0.0</SelectItem>
                <SelectItem value="1.9.5">1.9.5（稳定版）</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">选择要部署的插件版本。</p>
          </div>

          <div>
            <Label htmlFor="instance-region">部署区域</Label>
            <Select value={config.basic.region} onValueChange={(value) => updateBasicConfig("region", value)}>
              <SelectTrigger id="instance-region" className="mt-1">
                <SelectValue placeholder="选择区域" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cn-east">中国东部（上海）</SelectItem>
                <SelectItem value="cn-north">中国北部（北京）</SelectItem>
                <SelectItem value="cn-south">中国南部（广州）</SelectItem>
                <SelectItem value="us-west">美国西部（硅谷）</SelectItem>
                <SelectItem value="us-east">美国东部（弗吉尼亚）</SelectItem>
                <SelectItem value="eu-central">欧洲中部（法兰克福）</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">选择最靠近您用户的区域以获得最佳性能。</p>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="instance-description">描述（可选）</Label>
            <Textarea
              id="instance-description"
              value={config.basic.description}
              onChange={(e) => updateBasicConfig("description", e.target.value)}
              placeholder="描述此插件实例的用途、特殊配置等信息..."
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">添加描述有助于团队成员了解此实例的用途。</p>
          </div>
        </div>

        {/* API配置 - 仅在API部署方式下显示 */}
        {deploymentMethod === "api" && (
          <>
            <h3 className="text-lg font-semibold mb-4 mt-8">API配置</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="api-rate-limit">API速率限制</Label>
                <Select value={config.api?.rateLimit ?? ""} onValueChange={(value) => updateApiConfig("rateLimit", value)}>
                  <SelectTrigger id="api-rate-limit" className="mt-1">
                    <SelectValue placeholder="选择速率限制" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100次/分钟（基础）</SelectItem>
                    <SelectItem value="500">500次/分钟（标准）</SelectItem>
                    <SelectItem value="1000">1000次/分钟（专业）</SelectItem>
                    <SelectItem value="5000">5000次/分钟（企业）</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">设置API调用的速率限制，超出限制的请求将被拒绝。</p>
              </div>

              <div>
                <Label htmlFor="api-timeout">请求超时时间</Label>
                <Select value={config.api?.timeout ?? ""} onValueChange={(value) => updateApiConfig("timeout", value)}>
                  <SelectTrigger id="api-timeout" className="mt-1">
                    <SelectValue placeholder="选择超时时间" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10秒</SelectItem>
                    <SelectItem value="30">30秒</SelectItem>
                    <SelectItem value="60">60秒</SelectItem>
                    <SelectItem value="120">120秒</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">设置API请求的最大超时时间。</p>
              </div>

              <div>
                <Label htmlFor="api-auth-method">认证方式</Label>
                <Select value={config.api?.authMethod ?? ""} onValueChange={(value) => updateApiConfig("authMethod", value)}>
                  <SelectTrigger id="api-auth-method" className="mt-1">
                    <SelectValue placeholder="选择认证方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api-key">API密钥</SelectItem>
                    <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                    <SelectItem value="jwt">JWT令牌</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">选择API的认证方式。</p>
              </div>

              <div>
                <Label htmlFor="cors-origins">允许的CORS源</Label>
                <Input
                  id="cors-origins"
                  value={config.api?.corsOrigins ?? ""}
                  onChange={(e) => updateApiConfig("corsOrigins", e.target.value)}
                  placeholder="例如：https://example.com,https://app.example.com"
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  设置允许跨域请求的源，使用逗号分隔多个域名，或使用*允许所有源。
                </p>
              </div>
            </div>
          </>
        )}

        {/* 环境变量 */}
        <h3 className="text-lg font-semibold mb-4 mt-8">环境变量</h3>
        <p className="text-muted-foreground mb-4">设置插件运行所需的环境变量。敏感信息将被加密存储。</p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-sm text-muted-foreground">
                <th className="pb-2 w-[30%]">变量名</th>
                <th className="pb-2 w-[40%]">值</th>
                <th className="pb-2 w-[20%]">类型</th>
                <th className="pb-2 w-[10%]">操作</th>
              </tr>
            </thead>
            <tbody>
              {config.env.map((env: import("@/lib/types/deployment").EnvVar, index: number) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-2">{env.name}</td>
                  <td className="py-2">{env.type === "sensitive" ? "••••••••••••••••" : env.value}</td>
                  <td className="py-2">{env.type === "sensitive" ? "敏感" : "普通"}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 text-gray-500 hover:text-primary">
                        <Pencil size={16} />
                        <span className="sr-only">编辑</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 text-gray-500 hover:text-destructive"
                        onClick={() => removeEnvVar(index)}
                      >
                        <Trash2 size={16} />
                        <span className="sr-only">删除</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Input
            placeholder="变量名"
            value={newEnvVar.name}
            onChange={(e) => setNewEnvVar({ ...newEnvVar, name: e.target.value })}
            className="flex-1"
          />
          <Input
            placeholder="值"
            value={newEnvVar.value}
            onChange={(e) => setNewEnvVar({ ...newEnvVar, value: e.target.value })}
            className="flex-1"
          />
          <Select
            value={newEnvVar.type}
            onValueChange={(value) => setNewEnvVar({ ...newEnvVar, type: value as "text" | "sensitive" })}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">普通</SelectItem>
              <SelectItem value="sensitive">敏感</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={addEnvVar}>
            添加
          </Button>
        </div>

        {/* 高级选项 */}
        <h3 className="text-lg font-semibold mb-4 mt-8">高级选项</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="cache-ttl">缓存时间（秒）</Label>
            <Input
              id="cache-ttl"
              type="number"
              value={config.advanced.cacheTtl}
              onChange={(e) => updateAdvancedConfig("cacheTtl", e.target.value)}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">设置API响应的缓存时间，0表示不缓存。</p>
          </div>

          <div className="md:col-span-2">
            <Label className="mb-2 block">高级功能</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-metrics"
                  checked={config.advanced.features?.includes("metrics")}
                  onCheckedChange={() => toggleFeature("metrics")}
                />
                <Label htmlFor="enable-metrics" className="text-sm font-normal cursor-pointer">
                  启用指标收集
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-auto-scaling"
                  checked={config.advanced.features?.includes("auto-scaling")}
                  onCheckedChange={() => toggleFeature("auto-scaling")}
                />
                <Label htmlFor="enable-auto-scaling" className="text-sm font-normal cursor-pointer">
                  启用自动扩缩容
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-backup"
                  checked={config.advanced.features?.includes("backup")}
                  onCheckedChange={() => toggleFeature("backup")}
                />
                <Label htmlFor="enable-backup" className="text-sm font-normal cursor-pointer">
                  启用自动备份
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 bg-gray-50 border-t flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          返回上一步
        </Button>
        <Button onClick={onNext}>预览与验证</Button>
      </div>
    </Card>
  )
}
