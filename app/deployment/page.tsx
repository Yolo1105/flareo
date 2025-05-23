import Image from "next/image"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function PluginDeployment() {
  return (
    <>
      <Navbar />
      <main className="container" style={{ paddingTop: "var(--spacing-6)", paddingBottom: "var(--spacing-6)" }}>
        {/* 部署头部信息 */}
        <div className="deployment-header">
          <Image
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80"
            alt="API 网关"
            className="deployment-image"
            width={80}
            height={80}
          />

          <div className="deployment-info">
            <h1 className="deployment-title">部署 API 网关</h1>
            <div className="deployment-meta">
              <span>
                <i className="ri-user-line"></i> 开发者: CloudNative
              </span>
              <span>
                <i className="ri-price-tag-3-line"></i> 免费
              </span>
              <span>
                <i className="ri-star-fill"></i> 4.0 (125 评价)
              </span>
              <span>
                <i className="ri-download-line"></i> 3.5k 部署
              </span>
            </div>
          </div>
        </div>

        {/* 部署步骤 */}
        <div className="deployment-steps">
          <div className="steps">
            <div className="step completed">
              <div className="step-number">1</div>
              <div className="step-label">选择部署方式</div>
            </div>
            <div className="step active">
              <div className="step-number">2</div>
              <div className="step-label">配置参数</div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-label">确认部署</div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-label">完成</div>
            </div>
          </div>
        </div>

        {/* 部署内容 */}
        <div className="deployment-content">
          <div className="deployment-main">
            <div className="deployment-method">
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "var(--spacing-4)" }}>选择部署方式</h2>

              <div className="method-options">
                <div className="method-option selected">
                  <div className="method-icon">
                    <i className="ri-docker-fill"></i>
                  </div>
                  <div className="method-title">Docker Compose</div>
                  <div className="method-description">使用 Docker Compose 快速部署</div>
                </div>

                <div className="method-option">
                  <div className="method-icon">
                    <i className="ri-ship-line"></i>
                  </div>
                  <div className="method-title">Kubernetes</div>
                  <div className="method-description">使用 Helm Chart 部署</div>
                </div>

                <div className="method-option">
                  <div className="method-icon">
                    <i className="ri-code-box-line"></i>
                  </div>
                  <div className="method-title">二进制部署</div>
                  <div className="method-description">直接下载二进制文件</div>
                </div>

                <div className="method-option">
                  <div className="method-icon">
                    <i className="ri-cloud-line"></i>
                  </div>
                  <div className="method-title">云服务集成</div>
                  <div className="method-description">与云服务提供商集成</div>
                </div>
              </div>
            </div>

            <div className="config-form">
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "var(--spacing-4)" }}>配置参数</h2>

              <div className="form-group">
                <label className="form-label">部署名称</label>
                <input type="text" className="form-control" defaultValue="api-gateway-prod" />
                <span className="form-hint">用于标识此次部署的唯一名称</span>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">版本</label>
                  <select className="form-control">
                    <option>v2.5.0 (最新)</option>
                    <option>v2.4.2</option>
                    <option>v2.3.0</option>
                    <option>v2.2.1</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">端口</label>
                  <input type="number" className="form-control" defaultValue="8080" />
                  <span className="form-hint">API 网关监听的端口</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">环境变量</label>
                <div style={{ display: "flex", gap: "var(--spacing-2)", marginBottom: "var(--spacing-2)" }}>
                  <input type="text" className="form-control" placeholder="键" defaultValue="LOG_LEVEL" />
                  <input type="text" className="form-control" placeholder="值" defaultValue="info" />
                  <button className="btn btn-outline" style={{ flexShrink: 0 }}>
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
                <div style={{ display: "flex", gap: "var(--spacing-2)", marginBottom: "var(--spacing-2)" }}>
                  <input type="text" className="form-control" placeholder="键" defaultValue="ENABLE_METRICS" />
                  <input type="text" className="form-control" placeholder="值" defaultValue="true" />
                  <button className="btn btn-outline" style={{ flexShrink: 0 }}>
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
                <div style={{ display: "flex", gap: "var(--spacing-2)" }}>
                  <input type="text" className="form-control" placeholder="键" />
                  <input type="text" className="form-control" placeholder="值" />
                  <button className="btn btn-outline" style={{ flexShrink: 0 }}>
                    <i className="ri-add-line"></i>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">配置文件</label>
                <div className="code-editor">
                  {`# API 网关配置
server:
  port: 8080
  timeout: 30s

routes:
  - path: "/api/users"
    methods: ["GET", "POST"]
    backend: "http://user-service:8000"
    auth: true
    
  - path: "/api/products"
    methods: ["GET"]
    backend: "http://product-service:8001"
    auth: false
    rate_limit: 100

auth:
  type: "jwt"
  secret: "\${JWT_SECRET}"
  header: "Authorization"
  
logging:
  level: "\${LOG_LEVEL}"
  format: "json"`}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">高级选项</label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--spacing-2)",
                    marginBottom: "var(--spacing-2)",
                  }}
                >
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                  <span>启用健康检查</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--spacing-2)",
                    marginBottom: "var(--spacing-2)",
                  }}
                >
                  <label className="switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                  <span>启用自动重启</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
                  <label className="switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                  </label>
                  <span>生成个性化镜像</span>
                </div>
              </div>
            </div>

            <div className="deployment-actions">
              <button className="btn btn-outline">
                <i className="ri-arrow-left-line"></i>
                上一步
              </button>
              <button className="btn btn-primary">
                下一步
                <i className="ri-arrow-right-line"></i>
              </button>
            </div>
          </div>

          <div className="deployment-sidebar">
            <div className="sidebar-card">
              <h3 className="sidebar-title">
                <i className="ri-information-line sidebar-icon"></i>
                部署摘要
              </h3>

              <div className="deployment-summary">
                <div className="summary-item">
                  <div className="summary-label">插件</div>
                  <div className="summary-value">API 网关</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">版本</div>
                  <div className="summary-value">v2.5.0</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">部署方式</div>
                  <div className="summary-value">Docker Compose</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">端口</div>
                  <div className="summary-value">8080</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">环境变量</div>
                  <div className="summary-value">2 个</div>
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <button className="btn btn-primary" style={{ width: "100%" }}>
                  <i className="ri-download-cloud-line"></i>
                  确认部署
                </button>
              </div>
            </div>

            <div className="sidebar-card">
              <h3 className="sidebar-title">
                <i className="ri-history-line sidebar-icon"></i>
                部署历史
              </h3>

              <div className="deployment-history">
                <div className="history-item">
                  <div className="history-icon">
                    <i className="ri-check-line"></i>
                  </div>
                  <div className="history-content">
                    <div className="history-title">API 网关 v2.4.2</div>
                    <div className="history-meta">
                      <div>2025-04-10</div>
                      <div className="deployment-status status-running">运行中</div>
                    </div>
                  </div>
                </div>

                <div className="history-item">
                  <div className="history-icon">
                    <i className="ri-stop-line"></i>
                  </div>
                  <div className="history-content">
                    <div className="history-title">API 网关 v2.3.0</div>
                    <div className="history-meta">
                      <div>2025-03-15</div>
                      <div className="deployment-status status-stopped">已停止</div>
                    </div>
                  </div>
                </div>

                <div className="history-item">
                  <div className="history-icon">
                    <i className="ri-error-warning-line"></i>
                  </div>
                  <div className="history-content">
                    <div className="history-title">API 网关 v2.2.1</div>
                    <div className="history-meta">
                      <div>2025-02-20</div>
                      <div className="deployment-status status-failed">部署失败</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sidebar-card">
              <h3 className="sidebar-title">
                <i className="ri-key-2-line sidebar-icon"></i>
                访问凭证
              </h3>

              <div className="token-card">
                <div className="token-header">
                  <div className="token-title">API 密钥</div>
                  <div style={{ fontSize: "0.875rem", color: "var(--secondary-color)" }}>活跃</div>
                </div>
                <div className="token-value">sk_live_51NxXa...7UZrD</div>
                <div className="token-actions">
                  <button className="btn btn-sm btn-outline">
                    <i className="ri-eye-line"></i>
                    显示
                  </button>
                  <button className="btn btn-sm btn-outline">
                    <i className="ri-file-copy-line"></i>
                    复制
                  </button>
                  <button className="btn btn-sm btn-outline">
                    <i className="ri-refresh-line"></i>
                    刷新
                  </button>
                </div>
                <div className="token-meta">
                  <div>创建于: 2025-04-10</div>
                  <div>最后使用: 今天</div>
                </div>
              </div>

              <button className="btn btn-outline" style={{ width: "100%" }}>
                <i className="ri-add-line"></i>
                创建新凭证
              </button>
            </div>

            <div className="sidebar-card">
              <h3 className="sidebar-title">
                <i className="ri-dashboard-3-line sidebar-icon"></i>
                资源使用情况
              </h3>

              <div className="resource-usage">
                <div className="usage-item">
                  <div className="usage-header">
                    <div className="usage-label">CPU</div>
                    <div className="usage-value">35% / 100%</div>
                  </div>
                  <div className="usage-bar">
                    <div className="usage-fill" style={{ width: "35%" }}></div>
                  </div>
                </div>

                <div className="usage-item">
                  <div className="usage-header">
                    <div className="usage-label">内存</div>
                    <div className="usage-value">512MB / 1GB</div>
                  </div>
                  <div className="usage-bar">
                    <div className="usage-fill" style={{ width: "50%" }}></div>
                  </div>
                </div>

                <div className="usage-item">
                  <div className="usage-header">
                    <div className="usage-label">存储</div>
                    <div className="usage-value">2.1GB / 5GB</div>
                  </div>
                  <div className="usage-bar">
                    <div className="usage-fill" style={{ width: "42%" }}></div>
                  </div>
                </div>

                <div className="usage-item">
                  <div className="usage-header">
                    <div className="usage-label">带宽</div>
                    <div className="usage-value">75GB / 100GB</div>
                  </div>
                  <div className="usage-bar">
                    <div className="usage-fill warning" style={{ width: "75%" }}></div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "center", marginTop: "var(--spacing-3)" }}>
                <button className="btn btn-outline">
                  <i className="ri-line-chart-line"></i>
                  查看详细监控
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
