import { ArrowLeft, Calendar, DollarSign, Tag } from "lucide-react"
import Link from "next/link"
import ChatInterface from "@/components/profile/orders/ChatInterface"

export const metadata = {
  title: "订单详情 - Flareo",
  description: "查看订单详情并与需求方沟通",
}

// Mock data - replace with real API call
const getOrderDetails = (id: string) => {
  return {
    id,
    requesterId: "alice123",
    requesterName: "Alice Chen",
    requesterAvatar: "/placeholder.svg?height=40&width=40&query=alice avatar",
    title: "PDF 转 Word 插件",
    description:
      "我需要一个插件能够批量将PDF文件转换为Word文档，支持保持原有格式和图片。要求界面简洁，操作方便。需要支持中英文混合文档，并且能够处理复杂的表格结构。",
    budget: 50,
    deadline: "2025-06-01",
    status: "pending",
    createdAt: "2025-05-20",
    tags: ["PDF", "Word", "转换"],
    requirements: [
      "支持批量转换PDF文件",
      "保持原有格式和图片",
      "界面简洁易用",
      "支持中英文混合文档",
      "处理复杂表格结构",
      "提供转换进度显示",
    ],
  }
}

interface OrderDetailPageProps {
  params: {
    id: string
  }
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const order = getOrderDetails(params.id)

  const getStatusColor = (status: string) => {
    if (status === "pending") return "bg-yellow-100 text-yellow-800 border-yellow-200"
    if (status === "accepted") return "bg-green-100 text-green-800 border-green-200"
    if (status === "rejected") return "bg-red-100 text-red-800 border-red-200"
    if (status === "completed") return "bg-blue-100 text-blue-800 border-blue-200"
    return "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStatusText = (status: string) => {
    if (status === "pending") return "待处理"
    if (status === "accepted") return "已接受"
    if (status === "rejected") return "已拒绝"
    if (status === "completed") return "已完成"
    return "未知"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link
            href="/profile?role=developer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回接单需求
          </Link>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* 左侧：订单详情 */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">订单详情</h2>

              {/* 需求方信息 */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                <img
                  src={order.requesterAvatar || "/placeholder.svg"}
                  alt={order.requesterName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-gray-900">{order.requesterName}</div>
                  <div className="text-sm text-gray-500">ID: {order.requesterId}</div>
                </div>
              </div>

              {/* 订单基本信息 */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{order.title}</h3>
                  <p className="text-sm text-gray-600">{order.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <div>
                      <div className="text-sm text-gray-500">报酬</div>
                      <div className="font-semibold text-gray-900">${order.budget}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="text-sm text-gray-500">截止日期</div>
                      <div className="font-semibold text-gray-900">
                        {new Date(order.deadline).toLocaleDateString("zh-CN")}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-2">状态</div>
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(order.status)}`}
                  >
                    {getStatusText(order.status)}
                  </span>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-2">标签</div>
                  <div className="flex flex-wrap gap-2">
                    {order.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-2">具体要求</div>
                  <ul className="space-y-1">
                    {order.requirements.map((req, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：聊天界面 */}
          <div className="col-span-12 lg:col-span-8">
            <ChatInterface orderId={order.id} requesterName={order.requesterName} orderStatus={order.status} />
          </div>
        </div>
      </div>
    </div>
  )
}
