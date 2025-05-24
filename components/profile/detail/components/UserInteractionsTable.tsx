"use client"
import { MessageCircle, HelpCircle, Star, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function UserInteractionsTable() {
  const mockData = {
    interactions: [
      {
        id: "1",
        type: "question",
        content: "这个插件支持 TypeScript 吗？",
        pluginName: "代码格式化工具",
        targetUrl: "/plugins/1/discussions/123",
        createdAt: "2025-05-20",
        status: "answered",
      },
      {
        id: "2",
        type: "comment",
        content: "非常好用的工具，大大提高了我的开发效率！",
        pluginName: "API 测试助手",
        targetUrl: "/plugins/2/reviews/456",
        createdAt: "2025-05-18",
        status: "published",
      },
    ],
  }

  const getInteractionIcon = (type: string) => {
    if (type === "question") return HelpCircle
    if (type === "comment") return MessageCircle
    if (type === "feedback") return MessageCircle
    if (type === "rating") return Star
    return MessageCircle
  }

  const getInteractionText = (type: string) => {
    if (type === "question") return "提问了"
    if (type === "comment") return "评论了"
    if (type === "feedback") return "反馈了"
    if (type === "rating") return "评价了"
    return "互动了"
  }

  const getInteractionColor = (type: string) => {
    if (type === "question") return "text-blue-600"
    if (type === "comment") return "text-green-600"
    if (type === "feedback") return "text-orange-600"
    if (type === "rating") return "text-yellow-600"
    return "text-gray-600"
  }

  const getStatusColor = (status: string) => {
    if (status === "answered") return "bg-green-100 text-green-800"
    if (status === "published") return "bg-blue-100 text-blue-800"
    if (status === "pending") return "bg-yellow-100 text-yellow-800"
    return "bg-gray-100 text-gray-800"
  }

  const getStatusText = (status: string) => {
    if (status === "answered") return "已回复"
    if (status === "published") return "已发布"
    if (status === "pending") return "待处理"
    return "未知"
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">我的互动记录</h3>

      <div className="space-y-3">
        {mockData.interactions.map((interaction) => {
          const IconComponent = getInteractionIcon(interaction.type)
          return (
            <div
              key={interaction.id}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-white ${getInteractionColor(interaction.type)}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{getInteractionText(interaction.type)}</span>
                    <span className="text-sm text-gray-600">{interaction.pluginName}</span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(interaction.status)}`}
                    >
                      {getStatusText(interaction.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2 line-clamp-2">{interaction.content}</p>
                  <p className="text-xs text-gray-500">{new Date(interaction.createdAt).toLocaleDateString("zh-CN")}</p>
                </div>
                <Link
                  href={interaction.targetUrl}
                  className="flex-shrink-0 text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
