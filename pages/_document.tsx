import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="zh-CN">
      <Head>
        {/* 基础 Meta 标签 */}
        <meta charSet="utf-8" />
        <meta name="description" content="Flareo：即插即用的容器化功能模块市集 - 快速构建、部署和管理容器化应用" />
        <meta name="keywords" content="Flareo, 容器化, 功能模块, 市集, 即插即用, Docker, Kubernetes, 微服务, 云原生" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="author" content="Flareo Team" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        
        {/* Favicon 配置 */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://flareo.com/" />
        <meta property="og:title" content="Flareo：即插即用的容器化功能模块市集" />
        <meta property="og:description" content="Flareo：即插即用的容器化功能模块市集 - 快速构建、部署和管理容器化应用" />
        <meta property="og:image" content="https://flareo.com/og-image.jpg" />
        <meta property="og:site_name" content="Flareo" />
        <meta property="og:locale" content="zh_CN" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@flareo" />
        <meta name="twitter:creator" content="@flareo" />
        <meta name="twitter:title" content="Flareo：即插即用的容器化功能模块市集" />
        <meta name="twitter:description" content="Flareo：即插即用的容器化功能模块市集 - 快速构建、部署和管理容器化应用" />
        <meta name="twitter:image" content="https://flareo.com/twitter-image.jpg" />
        
        {/* 其他 SEO 优化 */}
        <link rel="canonical" href="https://flareo.com/" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Flareo" />
        
        {/* 预加载关键资源 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        
        {/* 结构化数据 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Flareo",
              "applicationCategory": "DeveloperApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "CNY"
              },
              "description": "Flareo：即插即用的容器化功能模块市集 - 快速构建、部署和管理容器化应用"
            })
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 