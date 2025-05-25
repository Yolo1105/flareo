"use client";
import { PluginDetailHeader } from "@/components/features/plugin/PluginDetailHeader";
import { PluginDetailTabs } from "@/components/features/plugin/PluginDetailTabs";
import { PluginDetailOverview } from "@/components/features/plugin/PluginDetailOverview";
import { PluginDetailSidebar } from "@/components/features/plugin/PluginDetailSidebar";
import { PluginDetailReviews } from "@/components/features/plugin/PluginDetailReviews";
import { PluginDetailGuide } from "@/components/features/plugin/PluginDetailGuide";
import { PluginDetailQA } from "@/components/features/plugin/PluginDetailQA";
import { PluginDetailChangelog } from "@/components/features/plugin/PluginDetailChangelog";
import { PluginDetailSpecs } from "@/components/features/plugin/PluginDetailSpecs";

// 模拟数据
const mockPlugin = {
  id: "1",
  name: "数据可视化工具包",
  icon: "/placeholder.svg",
  developer: {
    name: "张三工作室",
    avatar: "/placeholder.svg",
    website: "https://example.com",
  },
  category: "前端组件",
  rating: 4.2,
  reviewCount: 125,
  installCount: 1500,
  version: "2.1.0",
  updatedAt: "2024-03-18",
  tags: ["数据可视化", "图表", "仪表盘", "React", "JavaScript"],
  price: 99,
};

const mockTabs = [
  { id: "overview", label: "概述" },
  { id: "guide", label: "使用指南" },
  { id: "reviews", label: "评价", count: 125 },
  { id: "qa", label: "问答", count: 15 },
  { id: "changelog", label: "更新日志" },
  { id: "specs", label: "技术规格" },
];

const mockOverviewData = {
  description:
    "这是一个功能强大的数据可视化工具包，专为现代Web应用设计。它提供了一系列高度可定制的图表组件，帮助开发者轻松创建美观、交互式的仪表盘和数据报告。无论您是需要展示复杂的业务数据，还是监控实时系统指标，这个工具包都能满足您的需求。",
  features: [
    "支持多种图表类型：折线图、柱状图、饼图、散点图、雷达图等。",
    "高度可定制：提供丰富的配置选项，轻松调整样式、颜色和布局。",
    "交互式体验：支持缩放、平移、提示框、图例交互等。",
    "响应式设计：图表自动适应不同屏幕尺寸。",
    "性能优化：采用高效渲染技术，处理大规模数据集。",
    "易于集成：提供清晰的API和文档，支持React、Vue等主流框架。",
    "数据源灵活：支持JSON、CSV等多种数据格式。",
  ],
  useCases: [
    "业务智能（BI）仪表盘",
    "实时监控系统",
    "数据分析报告",
    "金融数据展示",
    "物联网数据可视化",
  ],
  screenshots: [
    {
      url: "https://via.placeholder.com/400x225/aabbcc/ffffff?text=Screenshot+1",
      alt: "截图1",
    },
    {
      url: "https://via.placeholder.com/400x225/ddeeff/000000?text=Screenshot+2",
      alt: "截图2",
    },
    {
      url: "https://via.placeholder.com/400x225/eeccaa/ffffff?text=Video+Demo",
      alt: "视频演示",
    },
  ],
};

const mockPricingOptions = [
  {
    id: "basic",
    name: "基础版",
    price: 99,
    description: "适合个人开发者和小型项目",
  },
  {
    id: "pro",
    name: "专业版",
    price: 299,
    description: "适合中型团队和商业项目",
  },
  {
    id: "enterprise",
    name: "企业版",
    price: 999,
    description: "适合大型企业和复杂项目",
  },
];

// 添加评价系统的模拟数据
const mockReviewsData = {
  averageRating: 4.2,
  totalReviews: 125,
  ratingDistribution: [
    { rating: 5, count: 75, percentage: 60 },
    { rating: 4, count: 30, percentage: 24 },
    { rating: 3, count: 12, percentage: 10 },
    { rating: 2, count: 5, percentage: 4 },
    { rating: 1, count: 3, percentage: 2 },
  ],
  reviews: [
    {
      id: "1",
      author: {
        name: "李四",
        avatar: "/placeholder.svg",
      },
      rating: 5,
      content: "非常好用的插件，界面美观，功能强大，文档也很详细。",
      date: "2024-03-15",
      reply: {
        content: "感谢您的评价，我们会继续努力提供更好的服务！",
        date: "2024-03-16",
      },
    },
    {
      id: "2",
      author: {
        name: "王五",
        avatar: "/placeholder.svg",
      },
      rating: 4,
      content: "功能很实用，但是希望能增加更多的自定义选项。",
      date: "2024-03-14",
    },
    {
      id: "3",
      author: {
        name: "赵六",
        avatar: "/placeholder.svg",
      },
      rating: 5,
      content: "性能很好，处理大量数据时也很流畅。",
      date: "2024-03-13",
    },
  ],
};

