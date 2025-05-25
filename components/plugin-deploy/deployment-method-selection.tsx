"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DeploymentMethod } from "@/lib/types/deployment"
import { Users, Layout, Server, Sliders, CheckCircle2 } from "lucide-react"

interface DeploymentMethodSelectionProps {
  selectedMethod?: DeploymentMethod
  onSelect: (method: DeploymentMethod) => void
  onNext: () => void
}

const deploymentMethods = [
  {
    id: "api" as DeploymentMethod,
    title: "API调用",
    description: "通过API接口调用插件功能，适合需要在自有应用中集成的场景。",
    icon: <Users size={24} />,
    features: ["无需额外基础设施", "简单集成到现有应用", "支持多种编程语言"],
  },
  {
    id: "iframe" as DeploymentMethod,
    title: "iframe嵌入",
    description: "将插件UI直接嵌入到您的网页中，无需开发前端界面。",
    icon: <Layout size={24} />,
    features: ["零代码集成", "完整UI体验", "自动更新"],
  },
  {
    id: "docker" as DeploymentMethod,
    title: "Docker容器",
    description: "在您自己的环境中运行独立容器，完全控制部署和数据。",
    icon: <Server size={24} />,
    features: ["完全控制权", "数据本地存储", "自定义网络配置"],
  },
  {
    id: "kubernetes" as DeploymentMethod,
    title: "Kubernetes部署",
    description: "在Kubernetes集群中部署，适合企业级应用和高可用需求。",
    icon: <Sliders size={24} />,
    features: ["高可用性", "自动扩缩容", "企业级管理"],
  },
]

export function DeploymentMethodSelection({ selectedMethod, onSelect, onNext }: DeploymentMethodSelectionProps) {
  return (
    <Card>
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">步骤 1：选择部署方式</h2>
        <p className="text-muted-foreground mt-1">选择最适合您需求的部署方式。</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {deploymentMethods.map((method) => (
            <div
              key={method.id}
              className={cn(
                "border rounded-lg p-4 cursor-pointer transition-all",
                selectedMethod === method.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-gray-200 hover:border-primary/50 hover:shadow-sm",
              )}
              onClick={() => onSelect(method.id)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-primary">
                  {method.icon}
                </div>
                <div className="font-semibold">{method.title}</div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{method.description}</p>
              <div className="text-sm">
                {method.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 mb-1 text-gray-600">
                    <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3">部署方式比较</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="py-2 text-left font-medium text-gray-600">部署方式</th>
                  <th className="py-2 text-left font-medium text-gray-600">复杂度</th>
                  <th className="py-2 text-left font-medium text-gray-600">控制权</th>
                  <th className="py-2 text-left font-medium text-gray-600">数据存储</th>
                  <th className="py-2 text-left font-medium text-gray-600">适用场景</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 font-medium">API调用</td>
                  <td className="py-2">低</td>
                  <td className="py-2">中</td>
                  <td className="py-2">平台端</td>
                  <td className="py-2">快速集成、小型应用</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 font-medium">iframe嵌入</td>
                  <td className="py-2">极低</td>
                  <td className="py-2">低</td>
                  <td className="py-2">平台端</td>
                  <td className="py-2">零代码集成、快速部署</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-2 font-medium">Docker容器</td>
                  <td className="py-2">中</td>
                  <td className="py-2">高</td>
                  <td className="py-2">本地</td>
                  <td className="py-2">数据敏感、定制需求</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Kubernetes部署</td>
                  <td className="py-2">高</td>
                  <td className="py-2">极高</td>
                  <td className="py-2">本地</td>
                  <td className="py-2">企业应用、高可用需求</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="p-6 bg-gray-50 border-t flex justify-between">
        <Button variant="outline">返回插件详情</Button>
        <Button onClick={onNext} disabled={!selectedMethod}>继续配置参数</Button>
      </div>
    </Card>
  )
}
