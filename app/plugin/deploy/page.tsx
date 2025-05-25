import { DeploymentPage } from "@/components/plugin-deploy/deployment-page"

export const metadata = {
  title: "部署插件 - Plugin Hub",
  description: "部署您的插件到 Plugin Hub 平台",
}

export default function DeployPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">部署插件：数据可视化工具包</h1>
          <p className="text-muted-foreground">按照以下步骤配置和部署您的插件实例。</p>
        </div>
        <DeploymentPage />
      </main>
    </div>
  )
} 