import Image from "next/image"
import Link from "next/link"

export default function PluginDetail() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "var(--spacing-6)" }}>
        <div>
          {/* 探索头部信息 */}
          <section className="explore-header">
            <Image
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80"
              alt="API 网关"
              className="explore-image"
              width={120}
              height={120}
            />

            <div className="explore-info">
              <h1 className="explore-title">API 网关</h1>

              <div className="explore-meta">
                <div className="explore-meta-item">
                  <i className="ri-user-line explore-meta-icon"></i>由{" "}
                  <Link href="#" className="text-primary">
                    Flareo 团队
                  </Link>
                  开发
                </div>
                <div className="explore-meta-item">
                  <i className="ri-calendar-line explore-meta-icon"></i>
                  最近更新: 2025-04-15
                </div>
                <div className="explore-meta-item">
                  <i className="ri-download-line explore-meta-icon"></i>
                  3.5k 部署
                </div>
                <div className="explore-meta-item">
                  <div className="rating">
                    <i className="ri-star-fill"></i>
                    <i className="ri-star-fill"></i>
                    <i className="ri-star-fill"></i>
                    <i className="ri-star-fill"></i>
                    <i className="ri-star-half-fill"></i>
                    <span className="ml-2">4.5</span>
                  </div>
                </div>
              </div>

              <div className="explore-tags">
                <div className="tag">API</div>
                <div className="tag">网关</div>
                <div className="tag">安全</div>
                <div className="tag">性能</div>
              </div>

              <div className="explore-actions">
                <button className="btn btn-primary">
                  <i className="ri-download-cloud-line"></i>
                  立即部署
                </button>
                <button className="btn btn-outline">
                  <i className="ri-book-open-line"></i>
                  查看文档
                </button>
              </div>
            </div>
          </section>

          {/* 内容标签页 */}
          <div className="content-tabs">
            <div className="content-tab active">概述</div>
            <div className="content-tab">部署方式</div>
            <div className="content-tab">技术规格</div>
            <div className="content-tab">评价 (125)</div>
          </div>

          {/* 概述内容 */}
          <section className="content-section">
            <p style={{ marginBottom: "var(--spacing-4)" }}>
              API 网关是一个轻量级的 API 管理工具，用于处理 API
              请求的路由、认证、限流和监控。它可以作为微服务架构中的入口点，统一管理所有的 API
              调用，提供安全控制和性能优化。
            </p>

            <p style={{ marginBottom: "var(--spacing-4)" }}>
              本插件基于 Go
              语言开发，具有高性能、低延迟的特点，适合各种规模的应用场景。无论是小型项目还是大型企业级应用，都可以通过简单的配置快速集成和部署。
            </p>

            <h2 className="content-title">主要功能</h2>

            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-icon">
                  <i className="ri-route-line"></i>
                </div>
                <div className="feature-content">
                  <h3 className="feature-title">请求路由</h3>
                  <p className="feature-description">
                    支持基于路径、方法、头部和查询参数的动态路由，轻松将请求转发到不同的后端服务。
                  </p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <i className="ri-shield-check-line"></i>
                </div>
                <div className="feature-content">
                  <h3 className="feature-title">认证与授权</h3>
                  <p className="feature-description">
                    内置多种认证机制，包括 API 密钥、JWT、OAuth2 等，确保 API 访问的安全性。
                  </p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <i className="ri-timer-line"></i>
                </div>
                <div className="feature-content">
                  <h3 className="feature-title">限流与熔断</h3>
                  <p className="feature-description">提供请求限流、并发控制和熔断机制，防止系统过载并提高稳定性。</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <i className="ri-dashboard-3-line"></i>
                </div>
                <div className="feature-content">
                  <h3 className="feature-title">监控与日志</h3>
                  <p className="feature-description">
                    实时监控 API 调用情况，记录详细日志，支持 Prometheus 和 Grafana 集成。
                  </p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <i className="ri-transform-line"></i>
                </div>
                <div className="feature-content">
                  <h3 className="feature-title">请求转换</h3>
                  <p className="feature-description">支持请求和响应的转换，包括头部修改、参数映射和响应格式化。</p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <i className="ri-file-list-3-line"></i>
                </div>
                <div className="feature-content">
                  <h3 className="feature-title">API 文档</h3>
                  <p className="feature-description">自动生成 OpenAPI 规范文档，提供交互式 API 浏览器。</p>
                </div>
              </div>
            </div>

            <h2 className="content-title">使用场景</h2>

            <ul style={{ paddingLeft: "var(--spacing-4)", marginBottom: "var(--spacing-4)" }}>
              <li style={{ marginBottom: "var(--spacing-2)" }}>
                <strong>微服务架构</strong>：作为微服务之间的通信中心，统一管理服务调用。
              </li>
              <li style={{ marginBottom: "var(--spacing-2)" }}>
                <strong>第三方 API 集成</strong>：整合多个第三方 API，提供统一的访问接口。
              </li>
              <li style={{ marginBottom: "var(--spacing-2)" }}>
                <strong>遗留系统现代化</strong>：为传统系统添加现代 API 层，实现渐进式升级。
              </li>
              <li style={{ marginBottom: "var(--spacing-2)" }}>
                <strong>多环境部署</strong>：在开发、测试和生产环境之间无缝切换 API 配置。
              </li>
              <li>
                <strong>安全防护</strong>：作为 API 安全的第一道防线，防止未授权访问和攻击。
              </li>
            </ul>

            <div
              style={{
                backgroundColor: "var(--neutral-50)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--spacing-4)",
                marginBottom: "var(--spacing-6)",
              }}
            >
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "var(--spacing-2)" }}>
                <i
                  className="ri-information-line"
                  style={{ color: "var(--primary-color)", marginRight: "var(--spacing-2)" }}
                ></i>
                注意事项
              </h3>
              <p style={{ marginBottom: 0, color: "var(--neutral-700)" }}>
                本插件需要 Docker 环境支持，建议在部署前确保服务器已安装 Docker 和 Docker
                Compose。对于高可用需求，可以考虑使用 Kubernetes 进行部署。
              </p>
            </div>
          </section>

          {/* 相关探索 */}
          <section className="related-explore">
            <h2 className="related-title">相关探索</h2>

            <div className="related-grid">
              <div className="card explore-card">
                <div className="explore-card-image">
                  <Image
                    src="https://images.unsplash.com/photo-1558655146-d09347e92766?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
                    alt="API 文档生成器"
                    width={250}
                    height={160}
                  />
                </div>
                <div className="explore-card-body">
                  <h3 className="explore-card-title">API 文档生成器</h3>
                  <p className="explore-card-description">自动从 API 定义生成交互式文档，支持 OpenAPI 规范。</p>
                  <div className="explore-card-meta">
                    <div className="explore-card-price">¥99 / 月</div>
                    <div className="rating">
                      <i className="ri-star-fill"></i>
                      <i className="ri-star-fill"></i>
                      <i className="ri-star-fill"></i>
                      <i className="ri-star-fill"></i>
                      <i className="ri-star-line"></i>
                      <span>4.0 (125 评价)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card explore-card">
                <div className="explore-card-image">
                  <Image
                    src="https://images.unsplash.com/photo-1489875347897-49f64b51c1f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                    alt="日志分析器"
                    width={250}
                    height={160}
                  />
                </div>
                <div className="explore-card-body">
                  <h3 className="explore-card-title">日志分析器</h3>
                  <p className="explore-card-description">实时处理和分析日志数据，自动检测异常并发送警报。</p>
                  <div className="explore-card-meta">
                    <div className="explore-card-price">¥129 / 月</div>
                    <div className="rating">
                      <i className="ri-star-fill"></i>
                      <i className="ri-star-fill"></i>
                      <i className="ri-star-fill"></i>
                      <i className="ri-star-fill"></i>
                      <i className="ri-star-half-fill"></i>
                      <span>4.5</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card explore-card">
                <div className="explore-card-image">
                  <Image
                    src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-1.2.1&auto=format&fit=crop&w=2034&q=80"
                    alt="安全扫描器"
                    width={250}
                    height={160}
                  />
                </div>
                <div className="explore-card-body">
                  <h3 className="explore-card-title">安全扫描器</h3>
                  <p className="explore-card-description">
                    全面的安全漏洞扫描工具，检测网站和应用程序中的潜在安全风险。
                  </p>
                  <div className="explore-card-meta">
                    <div className="explore-card-price">¥399 / 年</div>
                    <div className="rating">
                      <i className="ri-star-fill"></i>
                      <i className="ri-star-fill"></i>
                      <i className="ri-star-fill"></i>
                      <i className="ri-star-fill"></i>
                      <i className="ri-star-fill"></i>
                      <span>5.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div>
          {/* 侧边栏 */}
          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <i className="ri-download-cloud-line sidebar-icon"></i>
              快速部署
            </h3>

            <p style={{ marginBottom: "var(--spacing-3)", color: "var(--neutral-600)", fontSize: "0.875rem" }}>
              选择部署方式，立即使用 API 网关
            </p>

            <button className="btn btn-primary" style={{ width: "100%", marginBottom: "var(--spacing-2)" }}>
              <i className="ri-download-cloud-line"></i>
              立即部署
            </button>

            <button className="btn btn-outline" style={{ width: "100%" }}>
              <i className="ri-settings-3-line"></i>
              自定义配置
            </button>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <i className="ri-user-line sidebar-icon"></i>
              开发者信息
            </h3>

            <div className="developer-info">
              <Image
                src="https://randomuser.me/api/portraits/women/44.jpg"
                alt="开发者头像"
                className="developer-avatar"
                width={50}
                height={50}
              />
              <div className="developer-details">
                <div className="developer-name">CloudNative</div>
                <div className="developer-meta">
                  <span>
                    <i className="ri-code-s-slash-line"></i> 15 插件
                  </span>
                  <span>
                    <i className="ri-star-fill"></i> 4.6 分
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-grid">
              <div className="stat-item">
                <div className="stat-value">Lv.5</div>
                <div className="stat-label">开发者等级</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">2年+</div>
                <div className="stat-label">平台资历</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">24h</div>
                <div className="stat-label">平均响应</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">98%</div>
                <div className="stat-label">满意度</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "var(--spacing-2)", marginTop: "var(--spacing-3)" }}>
              <button className="btn btn-outline" style={{ flex: 1 }}>
                <i className="ri-message-3-line"></i>
                联系
              </button>
              <button className="btn btn-outline" style={{ flex: 1 }}>
                <i className="ri-user-follow-line"></i>
                关注
              </button>
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <i className="ri-tools-line sidebar-icon"></i>
              定制开发
            </h3>

            <p style={{ marginBottom: "var(--spacing-3)", color: "var(--neutral-600)", fontSize: "0.875rem" }}>
              需要特定功能或定制化开发？直接联系开发者
            </p>

            <div className="custom-request-form">
              <div className="form-group">
                <label className="form-label">需求描述</label>
                <textarea className="form-control" placeholder="请描述您的定制需求..."></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">预算范围</label>
                <select className="form-control">
                  <option>请选择预算范围</option>
                  <option>¥1,000 - ¥5,000</option>
                  <option>¥5,000 - ¥10,000</option>
                  <option>¥10,000 - ¥50,000</option>
                  <option>¥50,000+</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">期望交付时间</label>
                <select className="form-control">
                  <option>请选择期望交付时间</option>
                  <option>1周内</option>
                  <option>2-4周</option>
                  <option>1-3个月</option>
                  <option>3个月以上</option>
                </select>
              </div>

              <button className="btn btn-primary" style={{ width: "100%" }}>
                <i className="ri-send-plane-line"></i>
                提交需求
              </button>
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-title">
              <i className="ri-information-line sidebar-icon"></i>
              插件信息
            </h3>

            <div style={{ marginBottom: "var(--spacing-3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--spacing-2)" }}>
                <div style={{ color: "var(--neutral-600)", fontSize: "0.875rem" }}>版本</div>
                <div>v2.5.0</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--spacing-2)" }}>
                <div style={{ color: "var(--neutral-600)", fontSize: "0.875rem" }}>发布日期</div>
                <div>2025-04-15</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--spacing-2)" }}>
                <div style={{ color: "var(--neutral-600)", fontSize: "0.875rem" }}>部署次数</div>
                <div>3,521</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--spacing-2)" }}>
                <div style={{ color: "var(--neutral-600)", fontSize: "0.875rem" }}>许可证</div>
                <div>MIT</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ color: "var(--neutral-600)", fontSize: "0.875rem" }}>支持语言</div>
                <div>中文, 英文</div>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacing-2)" }}>
              <Link href="#" className="btn btn-sm btn-outline">
                <i className="ri-github-line"></i>
                源代码
              </Link>
              <Link href="#" className="btn btn-sm btn-outline">
                <i className="ri-file-list-3-line"></i>
                文档
              </Link>
              <Link href="#" className="btn btn-sm btn-outline">
                <i className="ri-bug-line"></i>
                问题反馈
              </Link>
              <Link href="#" className="btn btn-sm btn-outline">
                <i className="ri-history-line"></i>
                更新日志
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
