"use client"
import useSWR from "swr"
import { Users, Package, UserMinus, ExternalLink } from "lucide-react"
import Link from "next/link"
import { z } from "zod"

const DeveloperSchema = z.object({
  id: z.string(),
  name: z.string(),
  bio: z.string(),
  avatarUrl: z.string(),
  pluginsCount: z.number(),
  followersCount: z.number(),
  followedAt: z.string(),
  latestPlugin: z.string(),
})

const FollowingResponseSchema = z.object({
  following: z.array(DeveloperSchema),
})

type FollowingData = z.infer<typeof FollowingResponseSchema>

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch following data')
  }
  const data = await res.json()
  return FollowingResponseSchema.parse(data)
}

export default function FollowingGrid() {
  const { data, error, isLoading } = useSWR<FollowingData>("/api/profile/favorites-following", fetcher)

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

  if (error) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Users className="w-12 h-12 mx-auto mb-4 text-red-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
        <p className="text-gray-600 mb-4">无法加载关注数据，请稍后重试</p>
        <button 
          onClick={() => window.location.reload()}
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          重试
        </button>
      </div>
    )
  }

  if (!data?.following.length) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无关注</h3>
        <p className="text-gray-600 mb-4">去发现一些优秀的开发者吧！</p>
        <Link
          href="/developers"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          浏览开发者
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">我的关注 ({data.following.length})</h3>
        <Link href="/profile/following" className="text-sm text-blue-600 hover:text-blue-700">
          查看全部
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.following.map((developer) => (
          <div
            key={developer.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-start gap-3 mb-3">
              <img
                src={developer.avatarUrl || "/placeholder.svg"}
                alt={developer.name}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-gray-900">{developer.name}</h4>
                  <button className="text-red-500 hover:text-red-600 transition-colors duration-200">
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{developer.bio}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {developer.pluginsCount} 插件
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {developer.followersCount.toLocaleString()} 关注者
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 mb-3">最新插件: {developer.latestPlugin}</div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                关注于 {new Date(developer.followedAt).toLocaleDateString("zh-CN")}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/developers/${developer.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                >
                  <ExternalLink className="w-3 h-3" />
                  主页
                </Link>
                <button className="px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors duration-200">
                  取消关注
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
