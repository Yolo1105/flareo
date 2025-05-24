"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeploymentOptionCard } from "@/components/deployment-option-card"
import { Box, Database, Globe, Plus, Server } from "lucide-react"

interface DeploymentStepProps {
  formData: {
    deploymentMethods: string[]
    cpuRequest: string
    memoryRequest: string
    portNumber: string
    portProtocol: string
  }
  onChange: (field: string, value: any) => void
  onNext: () => void
  onPrevious: () => void
}

export function DeploymentStep({ formData, onChange, onNext, onPrevious }: DeploymentStepProps) {
  const [activeTab, setActiveTab] = useState("basic")

  const handleDeploymentMethodToggle = (method: string) => {
    let newMethods
    if (formData.deploymentMethods.includes(method)) {
      newMethods = formData.deploymentMethods.filter((m: string) => m !== method)
    } else {
      newMethods = [...formData.deploymentMethods, method]
    }
    onChange("deploymentMethods", newMethods)
  }

  const handleSelectChange = (field: string, value: string) => {
    onChange(field, value)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">配置插件部署方式</h2>
      <p className="text-gray-600 mb-6">设置插件的部署和集成方式，让用户能够轻松地将您的插件集成到他们的系统中。</p>

      <Tabs defaultValue="basic" className="mb-8">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="basic">基础配置</TabsTrigger>
          <TabsTrigger value="env">环境变量</TabsTrigger>
          <TabsTrigger value="network">网络设置</TabsTrigger>
          <TabsTrigger value="storage">存储配置</TabsTrigger>
          <TabsTrigger value="advanced">高级选项</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">部署方式</h3>
            <p className="text-gray-600 mb-4">选择您希望支持的部署方式，可多选</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <DeploymentOptionCard
                title="Docker 容器"
                description="以 Docker 容器方式部署，用户可通过 Docker 命令或 Compose 文件运行"
                icon={<Box className="h-5 w-5" />}
                isActive={formData.deploymentMethods.includes("docker")}
                onClick={() => handleDeploymentMethodToggle("docker")}
              />

              <DeploymentOptionCard
                title="Kubernetes"
                description="提供 Helm Chart 或 YAML 配置，支持在 Kubernetes 集群中部署"
                icon={<Server className="h-5 w-5" />}
                isActive={formData.deploymentMethods.includes("kubernetes")}
                onClick={() => handleDeploymentMethodToggle("kubernetes")}
              />

              <DeploymentOptionCard
                title="iframe 嵌入"
                description="提供 iframe 嵌入代码，用户可直接嵌入到网页中使用"
                icon={<Globe className="h-5 w-5" />}
                isActive={formData.deploymentMethods.includes("iframe")}
                onClick={() => handleDeploymentMethodToggle("iframe")}
              />

              <DeploymentOptionCard
                title="API 接入"
                description="提供 API 接口，用户可通过 API 调用使用插件功能"
                icon={<Database className="h-5 w-5" />}
                isActive={formData.deploymentMethods.includes("api")}
                onClick={() => handleDeploymentMethodToggle("api")}
              />
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">资源需求</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label htmlFor="cpuRequest">CPU 需求</Label>
                <Select value={formData.cpuRequest} onValueChange={(value) => handleSelectChange("cpuRequest", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择 CPU 需求" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5 核 (最小)</SelectItem>
                    <SelectItem value="1">1 核 (推荐)</SelectItem>
                    <SelectItem value="2">2 核</SelectItem>
                    <SelectItem value="4">4 核</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memoryRequest">内存需求</Label>
                <Select
                  value={formData.memoryRequest}
                  onValueChange={(value) => handleSelectChange("memoryRequest", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择内存需求" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="256">256MB (最小)</SelectItem>
                    <SelectItem value="512">512MB</SelectItem>
                    <SelectItem value="1024">1GB (推荐)</SelectItem>
                    <SelectItem value="2048">2GB</SelectItem>
                    <SelectItem value="4096">4GB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">端口配置</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div className="space-y-2">
                <Label htmlFor="portNumber">主要服务端口</Label>
                <Input
                  id="portNumber"
                  name="portNumber"
                  type="number"
                  value={formData.portNumber}
                  onChange={(e) => onChange("portNumber", e.target.value)}
                />
                <p className="text-sm text-gray-500">插件主要服务的端口号</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="portProtocol">协议</Label>
                <Select
                  value={formData.portProtocol}
                  onValueChange={(value) => handleSelectChange("portProtocol", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择协议" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="http">HTTP</SelectItem>
                    <SelectItem value="https">HTTPS</SelectItem>
                    <SelectItem value="tcp">TCP</SelectItem>
                    <SelectItem value="udp">UDP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              添加更多端口
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="env">
          <div className="p-8 text-center text-gray-500">
            <p>在此配置插件所需的环境变量</p>
          </div>
        </TabsContent>

        <TabsContent value="network">
          <div className="p-8 text-center text-gray-500">
            <p>在此配置插件的网络设置</p>
          </div>
        </TabsContent>

        <TabsContent value="storage">
          <div className="p-8 text-center text-gray-500">
            <p>在此配置插件的存储需求</p>
          </div>
        </TabsContent>

        <TabsContent value="advanced">
          <div className="p-8 text-center text-gray-500">
            <p>在此配置插件的高级选项</p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <div className="space-x-2">
          <Button variant="outline" onClick={onPrevious}>
            上一步
          </Button>
          <Button variant="outline">保存草稿</Button>
        </div>
        <Button onClick={onNext}>下一步：定价与销售</Button>
      </div>
    </div>
  )
} 