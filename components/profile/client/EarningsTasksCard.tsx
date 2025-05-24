"use client"
import useSWR from "swr"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { DollarSign, CheckCircle, Clock, Calendar } from "lucide-react"

const EarningsSchema = z.object({
  totalEarnings: z.number(),
  totalTasksCompleted: z.number(),
  lastPayoutDate: z.string(),
  pendingPayouts: z.number(),
})

type EarningsTasksData = z.infer<typeof EarningsSchema>

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function EarningsTasksCard() {
  const router = useRouter()
  const { data, error, isLoading } = useSWR("/api/profile/earnings", fetcher)

  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
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

  const parsed = EarningsSchema.safeParse(data)
  if (!parsed.success) {
    return <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">数据格式错误</div>
  }

  const { totalEarnings, totalTasksCompleted, lastPayoutDate, pendingPayouts } = parsed.data

  const stats = [
    {
      label: "总收益 (USD)",
      value: `$${totalEarnings.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      label: "已完成任务",
      value: totalTasksCompleted.toString(),
      icon: CheckCircle,
      color: "text-blue-600",
    },
    {
      label: "待打款笔数",
      value: pendingPayouts.toString(),
      icon: Clock,
      color: "text-orange-600",
    },
    {
      label: "最近打款",
      value: new Date(lastPayoutDate).toLocaleDateString("zh-CN"),
      icon: Calendar,
      color: "text-purple-600",
    },
  ]

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">我的收益与众包记录</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white ${stat.color}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <button
        onClick={() => router.push("/profile/earnings-detail")}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
      >
        查看详情
      </button>
    </div>
  )
}
