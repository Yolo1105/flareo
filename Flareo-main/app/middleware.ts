import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// 获取登录状态的函数
function isUserLoggedIn(req: NextRequest): boolean {
  const userId = req.cookies.get('user_id');
  return Boolean(userId);
}

// 处理页面访问的中间件
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 如果用户未登录，且访问的页面需要认证，则重定向到登录页
  if (!isUserLoggedIn(req)) {
    // 定义需要登录的页面路径
    const protectedPaths = ['/profile', '/upload', '/deploy'];
    if (protectedPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL('/signin', req.url));  // 重定向到登录页
    }
  }

  // 如果已登录或者访问的是公开页面，则继续处理
  return NextResponse.next();
}

// 配置中间件的路径
export const config = {
  matcher: ['/profile', '/upload', '/deploy/[plugin_id]'],  // 只匹配需要认证的页面
};
