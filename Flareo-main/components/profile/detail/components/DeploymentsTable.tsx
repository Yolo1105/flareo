"use client"
import useSWR from "swr"
import { Server, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DeploymentsTable() {
  const { data, error, isLoading } = useSWR("/api/profile/deployments", fetcher)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-300 rounded w-32 animate-pulse"></div>
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

  const deployments = data?.deployments || []

  const getStatusIcon = (status: string) => {
    if (status === "running") return CheckCircle
    if (status === "stopped") return XCircle
    if (status === "error") return AlertCircle
    return Server
  }

  const getStatusColor = (status: string) => {
    if (status === "running") return "bg-green-100 text-green-800"
    if (status === "stopped") return "bg-gray-100 text-gray-800"
    if (status === "error") return "bg-red-100 text-red-800"
    return "bg-gray-100 text-gray-800"
  }

  const getStatusText = (status: string) => {
    if (status === "running") return "运行中"
    if (status === "stopped") return "已停止"
    if (status === "error") return "错误"
    return "未知"
  }

  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 7
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">部署管理</h3>
        <Link href="/plugin/deploy">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
            新建部署
          </button>
        </Link>
      </div>

      {deployments.length > 0 ? (
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">插件</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  实例名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  到期时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">套餐</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deployments.map((deployment: any) => {
                const StatusIcon = getStatusIcon(deployment.status)
                const expiringSoon = isExpiringSoon(deployment.expiresAt)

                return (
                  <tr key={deployment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={deployment.pluginIcon || "/placeholder.svg"}
                          alt={deployment.pluginName}
                          className="w-10 h-10 rounded object-cover mr-3"
                        />
                        <div className="text-sm font-medium text-gray-900">{deployment.pluginName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{deployment.instanceName}</div>
                      <div className="text-sm text-gray-500">{deployment.plan}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <StatusIcon className="w-4 h-4 mr-2" />
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(deployment.status)}`}
                        >
                          {getStatusText(deployment.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${expiringSoon ? "text-red-600 font-medium" : "text-gray-900"}`}>
                        {new Date(deployment.expiresAt).toLocaleDateString("zh-CN")}
                      </div>
                      {expiringSoon && <div className="text-xs text-red-500">即将到期</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{deployment.plan}</div>
                      <div className="text-sm text-gray-500">${deployment.cost}/月</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {deployment.status === "running" ? (
                          <button className="text-red-600 hover:text-red-900">停止</button>
                        ) : (
                          <button className="text-green-600 hover:text-green-900">启动</button>
                        )}
                        <button className="text-blue-600 hover:text-blue-900">续费</button>
                        <button className="text-gray-600 hover:text-gray-900">设置</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Server className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无部署</h3>
          <p className="text-gray-600 mb-4">部署你的第一个插件实例！</p>
          <Link href="/plugin/deploy">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
              新建部署
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}
