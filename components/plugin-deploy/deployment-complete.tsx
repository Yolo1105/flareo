"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { DeploymentMethod, DeploymentConfig } from "@/lib/types/deployment"
import { CheckCircle, Copy } from "lucide-react"

interface DeploymentCompleteProps {
  config: DeploymentConfig
  deploymentMethod: DeploymentMethod
}

export function DeploymentComplete({ config, deploymentMethod }: DeploymentCompleteProps) {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    // 可以添加一个复制成功的提示
  }

  return (
    <Card>
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">步骤 5：部署完成</h2>
        <p className="text-muted-foreground mt-1">您的插件已成功部署，可以开始使用了。</p>
      </div>
      <div className="p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-secondary text-white rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-2xl font-semibold mb-2">部署成功！</h3>
          <p className="text-gray-600 mb-6 max-w-[600px] mx-auto">
            您的数据可视化工具包插件已成功部署，现在可以通过
            {deploymentMethod === "api"
              ? "API调用"
              : deploymentMethod === "iframe"
                ? "iframe嵌入"
                : deploymentMethod === "docker"
                  ? "Docker容器"
                  : "Kubernetes部署"}
            方式使用。以下是访问信息，请妥善保管。
          </p>

          {/* 访问信息 */}
          <div className="bg-gray-100 rounded-lg p-4 mb-6 max-w-[600px] mx-auto text-left">
            <div className="mb-3">
              <div className="flex items-center mb-3">
                <div className="w-[30%] font-medium text-gray-600">API URL</div>
                <div className="w-[70%] font-mono bg-white p-2 rounded-md border border-gray-200 flex justify-between items-center">
                  <span>{config.api?.apiUrl}</span>
                  <button onClick={() => handleCopy(config.api?.apiUrl ?? "")} className="text-primary">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <div className="flex items-center mb-3">
                <div className="w-[30%] font-medium text-gray-600">API密钥</div>
                <div className="w-[70%] font-mono bg-white p-2 rounded-md border border-gray-200 flex justify-between items-center">
                  <span>{config.api?.apiKey}</span>
                  <button onClick={() => handleCopy(config.api?.apiKey ?? "")} className="text-primary">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-[30%] font-medium text-gray-600">文档URL</div>
                <div className="w-[70%] font-mono bg-white p-2 rounded-md border border-gray-200 flex justify-between items-center">
                  <span>{config.api?.docUrl}</span>
                  <button onClick={() => handleCopy(config.api?.docUrl ?? "")} className="text-primary">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 快速开始代码示例 */}
          <div className="text-left max-w-[600px] mx-auto mb-6">
            <h4 className="text-base font-semibold mb-3">快速开始示例</h4>
            <div className="bg-neutral-800 text-neutral-100 font-mono text-sm p-3 rounded-md relative">
              <button
                onClick={() =>
                  handleCopy(`fetch('${config.api?.apiUrl ?? ''}/chart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': '${config.api?.apiKey ?? ''}'
  },
  body: JSON.stringify({
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      values: [10, 20, 30]
    }
  })
})
.then(response => response.json())
.then(data => console.log(data));`)
                }
                className="absolute top-2 right-2 bg-neutral-700 p-1 rounded"
              >
                <Copy size={16} />
              </button>
              <pre className="overflow-x-auto">
                {`fetch('${config.api?.apiUrl ?? ''}/chart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': '${config.api?.apiKey ?? ''}'
  },
  body: JSON.stringify({
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      values: [10, 20, 30]
    }
  })
})
.then(response => response.json())
.then(data => console.log(data));`}
              </pre>
            </div>
          </div>

          {/* 下一步操作 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="sm:min-w-[180px]">查看API文档</Button>
            <Button variant="outline" className="sm:min-w-[180px]">
              管理插件实例
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
