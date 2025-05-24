import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function TopicsPage() {
  const allTopics = [
    { name: "部署失败", count: 42 },
    { name: "插件推荐", count: 38 },
    { name: "性能优化", count: 27 },
    { name: "数据处理", count: 24 },
    { name: "API集成", count: 19 },
    { name: "文档翻译", count: 15 },
    { name: "自动化", count: 12 },
    { name: "安全问题", count: 10 },
    { name: "UI设计", count: 8 },
    { name: "代码审查", count: 7 },
    { name: "测试工具", count: 6 },
    { name: "部署流程", count: 5 },
    { name: "版本控制", count: 5 },
    { name: "数据可视化", count: 4 },
    { name: "插件开发", count: 4 },
    { name: "用户体验", count: 3 },
    { name: "多语言支持", count: 3 },
    { name: "移动适配", count: 2 },
    { name: "插件兼容性", count: 2 },
    { name: "云服务集成", count: 2 },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">所有话题标签</h1>
        <p className="text-gray-600 mt-1">浏览社区中的所有话题标签，点击标签查看相关讨论</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allTopics.map((topic, index) => (
          <Link key={index} href={`/community?tag=${topic.name}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center justify-between">
                  <span>#{topic.name}</span>
                  <Badge variant="secondary" className="bg-gray-100">
                    {topic.count}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">查看关于 {topic.name} 的所有讨论和问题</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Link href="/community">
          <Button variant="outline">返回社区首页</Button>
        </Link>
      </div>
    </div>
  )
}
