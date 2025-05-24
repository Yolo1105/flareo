"use client"
import useSWR from "swr"
import { Package, Star, TrendingUp, DollarSign, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function MyPluginsTable() {
  const { data, error, isLoading } = useSWR("/api/profile/plugins", fetcher)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 bg-gray-300 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-300 rounded w-24 animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">加载失败</div>
        <button onClick={() => window.location.reload()} className="text-sm text-blue-600 hover:underline">
          重试
        </button>
      </div>
    )
  }

  const plugins = data?.plugins || []
  const total = data?.total || 0

  const getStatusColor = (status: string) => {
    if (status === "active") return "bg-green-100 text-green-800 border-green-200"
    if (status === "pending") return "bg-yellow-100 text-yellow-800 border-yellow-200"
    if (status === "suspended") return "bg-red-100 text-red-800 border-red-200"
    return "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStatusText = (status: string) => {
    if (status === "active") return "运行中"
    if (status === "pending") return "审核中"
    if (status === "suspended") return "已暂停"
    return "未知"
  }

  return (
    <div className="space-y-4 w-full">
      {/* 标题与操作 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">我的插件 ({total})</h3>
        <Link
          href="/plugin/upload"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-md transition-all duration-200"
        >
          创建插件
        </Link>
      </div>

      {plugins.length > 0 ? (
        <div className="overflow-hidden border border-gray-200 rounded-lg w-full">
          <table className="min-w-full divide-y divide-gray-200">
            {/* 表头 - 粘性定位 */}
            <thead className="bg-white sticky top-0 z-20">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">插件</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  部署量
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">评分</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">收益</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plugins.map((plugin: any, index: number) => (
                <tr
                  key={plugin.id}
                  className={`group hover:bg-gray-50 transition-colors duration-200 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={plugin.iconUrl || "/placeholder.svg"}
                        alt={plugin.name}
                        className="w-10 h-10 rounded object-cover mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{plugin.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{plugin.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                      {plugin.deployments}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Star className="w-4 h-4 mr-1 text-yellow-500" />
                      {plugin.rating.toFixed(1)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <DollarSign className="w-4 h-4 mr-1 text-green-500" />
                      {plugin.earnings}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(plugin.status)}`}
                    >
                      {getStatusText(plugin.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === plugin.id ? null : plugin.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* 下拉菜单 */}
                    {openMenuId === plugin.id && (
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <Link
                          href={`/plugins/${plugin.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                        >
                          <Eye className="w-4 h-4" />
                          查看
                        </Link>
                        <Link
                          href={`/plugins/${plugin.id}/edit`}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="w-4 h-4" />
                          编辑
                        </Link>
                        <button className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-50 rounded-b-lg w-full text-left">
                          <Trash2 className="w-4 h-4" />
                          删除
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg w-full">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无插件</h3>
          <p className="text-gray-600 mb-4">创建你的第一个插件吧！</p>
          <Link
            href="/plugin/upload"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-md transition-all duration-200"
          >
            创建插件
          </Link>
        </div>
      )}
    </div>
  )
}
