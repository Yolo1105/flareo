import { ArrowLeft, DollarSign, Calendar, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "收益详情 - Flareo",
  description: "查看详细的收益和众包记录",
}

// Mock data - replace with real API call
const earningsData = {
  totalEarnings: 1234,
  totalTasksCompleted: 10,
  lastPayoutDate: "2025-05-20",
  pendingPayouts: 2,
  monthlyEarnings: [
    { month: "2025-01", earnings: 150, tasks: 2 },
    { month: "2025-02", earnings: 280, tasks: 3 },
    { month: "2025-03", earnings: 320, tasks: 2 },
    { month: "2025-04", earnings: 240, tasks: 2 },
    { month: "2025-05", earnings: 244, tasks: 1 },
  ],
  recentTransactions: [
    {
      id: "1",
      type: "payout",
      amount: 150,
      description: "插件 A 月度收益",
      date: "2025-05-20",
      status: "completed",
    },
    {
      id: "2",
      type: "earning",
      amount: 50,
      description: "众包任务完成奖励",
      date: "2025-05-18",
      status: "completed",
    },
    {
      id: "3",
      type: "payout",
      amount: 200,
      description: "插件 B 月度收益",
      date: "2025-04-20",
      status: "completed",
    },
    {
      id: "4",
      type: "earning",
      amount: 75,
      description: "代码审查奖励",
      date: "2025-04-15",
      status: "pending",
    },
  ],
}

export default function EarningsDetailPage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100"
      case "pending":
        return "text-yellow-600 bg-yellow-100"
      case "failed":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "已完成"
      case "pending":
        return "处理中"
      case "failed":
        return "失败"
      default:
        return "未知"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "payout":
        return DollarSign
      case "earning":
        return CheckCircle
      default:
        return DollarSign
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case "payout":
        return "打款"
      case "earning":
        return "收益"
      default:
        return "交易"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/profile?role=developer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回个人中心
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">收益详情</h1>
          <p className="text-gray-600">查看详细的收益和众包记录</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">总收益</p>
                <p className="text-xl font-bold text-gray-900">${earningsData.totalEarnings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">完成任务</p>
                <p className="text-xl font-bold text-gray-900">{earningsData.totalTasksCompleted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">待打款</p>
                <p className="text-xl font-bold text-gray-900">{earningsData.pendingPayouts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">最近打款</p>
                <p className="text-xl font-bold text-gray-900">
                  {new Date(earningsData.lastPayoutDate).toLocaleDateString("zh-CN")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Earnings Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">月度收益趋势</h3>
            <div className="space-y-4">
              {earningsData.monthlyEarnings.map((month) => (
                <div key={month.month} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(month.month + "-01").toLocaleDateString("zh-CN", {
                        year: "numeric",
                        month: "long",
                      })}
                    </p>
                    <p className="text-sm text-gray-600">{month.tasks} 个任务</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${month.earnings}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">最近交易记录</h3>
            <div className="space-y-4">
              {earningsData.recentTransactions.map((transaction) => {
                const IconComponent = getTypeIcon(transaction.type)
                return (
                  <div key={transaction.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="p-2 rounded-lg bg-white">
                        <IconComponent className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{getTypeText(transaction.type)}</p>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                          {getStatusText(transaction.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{transaction.description}</p>
                      <p className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString("zh-CN")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {transaction.type === "payout" ? "-" : "+"}${transaction.amount}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
