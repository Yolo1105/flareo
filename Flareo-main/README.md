# Flareo

## 项目结构

```
Flareo/
├── app/                    # Next.js 13+ App Router
│   ├── explore/           # 探索页面
│   ├── topics/           # 话题页面
│   ├── post/             # 帖子页面
│   ├── navigator/        # 导航页面
│   ├── crowdsourcing/    # 众包页面
│   ├── create-post/      # 创建帖子页面
│   ├── contest/          # 竞赛页面
│   ├── community/        # 社区页面
│   ├── profile/          # 个人资料页面
│   ├── plugin/           # 插件页面
│   └── deployment/       # 部署页面
├── components/           # 共享组件
├── lib/                 # 工具函数和共享逻辑
├── hooks/               # 自定义 React Hooks
├── public/             # 静态资源
├── styles/             # 全局样式
├── types/              # TypeScript 类型定义
├── config/             # 配置文件
├── utils/              # 工具函数
└── constants/          # 常量定义
```

## 开发指南

### 环境要求
- Node.js 18+
- pnpm

### 安装依赖
```bash
pnpm install
```

### 开发环境运行
```bash
pnpm dev
```

### 构建生产版本
```bash
pnpm build
```

### 运行生产版本
```bash
pnpm start
```

## 技术栈
- Next.js 13+
- TypeScript
- Tailwind CSS
- React 