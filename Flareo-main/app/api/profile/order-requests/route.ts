import { NextResponse } from "next/server"

export async function GET() {
  // Mock data - replace with real database query
  const data = {
    orders: [
      {
        id: "1",
        requesterId: "alice123",
        requesterName: "Alice Chen",
        requesterAvatar: "/placeholder.svg?height=40&width=40&query=alice avatar",
        title: "PDF 转 Word 插件",
        description: "我需要一个插件能够批量将PDF文件转换为Word文档，支持保持原有格式和图片。要求界面简洁，操作方便。",
        budget: 50,
        deadline: "2025-06-01",
        status: "pending",
        createdAt: "2025-05-20",
        tags: ["PDF", "Word", "转换"],
      },
      {
        id: "2",
        requesterId: "bob456",
        requesterName: "Bob Wang",
        requesterAvatar: "/placeholder.svg?height=40&width=40&query=bob avatar",
        title: "OCR 文本提取工具",
        description: "要批量截图识别文字内容，支持中英文混合识别，准确率要求95%以上。最好能支持表格识别。",
        budget: 100,
        deadline: "2025-05-30",
        status: "pending",
        createdAt: "2025-05-18",
        tags: ["OCR", "文字识别", "批量处理"],
      },
      {
        id: "3",
        requesterId: "carol789",
        requesterName: "Carol Li",
        requesterAvatar: "/placeholder.svg?height=40&width=40&query=carol avatar",
        title: "数据可视化图表生成器",
        description: "需要一个能够根据Excel数据自动生成各种图表的插件，支持柱状图、饼图、折线图等常见图表类型。",
        budget: 150,
        deadline: "2025-06-15",
        status: "pending",
        createdAt: "2025-05-15",
        tags: ["数据可视化", "图表", "Excel"],
      },
    ],
    total: 3,
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { orderId, action, message } = body

  // Mock response for accepting/rejecting orders
  if (action === "accept") {
    return NextResponse.json({
      success: true,
      message: "订单已接受，系统将通知需求方",
      orderId,
    })
  } else if (action === "reject") {
    return NextResponse.json({
      success: true,
      message: "订单已拒绝",
      orderId,
    })
  }

  return NextResponse.json({ success: false, message: "无效操作" }, { status: 400 })
}
