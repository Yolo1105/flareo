"use client"
import useSWR from "swr"
import { z } from "zod"
import { Award, Trophy, TrendingUp } from "lucide-react"

const BadgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  iconUrl: z.string(),
  earnedAt: z.string(),
  rarity: z.enum(["common", "rare", "epic", "legendary"]),
})

const AchievementsSchema = z.object({
  badges: z.array(BadgeSchema),
  level: z.number(),
  experience: z.number(),
  nextLevelExp: z.number(),
  ranking: z.number(),
  totalUsers: z.number(),
})

type AchievementsData = z.infer<typeof AchievementsSchema>

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AchievementsCard() {
  const { data, error, isLoading } = useSWR("/api/profile/achievements", fetcher)

  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          <div className="h-20 bg-gray-300 rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
            ))}
          </div>
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

  const parsed = AchievementsSchema.safeParse(data)
  if (!parsed.success) {
    return <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">数据格式错误</div>
  }

  const { badges, level, experience, nextLevelExp, ranking, totalUsers } = parsed.data

  const progressPercentage = (experience / nextLevelExp) * 100

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "border-gray-300 bg-gray-50"
      case "rare":
        return "border-blue-300 bg-blue-50"
      case "epic":
        return "border-purple-300 bg-purple-50"
      case "legendary":
        return "border-yellow-300 bg-yellow-50"
      default:
        return "border-gray-300 bg-gray-50"
    }
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-900">我的成长与成就</h3>
      </div>

      {/* Level and Progress */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">等级 {level}</span>
          </div>
          <div className="text-sm text-gray-600">
            {experience} / {nextLevelExp} EXP
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Ranking */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-900">排行榜</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">#{ranking}</div>
            <div className="text-sm text-gray-600">/ {totalUsers.toLocaleString()} 用户</div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">最近获得的徽章</h4>
        {badges.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {badges.slice(0, 6).map((badge) => (
              <div
                key={badge.id}
                className={`p-3 rounded-lg border-2 ${getRarityColor(badge.rarity)} hover:shadow-md transition-shadow duration-200`}
                title={badge.description}
              >
                <div className="flex flex-col items-center text-center">
                  <img
                    src={badge.iconUrl || "/placeholder.svg?height=32&width=32&query=achievement badge"}
                    alt={badge.name}
                    className="w-8 h-8 mb-2"
                  />
                  <div className="text-xs font-medium text-gray-900 mb-1">{badge.name}</div>
                  <div className="text-xs text-gray-500">{new Date(badge.earnedAt).toLocaleDateString("zh-CN")}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无徽章</p>
          </div>
        )}
      </div>
    </div>
  )
}
