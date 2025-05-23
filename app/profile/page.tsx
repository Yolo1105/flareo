import Image from "next/image"
import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function UserProfile() {
  return (
    <>
      <Navbar />
      <main className="container" style={{ paddingTop: "var(--spacing-6)", paddingBottom: "var(--spacing-6)" }}>
        {/* 个人资料头部 */}
        <section className="profile-header">
          <Image
            src="https://randomuser.me/api/portraits/men/32.jpg"
            alt="用户头像"
            className="profile-avatar"
            width={120}
            height={120}
          />
          
          <div className="profile-info">
            <h1 className="profile-name">张小明</h1>
            <div className="profile-username">@xiaoming</div>
            <p className="profile-bio">全栈开发者，专注于云原生和微服务架构。热爱开源，喜欢分享技术经验和解决方案。</p>
            
            <div className="profile-meta">
              <div className="profile-meta-item">
                <i className="ri-map-pin-line profile-meta-icon"></i>
                北京，中国
              </div>
              <div className="profile-meta-item">
                <i className="ri-link profile-meta-icon"></i>
                <Link href="#" style={{ color: "inherit", textDecoration: "none" }}>github.com/xiaoming</Link>
              </div>
              <div className="profile-meta-item">
                <i className="ri-calendar-line profile-meta-icon"></i>
                2023年3月加入
              </div>
            </div>
            
            <div className="profile-actions">
              <button className="btn btn-outline">
                <i className="ri-edit-line"></i>
                编辑资料
              </button>
              <button className="btn btn-outline">
                <i className="ri-settings-3-line"></i>
                设置
              </button>
            </div>
          </div>
          
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-value">12</div>
              <div className="profile-stat-label">插件</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">1.5k</div>
              <div className="profile-stat-label">部署</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">4.8</div>
              <div className="profile-stat-label">评分</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">Lv.3</div>
              <div className="profile-stat-label">等级</div>
            </div>
          </div>
        </section>
        
        {/* 角色切换 */}
        <div className="role-switch">
          <div className="role-option active">
            <i className="ri-code-s-slash-line"></i>
            开发者视图
          </div>
          <div className="role-option">
            <i className="ri-user-line"></i>
            使用者视图
          </div>
        </div>
        
        {/* 仪表盘内容 */}
        <div className="dashboard-grid">
          <div className="dashboard-main">
            {/* 我的插件模块 */}
            <div className="module">
              <div className="module-header">
                <h2 className="module-title">
                  <i className="ri-apps-line" style={{ color: "var(--primary-color)", marginRight: "var(--spacing-2)" }}></i>
                  我的插件
                </h2>
                <Link href="#" className="module-action">查看全部</Link>
              </div>
              <div className="module-body">
                <div className="plugin-list">
                  {/* 插件项目 1 */}
                  <div className="plugin-item">
                    <Image
                      src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80"
                      alt="API 网关"
                      className="plugin-item-image"
                      width={60}
                      height={60}
                    />
                    <div className="plugin-item-info">
                      <h3 className="plugin-item-title">API 网关</h3>
                      <div className="plugin-item-meta">
                        <span><i className="ri-download-line"></i> 3.5k 部署</span>
                        <span><i className="ri-star-fill"></i> 4.8 分</span>
                        <span><i className="ri-price-tag-3-line"></i> 免费</span>
                      </div>
                      <div className="plugin-item-actions">
                        <Link href="#" className="btn btn-sm btn-outline">编辑</Link>
                        <Link href="#" className="btn btn-sm btn-outline">数据</Link>
                        <Link href="#" className="btn btn-sm btn-outline">评论</Link>
                      </div>
                    </div>
                  </div>
                  
                  {/* 插件项目 2 */}
                  <div className="plugin-item">
                    <Image
                      src="https://images.unsplash.com/photo-1558655146-d09347e92766?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
                      alt="日志分析器"
                      className="plugin-item-image"
                      width={60}
                      height={60}
                    />
                    <div className="plugin-item-info">
                      <h3 className="plugin-item-title">日志分析器</h3>
                      <div className="plugin-item-meta">
                        <span><i className="ri-download-line"></i> 1.2k 部署</span>
                        <span><i className="ri-star-fill"></i> 4.5 分</span>
                        <span><i className="ri-price-tag-3-line"></i> ¥129/月</span>
                      </div>
                      <div className="plugin-item-actions">
                        <Link href="#" className="btn btn-sm btn-outline">编辑</Link>
                        <Link href="#" className="btn btn-sm btn-outline">数据</Link>
                        <Link href="#" className="btn btn-sm btn-outline">评论</Link>
                      </div>
                    </div>
                  </div>
                  
                  {/* 插件项目 3 */}
                  <div className="plugin-item">
                    <Image
                      src="https://images.unsplash.com/photo-1561736778-92e52a7769ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                      alt="数据可视化引擎"
                      className="plugin-item-image"
                      width={60}
                      height={60}
                    />
                    <div className="plugin-item-info">
                      <h3 className="plugin-item-title">数据可视化引擎</h3>
                      <div className="plugin-item-meta">
                        <span><i className="ri-download-line"></i> 856 部署</span>
                        <span><i className="ri-star-fill"></i> 4.2 分</span>
                
      <Footer />
    </>
  )
}
