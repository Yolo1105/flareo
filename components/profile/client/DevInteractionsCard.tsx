"use client"
import useSWR from "swr"
import { z } from "zod"
import Link from "next/link"
import { MessageCircle, ThumbsUp, Reply, ExternalLink } from "lucide-react"

const DevInteractionsSchema = z.object({
  totalComments: z.number(),
  totalReplies: z.number(),
  totalLikes: z.number(),
  recentInteractions: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["comment", "reply", "like"]),
      content: z.string().optional(),
      targetTitle: z.string(),
      targetUrl: z.string(),
      createdAt: z.string(),
    }),
  ),
})

type DevInteractionsData = z.infer<typeof DevInteractionsSchema>

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DevInteractionsCard() {
  const { data, error, isLoading } = useSWR("/api/profile/developer-interactions", fetcher)

  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-300 rounded"></div>
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-300 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
        <p className="font-medium">加载失败</p>
        <p className="text-sm mt-1">{error.message}</p>
        <button onClick={() => window.location.reload()} className="mt-3 text-sm underline hover:no-underline">
          重试
        </button>
      </div>
    )
  }

  const parsed = DevInteractionsSchema.safeParse(data)
  if (!parsed.success) {
    return <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">数据格式错误</div>
  }

  const { totalComments, totalReplies, totalLikes, recentInteractions } = parsed.data

  const stats = [
    { label: "评论", value: totalComments, icon: MessageCircle, color: "text-blue-600" },
    { label: "回复", value: totalReplies, icon: Reply, color: "text-green-600" },
    { label: "点赞", value: totalLikes, icon: ThumbsUp, color: "text-purple-600" },
  ]

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "comment":
        return MessageCircle
      case "reply":
        return Reply
      case "like":
        return ThumbsUp
      default:
        return MessageCircle
    }
  }

  const getInteractionText = (type: string) => {
    switch (type) {
      case "comment":
        return "评论了"
      case "reply":
        return "回复了"
      case "like":
        return "点赞了"
      default:
        return "互动了"
    }
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900">我的互动记录</h3>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <div
                className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-white mb-2 ${stat.color}`}
              >
                <IconComponent className="w-5 h-5" />
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Recent Interactions */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">最近互动</h4>
        {recentInteractions.length > 0 ? (
          <div className="space-y-3">
            {recentInteractions.slice(0, 5).map((interaction) => {
              const IconComponent = getInteractionIcon(interaction.type)
              return (
                <div
                  key={interaction.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex-shrink-0">
                    <IconComponent className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {getInteractionText(interaction.type)}
                      <span className="font-medium">{interaction.targetTitle}</span>
                    </p>
                    {interaction.content && (
                      <p className="text-xs text-gray-600 mt-1 truncate">{interaction.content}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(interaction.createdAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  <Link
                    href={interaction.targetUrl}
                    className="flex-shrink-0 text-blue-600 hover:text-blue-700 transition-colors duration-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无互动记录</p>
          </div>
        )}

        <Link
          href="/profile/interactions"
          className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
        >
          查看更多
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
