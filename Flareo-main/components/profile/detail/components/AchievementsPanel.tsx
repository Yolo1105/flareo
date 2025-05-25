"use client"
import { Trophy, Award } from "lucide-react"

export default function AchievementsPanel() {
  const mockData = {
    level: 12,
    experience: 2450,
    nextLevelExp: 3000,
    ranking: 156,
    totalUsers: 10000,
    badges: [
      {
        id: "1",
        name: "首个插件",
        description: "发布了第一个插件",
        iconUrl: "/placeholder.svg?height=32&width=32&query=first plugin badge",
        earnedAt: "2025-01-15",
        rarity: "common",
      },
      {
        id: "2",
        name: "人气开发者",
        description: "插件获得100+部署",
        iconUrl: "/placeholder.svg?height=32&width=32&query=popular developer badge",
        earnedAt: "2025-03-20",
        rarity: "rare",
      },
    ],
  }

  const progressPercentage = (mockData.experience / mockData.nextLevelExp) * 100

  const getRarityColor = (rarity: string) => {
    if (rarity === "common") return "border-gray-300 bg-gray-50"
    if (rarity === "rare") return "border-blue-300 bg-blue-50"
    if (rarity === "epic") return "border-purple-300 bg-purple-50"
    if (rarity === "legendary") return "border-yellow-300 bg-yellow-50"
    return "border-gray-300 bg-gray-50"
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">成就与排行</h3>

      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">等级 {mockData.level}</span>
          </div>
          <div className="text-sm text-gray-600">
            {mockData.experience} / {mockData.nextLevelExp} EXP
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-gray-900">开发者排行</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">#{mockData.ranking}</div>
            <div className="text-sm text-gray-600">/ {mockData.totalUsers.toLocaleString()} 用户</div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-3">获得的徽章</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockData.badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-lg border-2 ${getRarityColor(badge.rarity)} hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-start gap-3">
                <img src={badge.iconUrl || "/placeholder.svg"} alt={badge.name} className="w-10 h-10 rounded" />
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 mb-1">{badge.name}</h5>
                  <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                  <p className="text-xs text-gray-500">获得于 {new Date(badge.earnedAt).toLocaleDateString("zh-CN")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
