import { NextResponse } from "next/server"

export async function GET() {
  // Mock data - replace with real database query
  const data = {
    deployments: [
      {
        id: "1",
        pluginName: "代码格式化工具",
        pluginIcon: "/placeholder.svg?height=40&width=40&query=code formatter",
        instanceName: "my-formatter-prod",
        status: "running",
        createdAt: "2025-04-15",
        expiresAt: "2025-06-15",
        plan: "Pro",
        cost: 9.99,
      },
      {
        id: "2",
        pluginName: "API 测试助手",
        pluginIcon: "/placeholder.svg?height=40&width=40&query=api tester",
        instanceName: "api-tester-dev",
        status: "stopped",
        createdAt: "2025-03-20",
        expiresAt: "2025-05-20",
        plan: "Basic",
        cost: 4.99,
      },
      {
        id: "3",
        pluginName: "数据库查询器",
        pluginIcon: "/placeholder.svg?height=40&width=40&query=database tool",
        instanceName: "db-query-staging",
        status: "error",
        createdAt: "2025-05-01",
        expiresAt: "2025-07-01",
        plan: "Enterprise",
        cost: 19.99,
      },
    ],
  }

  return NextResponse.json(data)
}
