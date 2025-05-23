"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Users } from "lucide-react"

export default function Sidebar() {
  const [selectedPlan, setSelectedPlan] = useState("monthly")

  const plans = [
    {
      id: "monthly",
      name: "月度订阅",
      price: "¥99 / 月",
      description: "适合个人开发者和小团队",
    },
    {
      id: "yearly",
      name: "年度订阅",
      price: "¥999 / 年",
      description: "优惠15%，适合长期使用",
    },
    {
      id: "enterprise",
      name: "企业版",
      price: "联系我们",
      description: "定制化服务和支持",
    },
  ]

  return (
    <div className="lg:w-1/4">
      <div className="lg:sticky lg:top-8 space-y-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">选择方案</h3>
          <div className="space-y-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "border rounded-md p-3 cursor-pointer transition-all",
                  selectedPlan === plan.id
                    ? "border-indigo-600 bg-indigo-50 shadow-sm"
                    : "border-neutral-200 hover:border-indigo-300 hover:shadow-sm",
                )}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{plan.name}</span>
                  <span className="font-semibold text-indigo-600">{plan.price}</span>
                </div>
                <p className="text-sm text-neutral-600">{plan.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700">立即订阅</Button>
            <Button variant="outline" className="w-full">
              免费试用 14 天
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">关于开发者</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-neutral-500" />
            </div>
            <div>
              <div className="font-medium">张三工作室</div>
              <a href="#" className="text-sm text-indigo-600 hover:underline">
                查看开发者主页
              </a>
            </div>
          </div>
          <p className="text-sm text-neutral-600 mt-3">专注于提供高质量的数据可视化解决方案。</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">部署方式</h3>
          <ul className="space-y-2">
            <li className="text-sm text-neutral-600 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
              API 调用
            </li>
            <li className="text-sm text-neutral-600 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
              iframe 嵌入
            </li>
            <li className="text-sm text-neutral-600 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
              Docker Compose
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
