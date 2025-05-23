import Link from "next/link"

export default function Footer() {
  return (
    <footer
      style={{ backgroundColor: "var(--neutral-800)", color: "var(--neutral-300)", padding: "var(--spacing-8) 0" }}
    >
      <div className="container">
        <div className="grid grid-cols-4">
          <div>
            <h3 style={{ color: "white", fontWeight: 600, marginBottom: "var(--spacing-4)" }}>Plugin Hub</h3>
            <p style={{ marginBottom: "var(--spacing-4)" }}>前后端通用的插件分发与部署平台，连接开发者与用户的桥梁。</p>
            <div style={{ display: "flex", gap: "var(--spacing-2)" }}>
              <Link href="#" style={{ color: "var(--neutral-400)", fontSize: "1.25rem" }}>
                <i className="ri-github-fill"></i>
              </Link>
              <Link href="#" style={{ color: "var(--neutral-400)", fontSize: "1.25rem" }}>
                <i className="ri-twitter-fill"></i>
              </Link>
              <Link href="#" style={{ color: "var(--neutral-400)", fontSize: "1.25rem" }}>
                <i className="ri-linkedin-box-fill"></i>
              </Link>
              <Link href="#" style={{ color: "var(--neutral-400)", fontSize: "1.25rem" }}>
                <i className="ri-wechat-fill"></i>
              </Link>
            </div>
          </div>

          <div>
            <h4 style={{ color: "white", fontWeight: 600, marginBottom: "var(--spacing-4)" }}>产品</h4>
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li style={{ marginBottom: "var(--spacing-2)" }}>
                <Link href="#" style={{ color: "var(--neutral-400)", textDecoration: "none" }}>
                  插件市场
                </Link>
              </li>
              <li style={{ marginBottom: "var(--spacing-2)" }}>
                <Link href="#" style={{ color: "var(--neutral-400)", textDecoration: "none" }}>
                  部署服务
                </Link>
              </li>
              <li style={{ marginBottom: "var(--spacing-2)" }}>
                <Link href="#" style={{ color: "var(--neutral-400)", textDecoration: "none" }}>
                  定制开发
                </Link>
              </li>
              <li style={{ marginBottom: "var(--spacing-2)" }}>
                <Link href="#" style={{ color: "var(--neutral-400)", textDecoration: "none" }}>
                  企业方案
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: "white", fontWeight: 600, marginBottom: "var(--spacing-4)" }}>资源</h4>
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li style={{ marginBottom: "var(--spacing-2)" }}>
                <Link href="#" style={{ color: "var(--neutral-400)", textDecoration: "none" }}>
                  开发文档
                </Link>
              </li>
              <li style={{ marginBottom: "var(--spacing-2)" }}>
                <Link href="#" style={{ color: "var(--neutral-400)", textDecoration: "none" }}>
                  API 参考
                </Link>
              </li>
              <li style={{ marginBottom: "var(--spacing-2)" }}>
                <Link href="#" style={{ color: "var(--neutral-400)", textDecoration: "none" }}>
                  社区论坛
                </Link>
              </li>
              <li style={{ marginBottom: "var(--spacing-2)" }}>
                <Link href="#" style={{ color: "var(--neutral-400)", textDecoration: "none" }}>
                  教程中心
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: "white", fontWeight: 600, marginBottom: "var(--spacing-4)" }}>公司</h4>
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li style={{ marginBottom: "var(--spacing-2)" }}>
                <Link href="#" style={{ color: "var(--neutral-400)", textDecoration: "none" }}>
                  关于我们
                </Link>
              </li>
              <li style={{ marginBottom: "var(--spacing-2)" }}>
                <Link href="#" style={{ color: "var(--neutral-400)", textDecoration: "none" }}>
                  联系方式
                </Link>
              </li>
              <li style={{ marginBottom: "var(--spacing-2)" }}>
                <Link href="#" style={{ color: "var(--neutral-400)", textDecoration: "none" }}>
                  加入我们
                </Link>
              </li>
              <li style={{ marginBottom: "var(--spacing-2)" }}>
                <Link href="#" style={{ color: "var(--neutral-400)", textDecoration: "none" }}>
                  隐私政策
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div
          style={{
            marginTop: "var(--spacing-8)",
            paddingTop: "var(--spacing-4)",
            borderTop: "1px solid var(--neutral-700)",
            textAlign: "center",
            color: "var(--neutral-500)",
          }}
        >
          &copy; 2025 Plugin Hub. 保留所有权利。
        </div>
      </div>
    </footer>
  )
}
