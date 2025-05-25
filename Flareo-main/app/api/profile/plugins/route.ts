import { NextResponse } from "next/server"

export async function GET() {
  // Mock data - replace with real database query
  const data = {
    plugins: [
      {
        id: "1",
        name: "代码格式化工具",
        description: "自动格式化代码，支持多种编程语言",
        iconUrl: "/placeholder.svg?height=40&width=40&query=code formatter",
        deployments: 127,
        rating: 4.8,
        earnings: 450,
        status: "active",
        createdAt: "2025-01-15",
        updatedAt: "2025-05-20",
      },
      {
        id: "2",
        name: "API 测试助手",
        description: "快速测试 REST API 接口",
        iconUrl: "/placeholder.svg?height=40&width=40&query=api tester",
        deployments: 89,
        rating: 4.6,
        earnings: 320,
        status: "active",
        createdAt: "2025-02-10",
        updatedAt: "2025-05-18",
      },
      {
        id: "3",
        name: "数据库查询器",
        description: "可视化数据库查询工具",
        iconUrl: "/placeholder.svg?height=40&width=40&query=database tool",
        deployments: 45,
        rating: 4.9,
        earnings: 180,
        status: "pending",
        createdAt: "2025-03-05",
        updatedAt: "2025-05-15",
      },
    ],
    total: 3,
    totalEarnings: 950,
  }

  return NextResponse.json(data)
}
