"use client"
import { MessageCircle, ThumbsUp, Reply, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function DevInteractionsTable() {
  const mockData = {
    interactions: [
      {
        id: "1",
        type: "comment",
        content: "感谢你的反馈，我们会在下个版本中修复这个问题。",
        targetTitle: "代码格式化工具 - 用户反馈",
        targetUrl: "/plugins/1/comments/123",
        createdAt: "2025-05-20",
        pluginName: "代码格式化工具",
      },
      {
        id: "2",
        type: "reply",
        content: "已经修复了这个 bug，请更新到最新版本。",
        targetTitle: "API 测试助手 - Bug 报告",
        targetUrl: "/plugins/2/issues/456",
        createdAt: "2025-05-18",
        pluginName: "API 测试助手",
      },
    ],
  }

  const getInteractionIcon = (type: string) => {
    if (type === "comment") return MessageCircle
    if (type === "reply") return Reply
    if (type === "like") return ThumbsUp
    return MessageCircle
  }

  const getInteractionText = (type: string) => {
    if (type === "comment") return "评论了"
    if (type === "reply") return "回复了"
    if (type === "like") return "点赞了"
    return "互动了"
  }

  const getInteractionColor = (type: string) => {
    if (type === "comment") return "text-blue-600"
    if (type === "reply") return "text-green-600"
    if (type === "like") return "text-purple-600"
    return "text-gray-600"
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">互动记录</h3>

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
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">{interaction.targetTitle}</p>
                  {interaction.content && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{interaction.content}</p>
                  )}
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
