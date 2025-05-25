import { ArrowLeft, Users, Search, UserMinus } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "我的关注 - Flareo",
  description: "查看所有关注的开发者",
}

// Mock data - replace with real API call
const followingData = {
  developers: [
    {
      id: "1",
      name: "张开发",
      bio: "全栈开发者，专注于 React 和 Node.js",
      avatarUrl: "/placeholder.svg?height=48&width=48&query=developer avatar",
      pluginsCount: 12,
      followersCount: 1250,
      followedAt: "2025-05-01",
    },
    {
      id: "2",
      name: "李程序",
      bio: "前端工程师，UI/UX 设计爱好者",
      avatarUrl: "/placeholder.svg?height=48&width=48&query=developer avatar",
      pluginsCount: 8,
      followersCount: 890,
      followedAt: "2025-04-28",
    },
    {
      id: "3",
      name: "王数据",
      bio: "数据科学家，机器学习专家",
      avatarUrl: "/placeholder.svg?height=48&width=48&query=developer avatar",
      pluginsCount: 15,
      followersCount: 2100,
      followedAt: "2025-04-20",
    },
  ],
}

export default function FollowingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/profile?role=user"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回个人中心
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">我的关注</h1>
          <p className="text-gray-600">管理你关注的所有开发者</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索关注的开发者..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Following List */}
        <div className="space-y-4">
          {followingData.developers.map((developer) => (
            <div
              key={developer.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start gap-4">
                <img
                  src={developer.avatarUrl || "/placeholder.svg"}
                  alt={`${developer.name}头像`}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{developer.name}</h3>
                      <p className="text-gray-700 mb-2">{developer.bio}</p>
                    </div>
                    <button className="text-red-500 hover:text-red-600 transition-colors duration-200">
                      <UserMinus className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>📦 {developer.pluginsCount} 插件</span>
                      <span>👥 {developer.followersCount.toLocaleString()} 关注者</span>
                      <span>关注于 {new Date(developer.followedAt).toLocaleDateString("zh-CN")}</span>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/developers/${developer.id}`}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                      >
                        查看主页
                      </Link>
                      <button className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors duration-200">
                        取消关注
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {followingData.developers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无关注</h3>
            <p className="text-gray-600 mb-4">去发现一些优秀的开发者吧！</p>
            <Link
              href="/developers"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              浏览开发者
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
