"use client"
import useSWR from "swr"
import { Target, Calendar, DollarSign, Clock, MessageCircle } from "lucide-react"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function OrderRequestsTable() {
  const { data, error, isLoading } = useSWR("/api/profile/order-requests", fetcher)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 bg-gray-300 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-300 rounded w-24 animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
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

  const orders = data?.orders || []
  const total = data?.total || 0
  const pendingCount = orders.filter((o: any) => o.status === "pending").length

  const getStatusColor = (status: string) => {
    if (status === "pending") return "bg-yellow-100 text-yellow-800 border-yellow-200"
    if (status === "accepted") return "bg-green-100 text-green-800 border-green-200"
    if (status === "rejected") return "bg-red-100 text-red-800 border-red-200"
    if (status === "completed") return "bg-blue-100 text-blue-800 border-blue-200"
    return "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStatusText = (status: string) => {
    if (status === "pending") return "待处理"
    if (status === "accepted") return "已接受"
    if (status === "rejected") return "已拒绝"
    if (status === "completed") return "已完成"
    return "未知"
  }

  const isExpiringSoon = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const now = new Date()
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilDeadline <= 3
  }

  return (
    <div className="space-y-4">
      {/* 标题与统计 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">接单需求 ({total})</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>待处理: {pendingCount}</span>
        </div>
      </div>

      {orders.length > 0 ? (
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            {/* 表头 - 粘性定位 */}
            <thead className="bg-white sticky top-0 z-20">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  请求者
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  需求标题
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  报酬 (USD)
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  截止日期
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order: any, index: number) => {
                const expiringSoon = isExpiringSoon(order.deadline)
                return (
                  <tr
                    key={order.id}
                    className={`hover:bg-gray-50 transition-colors duration-200 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={order.requesterAvatar || "/placeholder.svg"}
                          alt={order.requesterName}
                          className="w-10 h-10 rounded-full object-cover mr-3"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.requesterName}</div>
                          <div className="text-sm text-gray-500">ID: {order.requesterId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 mb-1">{order.title}</div>
                        <div className="text-sm text-gray-600 line-clamp-2">{order.description}</div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {order.tags.map((tag: string, tagIndex: number) => (
                            <span
                              key={tagIndex}
                              className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-semibold text-gray-900">
                        <DollarSign className="w-4 h-4 mr-1 text-green-500" />
                        {order.budget}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${expiringSoon ? "text-red-600 font-medium" : "text-gray-900"}`}>
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {new Date(order.deadline).toLocaleDateString("zh-CN")}
                      </div>
                      {expiringSoon && <div className="text-xs text-red-500">即将截止</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status)}`}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/profile/orders/${order.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                      >
                        <MessageCircle className="w-3 h-3" />
                        查看详情
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无接单需求</h3>
          <p className="text-gray-600 mb-4">当有用户向你发起插件开发需求时，会在这里显示</p>
        </div>
      )}
    </div>
  )
}
