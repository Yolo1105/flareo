import { ArrowLeft, Heart, Search } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "我的收藏 - Flareo",
  description: "查看所有收藏的插件",
}

// Mock data - replace with real API call
const favoritesData = {
  plugins: [
    {
      id: "1",
      name: "代码格式化工具",
      description: "自动格式化代码，支持多种编程语言",
      iconUrl: "/placeholder.svg?height=48&width=48&query=code formatter icon",
      author: "张开发",
      rating: 4.8,
      downloads: 1250,
      addedAt: "2025-05-01",
    },
    {
      id: "2",
      name: "API 测试助手",
      description: "快速测试 REST API 接口，支持多种请求方式",
      iconUrl: "/placeholder.svg?height=48&width=48&query=api tester icon",
      author: "李程序",
      rating: 4.6,
      downloads: 890,
      addedAt: "2025-04-28",
    },
    {
      id: "3",
      name: "数据库查询器",
      description: "可视化数据库查询工具，支持 SQL 语法高亮",
      iconUrl: "/placeholder.svg?height=48&width=48&query=database icon",
      author: "王数据",
      rating: 4.9,
      downloads: 2100,
      addedAt: "2025-04-20",
    },
  ],
}

export default function FavoritesPage() {
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
          <h1 className="text-2xl font-bold text-gray-900">我的收藏</h1>
          <p className="text-gray-600">管理你收藏的所有插件</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索收藏的插件..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Favorites List */}
        <div className="space-y-4">
          {favoritesData.plugins.map((plugin) => (
            <div
              key={plugin.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start gap-4">
                <img
                  src={plugin.iconUrl || "/placeholder.svg"}
                  alt={`${plugin.name}图标`}
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{plugin.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">作者: {plugin.author}</p>
                    </div>
                    <button className="text-red-500 hover:text-red-600 transition-colors duration-200">
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                  </div>

                  <p className="text-gray-700 mb-3">{plugin.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>⭐ {plugin.rating}</span>
                      <span>📥 {plugin.downloads.toLocaleString()} 下载</span>
                      <span>收藏于 {new Date(plugin.addedAt).toLocaleDateString("zh-CN")}</span>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/plugins/${plugin.id}`}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                      >
                        查看详情
                      </Link>
                      <button className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors duration-200">
                        移除收藏
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {favoritesData.plugins.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无收藏</h3>
            <p className="text-gray-600 mb-4">去发现一些有趣的插件吧！</p>
            <Link
              href="/plugins"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              浏览插件
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
