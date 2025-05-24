import type React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Filter, Clock, DollarSign } from "lucide-react"

interface CrowdsourcingCardProps {
  title: string
  description: string
  tags: string[]
  budget: string
  deadline: string
  status: "open" | "in-progress" | "completed"
  publisher: {
    name: string
    avatar: string
    rating: number
  }
}

const CrowdsourcingCard: React.FC<CrowdsourcingCardProps> = ({
  title,
  description,
  tags,
  budget,
  deadline,
  status,
  publisher,
}) => {
  const statusColors = {
    open: "bg-green-100 text-green-800",
    "in-progress": "bg-blue-100 text-blue-800",
    completed: "bg-gray-100 text-gray-800",
  }

  const statusLabels = {
    open: "开放",
    "in-progress": "进行中",
    completed: "已完成",
  }

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold hover:text-blue-600 cursor-pointer">{title}</CardTitle>
          <Badge className={`${statusColors[status]}`}>{statusLabels[status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{description}</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="outline" className="bg-gray-50">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-gray-500">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1 text-green-600" />
            <span>{budget}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-amber-600" />
            <span>{deadline}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex items-center justify-between text-sm border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <img src={publisher.avatar || "/placeholder.svg"} alt={publisher.name} className="w-6 h-6 rounded-full" />
          <span>{publisher.name}</span>
          <div className="flex items-center text-amber-500">
            {"★".repeat(publisher.rating)}
            {"☆".repeat(5 - publisher.rating)}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            查看详情
          </Button>
          {status === "open" && <Button size="sm">接单</Button>}
        </div>
      </CardFooter>
    </Card>
  )
}

const CrowdsourcingWallPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">插件众包墙</h1>
        <p className="text-gray-600 mt-1">发布您的插件需求，或接取开发任务赚取报酬</p>
      </div>

      <div className="flex flex-row gap-6 overflow-x-auto">
        {/* Main Content Area */}
        <div className="flex-1 max-w-3xl">
          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 max-w-3xl w-full mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="搜索众包需求..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <Button variant="outline" className="flex items-center whitespace-nowrap">
                <Filter className="h-4 w-4 mr-2" />
                高级筛选
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <select className="pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md w-auto min-w-[120px]">
                <option>插件标签</option>
                <option>数据处理</option>
                <option>AI模型</option>
                <option>图像处理</option>
                <option>文本分析</option>
              </select>
              <select className="pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md w-auto min-w-[120px]">
                <option>预算区间</option>
                <option>¥1000以下</option>
                <option>¥1000-5000</option>
                <option>¥5000-10000</option>
                <option>¥10000以上</option>
              </select>
              <select className="pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md w-auto min-w-[100px]">
                <option>状态</option>
                <option>开放</option>
                <option>进行中</option>
                <option>已完成</option>
              </select>
              <select className="pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md w-auto min-w-[100px]">
                <option>排序</option>
                <option>最新发布</option>
                <option>预算高低</option>
                <option>截止日期</option>
              </select>
            </div>
          </div>

          {/* Crowdsourcing List */}
          <div className="space-y-4">
            <CrowdsourcingCard
              title="开发一个高效的PDF文本提取与分析插件"
              description="需要开发一个插件，能够从PDF文档中提取文本内容，并进行智能分析，包括关键信息提取、主题分类等功能。要求处理速度快，支持批量处理，并能处理复杂格式的PDF文件。"
              tags={["PDF处理", "文本分析", "信息提取"]}
              budget="¥5,000-8,000"
              deadline="30天"
              status="open"
              publisher={{
                name: "张大明",
                avatar:
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                rating: 4,
              }}
            />

            <CrowdsourcingCard
              title="图像批处理插件优化与功能扩展"
              description="现有一个图像批处理插件，需要优化其性能并扩展功能，包括添加更多滤镜效果、支持更多图像格式、优化内存使用等。要求有图像处理经验，熟悉相关算法。"
              tags={["图像处理", "性能优化", "功能扩展"]}
              budget="¥3,000-5,000"
              deadline="20天"
              status="in-progress"
              publisher={{
                name: "李小华",
                avatar:
                  "https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                rating: 5,
              }}
            />

            <CrowdsourcingCard
              title="开发多语言翻译API集成插件"
              description="需要开发一个插件，能够集成多个翻译API（如Google、DeepL、百度等），提供统一的接口，支持文本、文档的多语言翻译，并具备语言检测、术语库管理等功能。"
              tags={["API集成", "多语言翻译", "文本处理"]}
              budget="¥10,000-15,000"
              deadline="45天"
              status="open"
              publisher={{
                name: "王小明",
                avatar:
                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                rating: 4,
              }}
            />

            <CrowdsourcingCard
              title="数据可视化仪表盘插件"
              description="开发一个数据可视化插件，能够将CSV、JSON等格式的数据转换为交互式仪表盘，支持多种图表类型，具备数据筛选、排序、导出等功能。要求界面美观，操作简单。"
              tags={["数据可视化", "仪表盘", "交互设计"]}
              budget="¥8,000-12,000"
              deadline="40天"
              status="completed"
              publisher={{
                name: "赵小红",
                avatar:
                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                rating: 5,
              }}
            />
          </div>

          <div className="mt-6 flex justify-center">
            <Button variant="outline">加载更多</Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-[640px] flex-shrink-0">
          {/* Create Task Button */}
          <div className="mb-6">
            <Button className="w-full" size="lg">
              发布众包需求
            </Button>
          </div>

          {/* Crowdsourcing Stats */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">📊 众包统计</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">总需求数</span>
                  <span className="font-medium">1,245</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">平均完成时间</span>
                  <span className="font-medium">25天</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">平均报酬</span>
                  <span className="font-medium">¥6,500</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">成功率</span>
                  <span className="font-medium text-green-600">92%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hot Tasks */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">🔥 热门众包</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <a href="#" className="block font-medium text-blue-600 hover:text-blue-800 hover:underline mb-1">
                    AI助手插件开发
                  </a>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">报酬: ¥20,000</span>
                    <span className="text-gray-500">剩余: 5天</span>
                  </div>
                </div>
                <div className="border-b border-gray-100 pb-3">
                  <a href="#" className="block font-medium text-blue-600 hover:text-blue-800 hover:underline mb-1">
                    视频处理工具优化
                  </a>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">报酬: ¥8,000</span>
                    <span className="text-gray-500">剩余: 12天</span>
                  </div>
                </div>
                <div>
                  <a href="#" className="block font-medium text-blue-600 hover:text-blue-800 hover:underline mb-1">
                    数据库连接器插件
                  </a>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">报酬: ¥15,000</span>
                    <span className="text-gray-500">剩余: 20天</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" className="w-full text-blue-600">
                查看更多热门众包
              </Button>
            </CardFooter>
          </Card>

          {/* Top Developers */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">👨‍💻 开发者排行</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="text-lg font-bold text-amber-500 w-6">1</span>
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt="Developer"
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="ml-3">
                    <div className="font-medium">王小明</div>
                    <div className="text-xs text-gray-500">完成项目: 28 | 评分: 4.9</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-lg font-bold text-gray-400 w-6">2</span>
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt="Developer"
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="ml-3">
                    <div className="font-medium">张大明</div>
                    <div className="text-xs text-gray-500">完成项目: 24 | 评分: 4.8</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-lg font-bold text-amber-800 w-6">3</span>
                  <img
                    src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    alt="Developer"
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="ml-3">
                    <div className="font-medium">李小华</div>
                    <div className="text-xs text-gray-500">完成项目: 21 | 评分: 4.7</div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" className="w-full text-blue-600">
                查看完整排行榜
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CrowdsourcingWallPage
