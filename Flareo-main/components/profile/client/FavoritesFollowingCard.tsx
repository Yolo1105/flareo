"use client"
import useSWR from "swr"
import { z } from "zod"
import Link from "next/link"
import { Heart, Users, ExternalLink } from "lucide-react"

const PluginItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  iconUrl: z.string(),
})

const DeveloperItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string(),
})

const Schema = z.object({
  favorites: z.array(PluginItemSchema),
  following: z.array(DeveloperItemSchema),
})

type FavoritesFollowingData = z.infer<typeof Schema>

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function FavoritesFollowingCard() {
  const { data, error, isLoading } = useSWR("/api/profile/favorites-following", fetcher)

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white shadow-sm rounded-lg p-6 border border-gray-200 animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
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

  const parsed = Schema.safeParse(data)
  if (!parsed.success) {
    return <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">数据格式错误</div>
  }

  const { favorites, following } = parsed.data

  return (
    <div className="space-y-6">
      {/* Favorites Section */}
      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">我的收藏</h3>
        </div>

        {favorites.length > 0 ? (
          <div className="space-y-3">
            {favorites.slice(0, 3).map((plugin) => (
              <div
                key={plugin.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={plugin.iconUrl || "/placeholder.svg?height=32&width=32&query=plugin icon"}
                    alt={`${plugin.name}图标`}
                    className="w-8 h-8 rounded object-cover"
                  />
                  <span className="font-medium text-gray-900">{plugin.name}</span>
                </div>
                <Link
                  href={`/plugins/${plugin.id}`}
                  className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无收藏插件</p>
          </div>
        )}

        <Link
          href="/profile/favorites"
          className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
        >
          查看更多
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Following Section */}
      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">我的关注</h3>
        </div>

        {following.length > 0 ? (
          <div className="space-y-3">
            {following.slice(0, 3).map((developer) => (
              <div
                key={developer.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={developer.avatarUrl || "/placeholder.svg?height=32&width=32&query=developer avatar"}
                    alt={`${developer.name}头像`}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="font-medium text-gray-900">{developer.name}</span>
                </div>
                <Link
                  href={`/developers/${developer.id}`}
                  className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无关注开发者</p>
          </div>
        )}

        <Link
          href="/profile/following"
          className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
        >
          查看更多
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
