import type React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Zap, Database, FileText, ImageIcon, Code, BarChart, Share2, Clock } from "lucide-react"

interface PluginFlowCardProps {
  title: string
  description: string
  plugins: {
    name: string
    icon: string
    description: string
  }[]
  usageCount: number
  category: string
}

const PluginFlowCard: React.FC<PluginFlowCardProps> = ({ title, description, plugins, usageCount, category }) => {
  return (
    <Card className="mb-6 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold hover:text-blue-600 cursor-pointer">{title}</CardTitle>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-gray-600 text-sm mb-4">{description}</p>

        <div className="space-y-3">
          {plugins.map((plugin, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                <img src={plugin.icon || "/placeholder.svg"} alt={plugin.name} className="w-8 h-8 rounded-md" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{plugin.name}</h4>
                <p className="text-xs text-gray-500">{plugin.description}</p>
              </div>
              {index < plugins.length - 1 && (
                <div className="flex-shrink-0 flex items-center justify-center h-full ml-2">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 text-sm text-gray-500">已有 {usageCount} 人使用此组合</div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between border-t border-gray-100">
        <Button>一键部署</Button>
        <Button variant="outline">查看详情</Button>
      </CardFooter>
    </Card>
  )
}

interface PluginCategoryCardProps {
  title: string
  description: string
  icon: React.ReactNode
  count: number
}

const PluginCategoryCard: React.FC<PluginCategoryCardProps> = ({ title, description, icon, count }) => {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">{icon}</div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500 mb-3">{description}</p>
          <Badge variant="outline">{count} 个插件</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

const NavigatorPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">技术导航仪</h1>
        <p className="text-gray-600 mt-1">发现最佳插件组合，一键部署完整工作流</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content Area */}
        <div className="w-full lg:w-2/3">
          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="搜索插件组合..."
                  className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select className="pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md">
                  <option>所有类别</option>
                  <option>数据处理</option>
                  <option>内容创作</option>
                  <option>开发工具</option>
                  <option>办公效率</option>
                </select>
                <select className="pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md">
                  <option>推荐排序</option>
                  <option>使用量</option>
                  <option>最新</option>
                  <option>评分</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="recommended" className="mb-6">
            <TabsList className="w-full grid grid-cols-3 mb-6">
              <TabsTrigger value="recommended">为您推荐</TabsTrigger>
              <TabsTrigger value="popular">热门组合</TabsTrigger>
              <TabsTrigger value="recent">最近使用</TabsTrigger>
            </TabsList>

            <TabsContent value="recommended" className="mt-0">
              <div className="space-y-6">
                <PluginFlowCard
                  title="网页数据采集与分析流程"
                  description="从网页抓取数据，清洗处理后进行分析和可视化，适合市场研究和数据分析师。"
                  plugins={[
                    {
                      name: "网页爬虫",
                      icon: "https://via.placeholder.com/40",
                      description: "从网页抓取结构化数据",
                    },
                    {
                      name: "数据清洗工具",
                      icon: "https://via.placeholder.com/40",
                      description: "处理和规范化原始数据",
                    },
                    {
                      name: "数据分析助手",
                      icon: "https://via.placeholder.com/40",
                      description: "分析数据并生成可视化报告",
                    },
                  ]}
                  usageCount={1240}
                  category="数据处理"
                />

                <PluginFlowCard
                  title="AI辅助内容创作流程"
                  description="利用AI生成初稿，进行编辑优化，最后进行语法和事实检查，提高内容创作效率。"
                  plugins={[
                    {
                      name: "AI内容生成器",
                      icon: "https://via.placeholder.com/40",
                      description: "基于提示生成高质量初稿",
                    },
                    {
                      name: "内容编辑助手",
                      icon: "https://via.placeholder.com/40",
                      description: "优化文本结构和表达",
                    },
                    {
                      name: "语法检查工具",
                      icon: "https://via.placeholder.com/40",
                      description: "检查语法错误和事实准确性",
                    },
                  ]}
                  usageCount={986}
                  category="内容创作"
                />

                <PluginFlowCard
                  title="多语言文档处理流程"
                  description="提取PDF文档内容，翻译成多种语言，并生成格式统一的多语言文档。"
                  plugins={[
                    {
                      name: "PDF内容提取器",
                      icon: "https://via.placeholder.com/40",
                      description: "从PDF中提取文本和结构",
                    },
                    {
                      name: "智能翻译器",
                      icon: "https://via.placeholder.com/40",
                      description: "高质量多语言翻译",
                    },
                    {
                      name: "文档格式化工具",
                      icon: "https://via.placeholder.com/40",
                      description: "生成统一格式的文档",
                    },
                  ]}
                  usageCount={764}
                  category="文档处理"
                />
              </div>

              <div className="mt-6 flex justify-center">
                <Button variant="outline">查看更多推荐</Button>
              </div>
            </TabsContent>

            <TabsContent value="popular" className="mt-0">
              <div className="space-y-6">
                <PluginFlowCard
                  title="图像处理与优化流程"
                  description="批量处理图像，进行优化和格式转换，最后生成适合网页使用的图像资源。"
                  plugins={[
                    {
                      name: "图像批处理工具",
                      icon: "https://via.placeholder.com/40",
                      description: "批量处理多张图像",
                    },
                    {
                      name: "图像增强器",
                      icon: "https://via.placeholder.com/40",
                      description: "提高图像质量和清晰度",
                    },
                    {
                      name: "图像格式转换器",
                      icon: "https://via.placeholder.com/40",
                      description: "转换为适合网页的格式",
                    },
                  ]}
                  usageCount={1568}
                  category="图像处理"
                />

                <PluginFlowCard
                  title="代码审查与优化流程"
                  description="分析代码质量，检测潜在问题，并提供优化建议，提高代码可维护性。"
                  plugins={[
                    {
                      name: "代码质量分析器",
                      icon: "https://via.placeholder.com/40",
                      description: "分析代码结构和质量",
                    },
                    {
                      name: "Bug检测工具",
                      icon: "https://via.placeholder.com/40",
                      description: "检测潜在错误和安全问题",
                    },
                    {
                      name: "代码优化助手",
                      icon: "https://via.placeholder.com/40",
                      description: "提供性能和可读性优化建议",
                    },
                  ]}
                  usageCount={1342}
                  category="开发工具"
                />
              </div>
            </TabsContent>

            <TabsContent value="recent" className="mt-0">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无最近使用记录</h3>
                <p className="text-gray-500 max-w-md mb-6">
                  部署插件组合后，您的使用记录将显示在这里，方便您快速访问常用工作流。
                </p>
                <Button>浏览推荐组合</Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Visual Flow Diagram */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">部署路径可视图</h2>
              <Button variant="outline" size="sm">
                查看更多
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                  <p className="text-gray-500 mb-4">选择插件组合后，将显示详细的部署路径图</p>
                  <Button>选择插件组合</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Custom Combination */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">创建自定义组合</h2>
            </div>

            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600 mb-4">根据您的特定需求，创建自定义插件组合，并保存为工作流。</p>
                <div className="flex justify-center">
                  <Button>开始创建</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-1/3">
          {/* Plugin Categories */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">插件分类</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <PluginCategoryCard
                  title="数据处理"
                  description="数据清洗、转换和分析"
                  icon={<Database className="h-6 w-6 text-blue-600" />}
                  count={48}
                />

                <PluginCategoryCard
                  title="内容创作"
                  description="文本生成和编辑工具"
                  icon={<FileText className="h-6 w-6 text-blue-600" />}
                  count={36}
                />

                <PluginCategoryCard
                  title="图像处理"
                  description="图像编辑和优化工具"
                  icon={<ImageIcon className="h-6 w-6 text-blue-600" />}
                  count={24}
                />

                <PluginCategoryCard
                  title="开发工具"
                  description="代码分析和开发辅助"
                  icon={<Code className="h-6 w-6 text-blue-600" />}
                  count={32}
                />
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" className="w-full text-blue-600">
                查看全部分类
              </Button>
            </CardFooter>
          </Card>

          {/* Usage Statistics */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">使用统计</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">已部署组合</span>
                  <span className="font-medium">8个</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">本月部署次数</span>
                  <span className="font-medium">24次</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">最常用组合</span>
                  <span className="font-medium">数据处理流程</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">节省时间</span>
                  <span className="font-medium text-green-600">约12小时/周</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">使用技巧</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">一键部署多个插件</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      使用插件组合可以一次性部署多个相关插件，自动配置它们之间的连接。
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Share2 className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">分享您的组合</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      创建自定义组合后，可以分享给团队成员或社区，帮助更多人提高效率。
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <BarChart className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">查看使用分析</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      在个人主页的"我的部署"中，可以查看各插件组合的使用情况和效率分析。
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" size="sm" className="w-full text-blue-600">
                查看更多技巧
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default NavigatorPage
