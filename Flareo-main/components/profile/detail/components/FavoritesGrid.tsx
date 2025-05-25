"use client"
import useSWR from "swr"
import { Heart, Star, Download, ExternalLink } from "lucide-react"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function FavoritesGrid() {
  const { data, error, isLoading } = useSWR("/api/profile/favorites-following", fetcher)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-300 rounded w-32 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  // Mock data for now
  const mockData = {
    favorites: [
      {
        id: "1",
        name: "代码格式化工具",
        description: "自动格式化代码，支持多种编程语言",
        iconUrl: "/placeholder.svg?height=48&width=48&query=code formatter",
        author: "张开发",
        rating: 4.8,
        downloads: 1250,
        addedAt: "2025-05-01",
        lastUpdated: "2025-05-20",
      },
      {
        id: "2",
        name: "API 测试助手",
        description: "快速测试 REST API 接口，支持多种请求方式",
        iconUrl: "/placeholder.svg?height=48&width=48&query=api tester",
        author: "李程序",
        rating: 4.6,
        downloads: 890,
        addedAt: "2025-04-28",
        lastUpdated: "2025-05-18",
      },
      {
        id: "3",
        name: "数据库查询器",
        description: "可视化数据库查询工具，支持 SQL 语法高亮",
        iconUrl: "/placeholder.svg?height=48&width=48&query=database tool",
        author: "王数据",
        rating: 4.9,
        downloads: 2100,
        addedAt: "2025-04-20",
        lastUpdated: "2025-05-15",
      },
    ],
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">我的收藏 ({mockData.favorites.length})</h3>
        <Link href="/profile/favorites" className="text-sm text-blue-600 hover:text-blue-700">
          查看全部
        </Link>
      </div>

      {mockData.favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockData.favorites.map((plugin) => (
            <div
              key={plugin.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start gap-3 mb-3">
                <img
                  src={plugin.iconUrl || "/placeholder.svg"}
                  alt={plugin.name}
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-gray-900 truncate">{plugin.name}</h4>
                    <button className="text-red-500 hover:text-red-600 transition-colors duration-200">
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">作者: {plugin.author}</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-3 line-clamp-2">{plugin.description}</p>

              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    {plugin.rating}
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    {plugin.downloads.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  收藏于 {new Date(plugin.addedAt).toLocaleDateString("zh-CN")}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/plugins/${plugin.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                  >
                    <ExternalLink className="w-3 h-3" />
                    查看
                  </Link>
                  <button className="px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors duration-200">
                    移除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无收藏</h3>
          <p className="text-gray-600 mb-4">去发现一些有趣的插件吧！</p>
          <Link
            href="/plugins"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            浏览插件市场
          </Link>
        </div>
      )}
    </div>
  )
}
