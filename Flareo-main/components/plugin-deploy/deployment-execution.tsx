"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { DeploymentMethod, DeploymentConfig } from "@/lib/types/deployment"
import { CheckCircle2, Clock, Circle, Download } from "lucide-react"

interface DeploymentExecutionProps {
  config: DeploymentConfig
  deploymentMethod: DeploymentMethod
  onComplete: () => void
}

interface DeploymentStep {
  id: number
  title: string
  description: string
  status: "pending" | "in-progress" | "completed" | "error"
}

export function DeploymentExecution({ config, deploymentMethod, onComplete }: DeploymentExecutionProps) {
  const [progress, setProgress] = useState(0)
  const [steps, setSteps] = useState<DeploymentStep[]>([
    {
      id: 1,
      title: "准备环境",
      description: "初始化部署环境和资源分配",
      status: "in-progress",
    },
    {
      id: 2,
      title: "配置实例",
      description: "应用配置参数和环境变量",
      status: "pending",
    },
    {
      id: 3,
      title: "部署API服务",
      description: "创建API端点和服务实例",
      status: "pending",
    },
    {
      id: 4,
      title: "配置安全与认证",
      description: "设置API密钥和访问控制",
      status: "pending",
    },
    {
      id: 5,
      title: "验证部署",
      description: "测试API端点和功能可用性",
      status: "pending",
    },
  ])

  const [logs, setLogs] = useState<string[]>([
    "[2025-05-22 05:48:10] 开始部署插件实例: " + config.basic.name,
    "[2025-05-22 05:48:11] 正在准备部署环境...",
  ])

  // 模拟部署进度
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          onComplete()
          return 100
        }
        return prev + 2
      })

      // 更新步骤状态
      if (progress < 20) {
        // 第一步进行中
      } else if (progress === 20) {
        setSteps((prev) =>
          prev.map((step) =>
            step.id === 1
              ? { ...step, status: "completed" }
              : step.id === 2
                ? { ...step, status: "in-progress" }
                : step,
          ),
        )
        setLogs((prev) => [
          ...prev,
          "[2025-05-22 05:48:15] 环境准备完成，分配资源: CPU 0.5核, 内存 1GB",
          "[2025-05-22 05:48:18] 正在应用配置参数...",
        ])
      } else if (progress === 40) {
        setSteps((prev) =>
          prev.map((step) =>
            step.id === 2
              ? { ...step, status: "completed" }
              : step.id === 3
                ? { ...step, status: "in-progress" }
                : step,
          ),
        )
        setLogs((prev) => [
          ...prev,
          "[2025-05-22 05:48:20] 配置参数应用完成",
          "[2025-05-22 05:48:22] 正在设置环境变量...",
          "[2025-05-22 05:48:24] 环境变量设置完成",
          "[2025-05-22 05:48:26] 正在部署API服务...",
        ])
      } else if (progress === 60) {
        setSteps((prev) =>
          prev.map((step) =>
            step.id === 3
              ? { ...step, status: "completed" }
              : step.id === 4
                ? { ...step, status: "in-progress" }
                : step,
          ),
        )
        setLogs((prev) => [
          ...prev,
          "[2025-05-22 05:48:35] 创建API网关...",
          "[2025-05-22 05:48:40] 配置路由规则...",
          "[2025-05-22 05:48:45] 正在启动服务实例...",
          "[2025-05-22 05:48:50] 服务实例启动中...",
        ])
      } else if (progress === 80) {
        setSteps((prev) =>
          prev.map((step) =>
            step.id === 4
              ? { ...step, status: "completed" }
              : step.id === 5
                ? { ...step, status: "in-progress" }
                : step,
          ),
        )
        setLogs((prev) => [
          ...prev,
          "[2025-05-22 05:49:00] 配置安全与认证完成",
          "[2025-05-22 05:49:05] 生成API密钥...",
          "[2025-05-22 05:49:10] 设置访问控制...",
          "[2025-05-22 05:49:15] 正在验证部署...",
        ])
      } else if (progress >= 98) {
        setSteps((prev) => prev.map((step) => (step.id === 5 ? { ...step, status: "completed" } : step)))
        setLogs((prev) => [
          ...prev,
          "[2025-05-22 05:49:30] 验证API端点可用性...",
          "[2025-05-22 05:49:35] 测试基本功能...",
          "[2025-05-22 05:49:40] 部署验证完成",
          "[2025-05-22 05:49:45] 部署成功！",
        ])
      }
    }, 300)

    return () => clearInterval(interval)
  }, [progress, onComplete, config.basic.name])

  return (
    <Card>
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">步骤 4：部署执行</h2>
        <p className="text-muted-foreground mt-1">正在部署您的插件实例，请稍候。</p>
      </div>
      <div className="p-6">
        {/* 部署进度 */}
        <div className="mb-6">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <div>正在部署...</div>
            <div>{progress}%</div>
          </div>
        </div>

        {/* 部署步骤 */}
        <div className="mb-6 space-y-3">
          {steps.map((step) => (
            <div key={step.id} className="flex items-start gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  step.status === "completed"
                    ? "bg-secondary text-white"
                    : step.status === "in-progress"
                      ? "bg-primary text-white"
                      : step.status === "error"
                        ? "bg-destructive text-white"
                        : "bg-gray-200 text-gray-500"
                }`}
              >
                {step.status === "completed" ? (
                  <CheckCircle2 size={16} />
                ) : step.status === "in-progress" ? (
                  <Clock size={16} />
                ) : (
                  <Circle size={16} />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium mb-1">{step.title}</div>
                <div className="text-sm text-gray-600">{step.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 部署日志 */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">部署日志</h3>
            <Button variant="outline" size="sm" className="text-sm flex items-center gap-1">
              <Download size={16} />
              下载日志
            </Button>
          </div>
          <div className="bg-neutral-800 text-neutral-100 font-mono text-sm p-3 rounded-md h-[200px] overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className={index === logs.length - 1 ? "text-white" : "text-gray-400"}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="p-6 bg-gray-50 border-t text-center text-gray-600 text-sm">
        部署过程无需人工干预，您可以离开此页面，部署完成后将通过邮件通知您。
      </div>
    </Card>
  )
}
