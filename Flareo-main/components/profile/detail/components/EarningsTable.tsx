"use client"
import { DollarSign, Calendar, CheckCircle } from "lucide-react"

export default function EarningsTable() {
  const mockData = {
    transactions: [
      {
        id: "1",
        type: "payout",
        amount: 150,
        description: "插件 A 月度收益",
        date: "2025-05-20",
        status: "completed",
        pluginName: "代码格式化工具",
      },
      {
        id: "2",
        type: "earning",
        amount: 50,
        description: "众包任务完成奖励",
        date: "2025-05-18",
        status: "completed",
        pluginName: "API 测试助手",
      },
    ],
  }

  const getStatusColor = (status: string) => {
    if (status === "completed") return "bg-green-100 text-green-800"
    if (status === "pending") return "bg-yellow-100 text-yellow-800"
    if (status === "failed") return "bg-red-100 text-red-800"
    return "bg-gray-100 text-gray-800"
  }

  const getStatusText = (status: string) => {
    if (status === "completed") return "已完成"
    if (status === "pending") return "处理中"
    if (status === "failed") return "失败"
    return "未知"
  }

  const getTypeIcon = (type: string) => {
    if (type === "payout") return DollarSign
    if (type === "earning") return CheckCircle
    return DollarSign
  }

  const getTypeText = (type: string) => {
    if (type === "payout") return "打款"
    if (type === "earning") return "收益"
    return "交易"
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">收益记录</h3>
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
          导出记录
        </button>
      </div>

      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockData.transactions.map((transaction) => {
              const IconComponent = getTypeIcon(transaction.type)
              return (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <IconComponent className="w-5 h-5 mr-2 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">{getTypeText(transaction.type)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {transaction.type === "payout" ? "-" : "+"}${transaction.amount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{transaction.description}</div>
                    <div className="text-sm text-gray-500">{transaction.pluginName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      {new Date(transaction.date).toLocaleDateString("zh-CN")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}
                    >
                      {getStatusText(transaction.status)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
