import Head from 'next/head'
import { useRouter } from 'next/router'

interface PageHeadProps {
  title?: string
  description?: string
  keywords?: string
}

export const PageHead: React.FC<PageHeadProps> = ({
  title = 'Flareo：即插即用的容器化功能模块市集',
  description = 'Flareo：即插即用的容器化功能模块市集',
  keywords = 'Flareo, 容器化, 功能模块, 市集, 即插即用',
}) => {
  const router = useRouter()
  const currentPath = router.asPath

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`https://flareo.com${currentPath}`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <link rel="canonical" href={`https://flareo.com${currentPath}`} />
    </Head>
  )
} 