import type React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Calendar, User, ThumbsUp, MessageSquare, Share2 } from "lucide-react"

interface ContestCardProps {
  title: string
  description: string
  image: string
  startDate: string
  endDate: string
  participants: number
  prizes: string[]
  status: "upcoming" | "active" | "ended"
}

const ContestCard: React.FC<ContestCardProps> = ({
  title,
  description,
  image,
  startDate,
  endDate,
  participants,
  prizes,
  status,
}) => {
  const statusColors = {
    upcoming: "bg-amber-100 text-amber-800",
    active: "bg-green-100 text-green-800",
    ended: "bg-gray-100 text-gray-800",
  }

  const statusLabels = {
    upcoming: "即将开始",
    active: "进行中",
    ended: "已结束",
  }

  return (
    <Card className="mb-6 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        <img src={image || "/placeholder.svg"} alt={title} className="w-full h-48 object-cover" />
        <Badge className={`absolute top-3 right-3 ${statusColors[status]}`}>{statusLabels[status]}</Badge>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold hover:text-blue-600 cursor-pointer">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">{description}</p>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-gray-500" />
            <span className="text-gray-700">开始: {startDate}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-gray-500" />
            <span className="text-gray-700">结束: {endDate}</span>
          </div>
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1 text-gray-500" />
            <span className="text-gray-700">参与: {participants}人</span>
          </div>
          <div className="flex items-center">
            <Trophy className="h-4 w-4 mr-1 text-amber-500" />
            <span className="text-gray-700">奖项: {prizes.length}个</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium text-gray-700">奖励:</div>
          <div className="flex flex-wrap gap-2">
            {prizes.map((prize, index) => (
              <Badge key={index} className="bg-amber-50 text-amber-700 border border-amber-200">
                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏅"} {prize}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between border-t border-gray-100">
        {status === "active" && <Button>立即参与</Button>}
        {status === "upcoming" && <Button variant="outline">提醒我</Button>}
        {status === "ended" && <Button variant="outline">查看获奖作品</Button>}
        <Button variant="ghost">了解详情</Button>
      </CardFooter>
    </Card>
  )
}

interface SubmissionCardProps {
  title: string
  author: {
    name: string
    avatar: string
  }
  image: string
  description: string
  likes: number
  comments: number
  ranking?: number
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({
  title,
  author,
  image,
  description,
  likes,
  comments,
  ranking,
}) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        <img src={image || "/placeholder.svg"} alt={title} className="w-full h-40 object-cover" />
        {ranking && (
          <div
            className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
            style={{
              backgroundColor:
                ranking === 1 ? "#FFD700" : ranking === 2 ? "#C0C0C0" : ranking === 3 ? "#CD7F32" : "#6B7280",
            }}
          >
            {ranking}
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold hover:text-blue-600 cursor-pointer">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{description}</p>
        <div className="flex items-center space-x-2">
          <img src={author.avatar || "/placeholder.svg"} alt={author.name} className="w-6 h-6 rounded-full" />
          <span className="text-sm text-gray-700">{author.name}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex items-center justify-between text-sm border-t border-gray-100">
        <div className="flex space-x-4">
          <button className="flex items-center text-gray-500 hover:text-gray-700">
            <ThumbsUp className="h-4 w-4 mr-1" />
            <span>{likes}</span>
          </button>
          <button className="flex items-center text-gray-500 hover:text-gray-700">
            <MessageSquare className="h-4 w-4 mr-1" />
            <span>{comments}</span>
          </button>
        </div>
        <button className="flex items-center text-gray-500 hover:text-gray-700">
          <Share2 className="h-4 w-4 mr-1" />
          <span>分享</span>
        </button>
      </CardFooter>
    </Card>
  )
}

const ContestPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">极客演武场</h1>
        <p className="text-gray-600 mt-1">参与插件开发竞赛，展示您的创意和技术，赢取丰厚奖励</p>
      </div>

      <div className="max-w-7xl mx-auto mb-10">
        <Tabs defaultValue="active" className="mb-8">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="active">进行中</TabsTrigger>
            <TabsTrigger value="upcoming">即将开始</TabsTrigger>
            <TabsTrigger value="past">往期竞赛</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ContestCard
                title="AI辅助工具创新挑战赛"
                description="设计并开发创新的AI辅助工具插件，提升用户工作效率和创造力。参赛作品将由专业评委和社区用户共同评选。"
                image="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                startDate="2025-05-01"
                endDate="2025-06-15"
                participants={128}
                prizes={["¥20,000", "¥10,000", "¥5,000", "¥2,000"]}
                status="active"
              />

              <ContestCard
                title="数据可视化创意大赛"
                description="打造创新的数据可视化插件，帮助用户更直观地理解和分析数据。要求美观实用，支持多种数据源和自定义配置。"
                image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                startDate="2025-04-15"
                endDate="2025-05-30"
                participants={96}
                prizes={["¥15,000", "¥8,000", "¥3,000"]}
                status="active"
              />
            </div>

            <div className="mt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">热门参赛作品</h2>
                <Button variant="outline">查看全部</Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-items-center">
                <div className="w-full max-w-xs">
                  <SubmissionCard
                    title="智能文档助手"
                    author={{
                      name: "王小明",
                      avatar:
                        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                    }}
                    image="https://images.unsplash.com/photo-1555421689-3f034debb7a6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                    description="自动分析文档结构，提取关键信息，生成摘要，并提供智能编辑建议。"
                    likes={86}
                    comments={24}
                    ranking={1}
                  />
                </div>
                <div className="w-full max-w-xs">
                  <SubmissionCard
                    title="多模态AI创作工具"
                    author={{
                      name: "李小华",
                      avatar:
                        "https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                    }}
                    image="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                    description="结合文本、图像和音频生成能力，一站式创作多媒体内容。"
                    likes={72}
                    comments={18}
                    ranking={2}
                  />
                </div>
                <div className="w-full max-w-xs">
                  <SubmissionCard
                    title="代码智能助手"
                    author={{
                      name: "张大明",
                      avatar:
                        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                    }}
                    image="https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                    description="实时代码分析、错误检测、性能优化建议，支持多种编程语言。"
                    likes={65}
                    comments={15}
                    ranking={3}
                  />
                </div>
                <div className="w-full max-w-xs">
                  <SubmissionCard
                    title="数据故事生成器"
                    author={{
                      name: "赵小红",
                      avatar:
                        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                    }}
                    image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                    description="将枯燥的数据转化为引人入胜的可视化故事，自动生成洞察和解释。"
                    likes={58}
                    comments={12}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ContestCard
                title="插件性能优化挑战赛"
                description="针对现有插件进行性能优化，提高运行速度、降低资源消耗。参赛者可以选择平台上的开源插件进行优化。"
                image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                startDate="2025-07-01"
                endDate="2025-08-15"
                participants={64}
                prizes={["¥18,000", "¥9,000", "¥4,500"]}
                status="upcoming"
              />

              <ContestCard
                title="跨平台插件开发大赛"
                description="开发能够在多个平台无缝运行的插件，提供一致的用户体验。重点考察兼容性设计和适配能力。"
                image="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                startDate="2025-06-20"
                endDate="2025-08-05"
                participants={82}
                prizes={["¥25,000", "¥12,000", "¥6,000", "¥3,000"]}
                status="upcoming"
              />
            </div>
          </TabsContent>

          <TabsContent value="past" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ContestCard
                title="智能办公插件创新赛"
                description="开发提升办公效率的创新插件，包括文档处理、日程管理、团队协作等方向。"
                image="https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                startDate="2025-01-15"
                endDate="2025-03-01"
                participants={156}
                prizes={["¥30,000", "¥15,000", "¥8,000", "¥4,000", "¥2,000"]}
                status="ended"
              />

              <ContestCard
                title="教育类插件开发大赛"
                description="开发面向教育领域的创新插件，包括学习辅助、知识管理、教学工具等方向。"
                image="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1722&q=80"
                startDate="2024-11-01"
                endDate="2024-12-15"
                participants={124}
                prizes={["¥20,000", "¥10,000", "¥5,000"]}
                status="ended"
              />
            </div>

            <div className="mt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">往期获奖作品</h2>
                <Button variant="outline">查看全部</Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SubmissionCard
                  title="智能会议助手"
                  author={{
                    name: "陈明亮",
                    avatar:
                      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  }}
                  image="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
                  description="自动记录会议内容，生成会议纪要，提取行动项，并进行任务分配。"
                  likes={124}
                  comments={36}
                  ranking={1}
                />

                <SubmissionCard
                  title="个性化学习路径生成器"
                  author={{
                    name: "林小雨",
                    avatar:
                      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
                  }}
                  image="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1722&q=80"
                  description="基于学习者能力和目标，自动生成个性化学习路径和资源推荐。"
                  likes={108}
                  comments={29}
                  ranking={2}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-shrink-0">
            <Trophy className="h-12 w-12 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">参与竞赛，展示您的才华</h2>
            <p className="text-blue-700 mb-4">
              极客演武场为开发者提供展示创意和技术的平台，获奖作品将获得推广和奖励，并有机会被平台收录。
            </p>
            <div className="flex flex-wrap gap-3">
              <Button>查看竞赛规则</Button>
              <Button variant="outline">历届获奖作品</Button>
            </div>
          </div>
          <div className="hidden lg:block w-1/4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-700 mb-1">¥100,000+</div>
              <div className="text-sm text-blue-600">年度总奖金池</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-10 max-w-7xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">竞赛日历</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">AI辅助工具创新挑战赛</h3>
                <p className="text-sm text-gray-500 mt-1">2025-05-01 至 2025-06-15</p>
                <Badge className="mt-2 bg-green-100 text-green-800">进行中</Badge>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">跨平台插件开发大赛</h3>
                <p className="text-sm text-gray-500 mt-1">2025-06-20 至 2025-08-05</p>
                <Badge className="mt-2 bg-amber-100 text-amber-800">即将开始</Badge>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">插件性能优化挑战赛</h3>
                <p className="text-sm text-gray-500 mt-1">2025-07-01 至 2025-08-15</p>
                <Badge className="mt-2 bg-blue-100 text-blue-800">报名即将开始</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">常见问题</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">如何参与竞赛？</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                在竞赛页面点击"立即参与"按钮，填写报名信息并提交。报名成功后，您可以在竞赛截止日期前提交您的作品。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">评选标准是什么？</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                评选标准包括创新性、实用性、技术实现、用户体验和完成度。每个竞赛可能有特定的评分权重，详见竞赛规则。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">获奖作品有什么福利？</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                除了奖金外，获奖作品将获得平台首页推荐、技术博客专访、优先上架资格，以及与企业合作的机会。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">团队可以参赛吗？</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                可以，团队参赛需要指定一名队长负责报名和联络。团队成员数量通常限制在5人以内，具体以竞赛规则为准。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ContestPage
