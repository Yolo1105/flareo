import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Filter, ChevronDown } from "lucide-react"

export default function PluginsPage() {
  const plugins = [
    {
      id: "data-analysis-helper",
      name: "数据分析助手",
      description: "强大的数据处理和可视化工具，支持多种数据格式，提供丰富的分析功能和图表展示。",
      icon: "/placeholder.svg?height=80&width=80",
      rating: 4.8,
      usageCount: 1240,
      tags: ["数据分析", "可视化", "CSV处理"],
    },
    {
      id: "smart-translator",
      name: "智能翻译器",
      description: "支持50种语言的高精度翻译，针对技术文档和专业术语进行了优化，保持原文格式。",
      icon: "/placeholder.svg?height=80&width=80",
      rating: 4.6,
      usageCount: 980,
      tags: ["翻译", "多语言", "文档处理"],
    },
    {
      id: "image-enhancer",
      name: "图像增强工具",
      description: "一键优化图片质量和分辨率，支持批量处理，提供多种滤镜和编辑功能。",
      icon: "/placeholder.svg?height=80&width=80",
      rating: 4.5,
      usageCount: 860,
      tags: ["图像处理", "批量编辑", "滤镜"],
    },
    {
      id: "code-reviewer",
      name: "代码审查助手",
      description: "自动检测代码问题并提供优化建议，支持多种编程语言，集成CI/CD流程。",
      icon: "/placeholder.svg?height=80&width=80",
      rating: 4.7,
      usageCount: 750,
      tags: ["代码审查", "性能优化", "安全检测"],
    },
    {
      id: "doc-generator",
      name: "文档生成器",
      description: "从代码自动生成完整文档，支持多种格式输出，包含API参考和使用示例。",
      icon: "/placeholder.svg?height=80&width=80",
      rating: 4.4,
      usageCount: 620,
      tags: ["文档", "API", "自动化"],
    },
    {
      id: "database-connector",
      name: "数据库连接器",
      description: "连接各种数据库系统，提供统一的查询接口和数据迁移工具。",
      icon: "/placeholder.svg?height=80&width=80",
      rating: 4.3,
      usageCount: 580,
      tags: ["数据库", "SQL", "数据迁移"],
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 mt-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">插件市场</h1>
        <p className="text-gray-600 mt-1">浏览和发现提升工作效率的各种插件</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="搜索插件..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <Button variant="outline" className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            高级筛选
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select className="pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md appearance-none">
              <option>插件分类</option>
              <option>数据处理</option>
              <option>内容创作</option>
              <option>开发工具</option>
              <option>办公效率</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="relative">
            <select className="pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md appearance-none">
              <option>价格范围</option>
              <option>免费</option>
              <option>¥1-50</option>
              <option>¥51-200</option>
              <option>¥200以上</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="relative">
            <select className="pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md appearance-none">
              <option>评分</option>
              <option>5星</option>
              <option>4星以上</option>
              <option>3星以上</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="relative">
            <select className="pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md appearance-none">
              <option>排序方式</option>
              <option>最受欢迎</option>
              <option>最新发布</option>
              <option>评分最高</option>
              <option>价格低到高</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Plugins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plugins.map((plugin) => (
          <Card key={plugin.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-start space-x-4">
              <img src={plugin.icon || "/placeholder.svg"} alt={plugin.name} className="w-16 h-16 rounded-md" />
              <div>
                <CardTitle className="text-lg font-semibold hover:text-blue-600">
                  <Link href={`/plugins/${plugin.id}`}>{plugin.name}</Link>
                </CardTitle>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <div className="flex items-center">
                    {"★".repeat(Math.floor(plugin.rating))}
                    {"☆".repeat(5 - Math.floor(plugin.rating))}
                    <span className="ml-1">{plugin.rating.toFixed(1)}</span>
                  </div>
                  <span className="mx-2">•</span>
                  <span>{plugin.usageCount}次使用</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-gray-600 text-sm line-clamp-3">{plugin.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {plugin.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="pt-2 flex justify-between">
              <Button variant="outline" size="sm">
                <Link href={`/plugins/${plugin.id}`}>查看详情</Link>
              </Button>
              <Button size="sm">一键部署</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-8 mb-16 flex justify-center">
        <Button variant="outline">加载更多插件</Button>
      </div>
    </div>
  )
}