// 添加使用指南的模拟数据
const mockGuideData = {
  sections: [
    {
      title: "快速开始",
      content: "首先，您需要安装并配置插件。以下是基本步骤：",
      code: `npm install @your-plugin/data-visualization

// 在您的应用中导入
import { Chart } from '@your-plugin/data-visualization';`,
    },
    {
      title: "基本用法",
      content: "创建一个简单的折线图：",
      code: `const data = {
  labels: ['一月', '二月', '三月', '四月', '五月'],
  datasets: [{
    label: '销售额',
    data: [12, 19, 3, 5, 2]
  }]
};

<Chart type="line" data={data} />`,
    },
    {
      title: "自定义样式",
      content: "您可以通过配置选项来自定义图表的外观：",
      code: `const options = {
  theme: 'dark',
  colors: ['#FF6384', '#36A2EB', '#FFCE56'],
  animations: true
};

<Chart type="bar" data={data} options={options} />`,
    },
  ],
};

// 添加问答的模拟数据
const mockQAData = {
  questions: [
    {
      id: "1",
      author: {
        name: "张三",
        avatar: "/placeholder.svg",
      },
      title: "如何处理大数据集的性能问题？",
      content: "我的数据集包含超过10000个数据点，图表渲染很慢，有什么优化建议吗？",
      date: "2024-03-15",
      answers: [
        {
          id: "1-1",
          author: {
            name: "开发者",
            avatar: "/placeholder.svg",
            isDeveloper: true,
          },
          content: "建议使用数据采样或聚合功能，可以显著提升性能。另外，确保启用了虚拟滚动功能。",
          date: "2024-03-16",
        },
      ],
    },
    {
      id: "2",
      author: {
        name: "李四",
        avatar: "/placeholder.svg",
      },
      title: "如何自定义图例样式？",
      content: "我想修改图例的位置和样式，应该怎么做？",
      date: "2024-03-14",
      answers: [
        {
          id: "2-1",
          author: {
            name: "王五",
            avatar: "/placeholder.svg",
            isDeveloper: false,
          },
          content: "可以通过 options.legend 配置项来自定义图例，例如：options.legend = { position: 'right', style: { ... } }",
          date: "2024-03-14",
        },
      ],
    },
  ],
};

// 添加更新日志的模拟数据
const mockChangelogData = {
  entries: [
    {
      version: "2.1.0",
      date: "2024-03-18",
      changes: [
        {
          type: "feature" as const,
          description: "新增雷达图组件",
        },
        {
          type: "improvement" as const,
          description: "优化大数据集渲染性能",
        },
        {
          type: "fix" as const,
          description: "修复图例样式在某些主题下的显示问题",
        },
      ],
    },
    {
      version: "2.0.0",
      date: "2024-02-15",
      changes: [
        {
          type: "breaking" as const,
          description: "重构核心渲染引擎，提升性能",
        },
        {
          type: "feature" as const,
          description: "新增主题系统",
        },
        {
          type: "feature" as const,
          description: "支持自定义动画效果",
        },
      ],
    },
  ],
};

// 添加技术规格的模拟数据
const mockSpecsData = {
  categories: [
    {
      title: "基本要求",
      items: [
        {
          name: "框架版本",
          value: "React 16.8+ / Vue 3.0+",
        },
        {
          name: "浏览器支持",
          value: "Chrome 80+, Firefox 75+, Safari 13+",
        },
        {
          name: "包大小",
          value: "核心包 120KB (gzipped)",
        },
      ],
    },
    {
      title: "性能指标",
      items: [
        {
          name: "渲染性能",
          value: "支持 10,000+ 数据点",
        },
        {
          name: "内存占用",
          value: "平均 5MB",
        },
        {
          name: "首次加载时间",
          value: "< 100ms",
        },
      ],
    },
    {
      title: "开发工具",
      items: [
        {
          name: "TypeScript 支持",
          value: "完整类型定义",
        },
        {
          name: "开发文档",
          value: "API 文档 + 示例",
        },
        {
          name: "调试工具",
          value: "内置性能分析器",
        },
      ],
    },
  ],
};

export default function PluginDetailPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PluginDetailHeader plugin={mockPlugin} />

      <div className="h-8" />

      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 主要内容区 */}
          <div className="flex-1">
            <PluginDetailTabs tabs={mockTabs}>
              <PluginDetailOverview {...mockOverviewData} />
              <PluginDetailGuide {...mockGuideData} />
              <PluginDetailReviews {...mockReviewsData} />
              <PluginDetailQA {...mockQAData} />
              <PluginDetailChangelog {...mockChangelogData} />
              <PluginDetailSpecs {...mockSpecsData} />
            </PluginDetailTabs>
          </div>

          {/* 侧边栏 */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <PluginDetailSidebar
              pricingOptions={mockPricingOptions}
              developer={mockPlugin.developer}
              onSelectPricing={(id) => console.log("Selected pricing:", id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 