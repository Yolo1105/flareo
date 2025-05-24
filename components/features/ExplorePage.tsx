import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Filter, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"

export default function ExplorePage() {
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">探索市场</h1>
          <p className="text-gray-600 mt-1">浏览和发现提升工作效率的各种探索</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button>
            <i className="ri-upload-cloud-line mr-2"></i>
            上传探索
          </Button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="搜索探索..."
            className="w-full"
            prefix={<i className="ri-search-line text-gray-400"></i>}
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            <SelectItem value="document">文档处理</SelectItem>
            <SelectItem value="image">图像处理</SelectItem>
            <SelectItem value="data">数据分析</SelectItem>
            <SelectItem value="api">API 集成</SelectItem>
            <SelectItem value="dev">开发工具</SelectItem>
            <SelectItem value="ai">AI 工具</SelectItem>
            <SelectItem value="monitor">监控工具</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="popular">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="排序方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">最受欢迎</SelectItem>
            <SelectItem value="latest">最新上架</SelectItem>
            <SelectItem value="rating">评分最高</SelectItem>
            <SelectItem value="downloads">下载最多</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 探索列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* 探索卡片 */}
        {plugins.map((plugin) => (
          <Link
            key={plugin.id}
            href={`/plugins/${plugin.id}`}
            className="block"
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="relative aspect-video">
                  <Image
                    src={plugin.icon || "/placeholder.svg"}
                    alt={plugin.name}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{plugin.name}</h3>
                  <Badge variant="outline">{plugin.rating.toFixed(1)}</Badge>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {plugin.description}
                </p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {"★".repeat(Math.floor(plugin.rating))}
                      {"☆".repeat(5 - Math.floor(plugin.rating))}
                    </div>
                    <span className="ml-1 text-sm">{plugin.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>{plugin.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-600">
                      {plugin.name}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 加载更多 */}
      <div className="text-center mt-8">
        <Button variant="outline">加载更多探索</Button>
      </div>
    </div>
  )
} 