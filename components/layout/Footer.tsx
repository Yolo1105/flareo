import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-neutral-800 text-neutral-300 py-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-8">Flareo</h3>
            <p className="mb-8">前后端通用的探索分发与部署平台，连接开发者与用户的桥梁。</p>
            <div className="flex gap-4">
              <Link href="#" className="text-neutral-400 text-xl"><i className="ri-github-fill"></i></Link>
              <Link href="#" className="text-neutral-400 text-xl"><i className="ri-twitter-fill"></i></Link>
              <Link href="#" className="text-neutral-400 text-xl"><i className="ri-linkedin-box-fill"></i></Link>
              <Link href="#" className="text-neutral-400 text-xl"><i className="ri-wechat-fill"></i></Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-8">产品</h4>
            <ul className="list-none p-0">
              <li className="mb-4"><Link href="#" className="text-neutral-400 no-underline">探索市场</Link></li>
              <li className="mb-4"><Link href="#" className="text-neutral-400 no-underline">部署服务</Link></li>
              <li className="mb-4"><Link href="#" className="text-neutral-400 no-underline">定制开发</Link></li>
              <li className="mb-4"><Link href="#" className="text-neutral-400 no-underline">企业方案</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-8">资源</h4>
            <ul className="list-none p-0">
              <li className="mb-4"><Link href="#" className="text-neutral-400 no-underline">开发文档</Link></li>
              <li className="mb-4"><Link href="#" className="text-neutral-400 no-underline">API 参考</Link></li>
              <li className="mb-4"><Link href="#" className="text-neutral-400 no-underline">社区论坛</Link></li>
              <li className="mb-4"><Link href="#" className="text-neutral-400 no-underline">教程中心</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-8">公司</h4>
            <ul className="list-none p-0">
              <li className="mb-4"><Link href="#" className="text-neutral-400 no-underline">关于我们</Link></li>
              <li className="mb-4"><Link href="#" className="text-neutral-400 no-underline">联系方式</Link></li>
              <li className="mb-4"><Link href="#" className="text-neutral-400 no-underline">加入我们</Link></li>
              <li className="mb-4"><Link href="#" className="text-neutral-400 no-underline">隐私政策</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-neutral-700 text-center text-neutral-500 text-sm">
          &copy; 2025 Flareo. 保留所有权利。
        </div>
      </div>
    </footer>
  );
} 