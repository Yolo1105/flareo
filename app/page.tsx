import Link from "next/link"
import Image from "next/image"

export default function Home() {
  return (
    <main className="container">
      {/* 搜索栏（移动端） */}
      <div className="search-bar d-md-none mt-4 mb-4">
        <i className="ri-search-line search-icon"></i>
        <input type="text" className="search-input" placeholder="搜索插件、功能或服务..." />
      </div>

      {/* 英雄区域 */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">发现、部署、定制你的插件服务</h1>
            <p className="hero-description">
              Flareo 是一个前后端通用的插件分发与部署平台，让你轻松找到、部署和定制适合你需求的插件服务。
            </p>
            <div className="hero-buttons">
              <button className="btn btn-secondary">
                <i className="ri-search-line"></i>
                浏览插件市场
              </button>
              <button
                className="btn btn-outline"
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "white",
                  borderColor: "rgba(255,255,255,0.4)",
                }}
              >
                <i className="ri-upload-cloud-line"></i>
                上传我的插件
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 分类导航 */}
      <section className="category-nav">
        <div className="category-item active">
          <i className="ri-apps-line category-icon"></i>
          全部
        </div>
        <div className="category-item">
          <i className="ri-file-text-line category-icon"></i>
          文档处理
        </div>
        <div className="category-item">
          <i className="ri-image-line category-icon"></i>
          图像处理
        </div>
        <div className="category-item">
          <i className="ri-database-2-line category-icon"></i>
          数据分析
        </div>
        <div className="category-item">
          <i className="ri-cloud-line category-icon"></i>
          API 集成
        </div>
        <div className="category-item">
          <i className="ri-code-s-slash-line category-icon"></i>
          开发工具
        </div>
        <div className="category-item">
          <i className="ri-robot-line category-icon"></i>
          AI 工具
        </div>
        <div className="category-item">
          <i className="ri-dashboard-line category-icon"></i>
          监控工具
        </div>
      </section>

      {/* 公告横幅 */}
      <section className="banner">
        <Image
          src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80"
          alt="平台公告"
          className="banner-image"
          width={1200}
          height={200}
        />
        <div className="banner-content">
          <h2 className="banner-title">极客挑战赛：构建下一代插件服务</h2>
          <p className="banner-description">参与我们的开发者挑战赛，赢取丰厚奖金和曝光机会。</p>
          <button className="btn btn-primary">了解详情</button>
        </div>
      </section>

      {/* 热门插件 */}
      <section className="featured-plugins">
        <div className="section-header">
          <h2 className="section-title">热门插件</h2>
          <Link href="#" className="section-link">
            查看全部 <i className="ri-arrow-right-line"></i>
          </Link>
        </div>

        <div className="plugin-grid">
          {/* 插件卡片 1 */}
          <div className="card plugin-card">
            <div className="plugin-card-image">
              <Image
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                alt="PDF 智能解析"
                width={300}
                height={160}
              />
            </div>
            <div className="plugin-card-body">
              <h3 className="plugin-card-title">PDF 智能解析</h3>
              <p className="plugin-card-description">自动提取 PDF 文档中的表格、文本和图像，支持多种格式导出。</p>
              <div className="plugin-card-meta">
                <div className="plugin-card-price">¥99 / 月</div>
                <div className="rating">
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-half-fill"></i>
                  <span>4.5</span>
                </div>
              </div>
              <div className="plugin-card-footer">
                <div className="plugin-card-author">
                  <Image
                    src="https://randomuser.me/api/portraits/men/32.jpg"
                    alt="开发者头像"
                    width={24}
                    height={24}
                  />
                  <span>数据猎手</span>
                </div>
                <div className="tag">
                  <i className="ri-download-line"></i>
                  1.2k
                </div>
              </div>
            </div>
          </div>

          {/* 插件卡片 2 */}
          <div className="card plugin-card">
            <div className="plugin-card-image">
              <Image
                src="https://images.unsplash.com/photo-1558655146-d09347e92766?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
                alt="API 网关"
                width={300}
                height={160}
              />
            </div>
            <div className="plugin-card-body">
              <h3 className="plugin-card-title">API 网关</h3>
              <p className="plugin-card-description">轻量级 API 网关，支持请求转发、限流、认证和监控功能。</p>
              <div className="plugin-card-meta">
                <div className="plugin-card-price">免费</div>
                <div className="rating">
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-line"></i>
                  <span>4.0</span>
                </div>
              </div>
              <div className="plugin-card-footer">
                <div className="plugin-card-author">
                  <Image
                    src="https://randomuser.me/api/portraits/women/44.jpg"
                    alt="开发者头像"
                    width={24}
                    height={24}
                  />
                  <span>CloudNative</span>
                </div>
                <div className="tag">
                  <i className="ri-download-line"></i>
                  3.5k
                </div>
              </div>
            </div>
          </div>

          {/* 插件卡片 3 */}
          <div className="card plugin-card">
            <div className="plugin-card-image">
              <Image
                src="https://images.unsplash.com/photo-1561736778-92e52a7769ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                alt="图像优化器"
                width={300}
                height={160}
              />
            </div>
            <div className="plugin-card-body">
              <h3 className="plugin-card-title">图像优化器</h3>
              <p className="plugin-card-description">批量压缩和优化图像，自动调整尺寸和格式，提升网站加载速度。</p>
              <div className="plugin-card-meta">
                <div className="plugin-card-price">¥199 / 年</div>
                <div className="rating">
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <span>5.0</span>
                </div>
              </div>
              <div className="plugin-card-footer">
                <div className="plugin-card-author">
                  <Image
                    src="https://randomuser.me/api/portraits/men/67.jpg"
                    alt="开发者头像"
                    width={24}
                    height={24}
                  />
                  <span>图像工坊</span>
                </div>
                <div className="tag">
                  <i className="ri-download-line"></i>
                  2.8k
                </div>
              </div>
            </div>
          </div>

          {/* 插件卡片 4 */}
          <div className="card plugin-card">
            <div className="plugin-card-image">
              <Image
                src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                alt="代码分析器"
                width={300}
                height={160}
              />
            </div>
            <div className="plugin-card-body">
              <h3 className="plugin-card-title">代码分析器</h3>
              <p className="plugin-card-description">
                静态代码分析工具，检测潜在问题并提供优化建议，支持多种编程语言。
              </p>
              <div className="plugin-card-meta">
                <div className="plugin-card-price">¥299 一次性</div>
                <div className="rating">
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-half-fill"></i>
                  <span>4.7</span>
                </div>
              </div>
              <div className="plugin-card-footer">
                <div className="plugin-card-author">
                  <Image
                    src="https://randomuser.me/api/portraits/women/28.jpg"
                    alt="开发者头像"
                    width={24}
                    height={24}
                  />
                  <span>代码卫士</span>
                </div>
                <div className="tag">
                  <i className="ri-download-line"></i>
                  1.5k
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 最新上架 */}
      <section className="featured-plugins">
        <div className="section-header">
          <h2 className="section-title">最新上架</h2>
        </div>

        <div className="plugin-grid">
          {/* 插件卡片 5 */}
          <div className="card plugin-card">
            <div className="plugin-card-image">
              <Image
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80"
                alt="数据可视化引擎"
                width={300}
                height={160}
              />
            </div>
            <div className="plugin-card-body">
              <h3 className="plugin-card-title">数据可视化引擎</h3>
              <p className="plugin-card-description">将复杂数据转化为直观图表，支持实时数据流和交互式仪表盘。</p>
              <div className="plugin-card-meta">
                <div className="plugin-card-price">¥149 / 月</div>
                <div className="rating">
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-line"></i>
                  <span>4.0</span>
                </div>
              </div>
              <div className="plugin-card-footer">
                <div className="plugin-card-author">
                  <Image
                    src="https://randomuser.me/api/portraits/men/22.jpg"
                    alt="开发者头像"
                    width={24}
                    height={24}
                  />
                  <span>数据魔方</span>
                </div>
                <div className="tag tag-primary">新上架</div>
              </div>
            </div>
          </div>

          {/* 插件卡片 6 */}
          <div className="card plugin-card">
            <div className="plugin-card-image">
              <Image
                src="https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                alt="AI 文本生成器"
                width={300}
                height={160}
              />
            </div>
            <div className="plugin-card-body">
              <h3 className="plugin-card-title">AI 文本生成器</h3>
              <p className="plugin-card-description">
                基于先进 AI 模型的文本生成工具，可用于创建内容、回复邮件和撰写文案。
              </p>
              <div className="plugin-card-meta">
                <div className="plugin-card-price">¥199 / 月</div>
                <div className="rating">
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-half-fill"></i>
                  <span>4.5</span>
                </div>
              </div>
              <div className="plugin-card-footer">
                <div className="plugin-card-author">
                  <Image
                    src="https://randomuser.me/api/portraits/women/12.jpg"
                    alt="开发者头像"
                    width={24}
                    height={24}
                  />
                  <span>AI 创作坊</span>
                </div>
                <div className="tag tag-primary">新上架</div>
              </div>
            </div>
          </div>

          {/* 插件卡片 7 */}
          <div className="card plugin-card">
            <div className="plugin-card-image">
              <Image
                src="https://images.unsplash.com/photo-1489875347897-49f64b51c1f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                alt="日志分析器"
                width={300}
                height={160}
              />
            </div>
            <div className="plugin-card-body">
              <h3 className="plugin-card-title">日志分析器</h3>
              <p className="plugin-card-description">
                实时处理和分析日志数据，自动检测异常并发送警报，支持多种日志格式。
              </p>
              <div className="plugin-card-meta">
                <div className="plugin-card-price">¥129 / 月</div>
                <div className="rating">
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-line"></i>
                  <i className="ri-star-line"></i>
                  <span>3.0</span>
                </div>
              </div>
              <div className="plugin-card-footer">
                <div className="plugin-card-author">
                  <Image
                    src="https://randomuser.me/api/portraits/men/45.jpg"
                    alt="开发者头像"
                    width={24}
                    height={24}
                  />
                  <span>日志猎人</span>
                </div>
                <div className="tag tag-primary">新上架</div>
              </div>
            </div>
          </div>

          {/* 插件卡片 8 */}
          <div className="card plugin-card">
            <div className="plugin-card-image">
              <Image
                src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-1.2.1&auto=format&fit=crop&w=2034&q=80"
                alt="安全扫描器"
                width={300}
                height={160}
              />
            </div>
            <div className="plugin-card-body">
              <h3 className="plugin-card-title">安全扫描器</h3>
              <p className="plugin-card-description">全面的安全漏洞扫描工具，检测网站和应用程序中的潜在安全风险。</p>
              <div className="plugin-card-meta">
                <div className="plugin-card-price">¥399 / 年</div>
                <div className="rating">
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-fill"></i>
                  <i className="ri-star-line"></i>
                  <span>4.0</span>
                </div>
              </div>
              <div className="plugin-card-footer">
                <div className="plugin-card-author">
                  <Image
                    src="https://randomuser.me/api/portraits/women/36.jpg"
                    alt="开发者头像"
                    width={24}
                    height={24}
                  />
                  <span>安全卫士</span>
                </div>
                <div className="tag tag-primary">新上架</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 如何使用 Flareo */}
      <section className="how-to-use-section my-5 py-5 bg-light">
        <div className="text-center mb-5">
          <h2 className="section-title">如何使用 Flareo</h2>
          <p className="mt-2" style={{ color: "var(--neutral-600)" }}>
            Flareo 让您轻松找到、部署和集成所需的插件服务，只需简单三步即可开始使用
          </p>
        </div>

        <div className="container">
          <div className="how-to-steps">
            <div className="how-to-step">
              <div className="how-to-icon mb-4">
                <i className="ri-search-line text-4xl"></i>
              </div>
              <h3 className="how-to-title font-bold">1. 浏览插件</h3>
              <p className="how-to-description">在我们丰富的插件市场中浏览，使用筛选器找到最适合您需求的插件</p>
            </div>

            <div className="how-to-step">
              <div className="how-to-icon mb-4">
                <i className="ri-download-cloud-line text-4xl"></i>
              </div>
              <h3 className="how-to-title font-bold">2. 部署或定制</h3>
              <p className="how-to-description">一键部署插件，或者联系开发者进行定制以满足您的特定需求</p>
            </div>

            <div className="how-to-step">
              <div className="how-to-icon mb-4">
                <i className="ri-code-s-slash-line text-4xl"></i>
              </div>
              <h3 className="how-to-title font-bold">3. 集成到项目</h3>
              <p className="how-to-description">使用我们的API或SDK将插件无缝集成到您的项目中，立即开始使用</p>
            </div>
          </div>

          <div className="text-center mt-5">
            <button className="btn btn-primary">
              <i className="ri-play-circle-line mr-2"></i>
              尝试演示插件
            </button>
          </div>
        </div>
      </section>

      {/* 平台数据 */}
      <section className="stats-section">
        <div className="text-center mb-4">
          <h2 className="section-title">平台数据</h2>
          <p className="mt-2" style={{ color: "var(--neutral-600)" }}>
            Flareo 正在快速成长，加入我们的生态系统
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-icon mb-3">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
              >
                <path
                  d="M12 2L3 7L12 12L21 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 17L12 22L21 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 12L12 17L21 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="stat-value">1,200+</div>
            <div className="stat-label">活跃插件</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon mb-3">
              <i className="ri-user-line text-3xl text-primary"></i>
            </div>
            <div className="stat-value">5,000+</div>
            <div className="stat-label">开发者</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon mb-3">
              <i className="ri-user-star-line text-3xl text-primary"></i>
            </div>
            <div className="stat-value">25,000+</div>
            <div className="stat-label">用户</div>
          </div>
          <div className="stat-item">
            <div className="stat-icon mb-3">
              <i className="ri-download-cloud-line text-3xl text-primary"></i>
            </div>
            <div className="stat-value">100,000+</div>
            <div className="stat-label">部署次数</div>
          </div>
        </div>
      </section>

      {/* 用户评价 */}
      <section className="testimonials">
        <div className="section-header">
          <h2 className="section-title">用户评价</h2>
        </div>

        <div className="testimonial-grid">
          <div className="testimonial-card">
            <div className="testimonial-content">
              "Flareo 彻底改变了我们的工作流程。我们现在可以轻松找到并部署所需的插件，大大提高了开发效率。"
            </div>
            <div className="testimonial-author">
              <Image
                src="https://randomuser.me/api/portraits/women/65.jpg"
                alt="用户头像"
                className="testimonial-avatar"
                width={40}
                height={40}
              />
              <div className="testimonial-info">
                <div className="testimonial-name">张小明</div>
                <div className="testimonial-role">技术总监 @ 云科技</div>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-content">
              "作为一名插件开发者，Flareo 为我提供了一个展示和销售作品的完美平台。收益模式非常透明，社区反馈也很有价值。"
            </div>
            <div className="testimonial-author">
              <Image
                src="https://randomuser.me/api/portraits/men/41.jpg"
                alt="用户头像"
                className="testimonial-avatar"
                width={40}
                height={40}
              />
              <div className="testimonial-info">
                <div className="testimonial-name">李大壮</div>
                <div className="testimonial-role">独立开发者</div>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-content">
              "我们公司使用 Flareo 定制了几个专用插件，整个过程非常顺畅。众包系统让我们快速找到了合适的开发者，质量超出预期。"
            </div>
            <div className="testimonial-author">
              <Image
                src="https://randomuser.me/api/portraits/women/33.jpg"
                alt="用户头像"
                className="testimonial-avatar"
                width={40}
                height={40}
              />
              <div className="testimonial-info">
                <div className="testimonial-name">王丽丽</div>
                <div className="testimonial-role">产品经理 @ 数字未来</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 行动召唤 */}
      <section className="cta-section">
        <h2 className="cta-title">准备好开始你的插件之旅了吗？</h2>
        <p className="cta-description">
          无论你是寻找插件解决方案的用户，还是希望分享创意的开发者，Flareo 都能满足你的需求。
        </p>
        <div className="cta-buttons">
          <button className="btn btn-secondary">
            <i className="ri-user-add-line"></i>
            注册账号
          </button>
          <button
            className="btn btn-outline"
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              color: "white",
              borderColor: "rgba(255,255,255,0.4)",
            }}
          >
            <i className="ri-information-line"></i>
            了解更多
          </button>
        </div>
      </section>

      {/* 成为 Flareo 开发者 */}
      <section className="developer-section">
        <div className="developer-content">
          <div className="developer-text">
            <h2 className="developer-title">成为 Flareo 开发者</h2>
            <p className="developer-description">
              分享您的创意，获得收益，并与全球用户建立联系。加入我们的开发者社区，开始您的插件之旅。
            </p>
            <div className="developer-buttons">
              <button className="btn btn-primary">
                <i className="ri-user-add-line"></i>
                注册开发者账号
              </button>
              <button className="btn btn-outline-light">
                <i className="ri-file-list-line"></i>
                查看开发文档
              </button>
            </div>
          </div>
          <div className="developer-features">
            <div className="developer-feature">
              <div className="feature-icon">
                <i className="ri-upload-cloud-line"></i>
              </div>
              <h3 className="feature-title">上传插件</h3>
              <p className="feature-description">分享您的创意并获得收益</p>
            </div>
            <div className="developer-feature">
              <div className="feature-icon">
                <i className="ri-line-chart-line"></i>
              </div>
              <h3 className="feature-title">收益仪表盘</h3>
              <p className="feature-description">跟踪您的插件表现和收入</p>
            </div>
            <div className="developer-feature">
              <div className="feature-icon">
                <i className="ri-message-3-line"></i>
              </div>
              <h3 className="feature-title">定制请求</h3>
              <p className="feature-description">浏览用户的定制需求</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
