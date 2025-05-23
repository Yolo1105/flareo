import { Button } from "@/components/ui/button"
import { PieChart, Users, Tag, Star, Download, BarChart3, Clock } from "lucide-react"
import Link from "next/link"

export default function PluginHeader() {
  return (
    <div className="bg-white py-8 border-b border-neutral-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-20 h-20 flex-shrink-0 bg-neutral-100 rounded-lg flex items-center justify-center">
            <PieChart className="w-12 h-12 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">数据可视化工具包</h1>
            <div className="flex flex-wrap gap-4 text-neutral-600 text-sm mb-4">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>
                  开发者:{" "}
                  <Link href="#" className="text-indigo-600 hover:underline">
                    张三工作室
                  </Link>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                <span>分类: 前端组件</span>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 text-neutral-200" />
                <span className="text-neutral-700 font-semibold ml-1">4.2 (125 评价)</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                <span>1,500+ 安装</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                <span>版本: 2.1.0</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>更新于: 2025-05-18</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-block px-2 py-1 bg-neutral-100 text-neutral-600 rounded-md text-xs font-medium">
                数据可视化
              </span>
              <span className="inline-block px-2 py-1 bg-neutral-100 text-neutral-600 rounded-md text-xs font-medium">
                图表
              </span>
              <span className="inline-block px-2 py-1 bg-neutral-100 text-neutral-600 rounded-md text-xs font-medium">
                仪表盘
              </span>
              <span className="inline-block px-2 py-1 bg-neutral-100 text-neutral-600 rounded-md text-xs font-medium">
                React
              </span>
              <span className="inline-block px-2 py-1 bg-neutral-100 text-neutral-600 rounded-md text-xs font-medium">
                JavaScript
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <span className="text-2xl font-semibold text-indigo-600">¥99 / 月</span>
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                立即订阅
              </Button>
              <Button
                variant="outline"
                className="text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border-neutral-200"
              >
                免费试用
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
