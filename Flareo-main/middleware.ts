import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 安全相关的配置
const securityConfig = {
  // 允许的域名列表
  allowedOrigins: ['https://flareo.com', 'https://www.flareo.com'],
  // 需要保护的路径
  protectedPaths: ['/api', '/admin'],
  // 最大请求大小（字节）
  maxBodySize: 1024 * 1024, // 1MB
  // 请求频率限制（每分钟）
  rateLimit: 100,
};

// 请求计数器
const requestCounts = new Map<string, number>();

// 清理过期的请求计数
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of requestCounts.entries()) {
    if (now - timestamp > 60000) { // 1分钟
      requestCounts.delete(key);
    }
  }
}, 60000);

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const ip = request.ip || 'unknown';
  const path = request.nextUrl.pathname;

  // 1. 检查请求来源
  const origin = request.headers.get('origin');
  if (origin && !securityConfig.allowedOrigins.includes(origin)) {
    return new NextResponse(null, { status: 403 });
  }

  // 2. 检查请求大小
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > securityConfig.maxBodySize) {
    return new NextResponse(null, { status: 413 });
  }

  // 3. 请求频率限制
  const key = `${ip}:${path}`;
  const now = Date.now();
  const requestCount = requestCounts.get(key) || 0;
  
  if (requestCount >= securityConfig.rateLimit) {
    return new NextResponse(null, { status: 429 });
  }
  
  requestCounts.set(key, requestCount + 1);

  // 4. 检查路径注入
  if (path.includes('..') || path.includes('//')) {
    return new NextResponse(null, { status: 400 });
  }

  // 5. 检查 SQL 注入
  const sqlInjectionPattern = /(\%27)|(\')|(\-\-)|(\%23)|(#)/i;
  if (sqlInjectionPattern.test(path)) {
    return new NextResponse(null, { status: 400 });
  }

  // 6. 检查 XSS 攻击
  const xssPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  if (xssPattern.test(path)) {
    return new NextResponse(null, { status: 400 });
  }

  // 7. 添加安全响应头
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 8. 检查受保护的路径
  if (securityConfig.protectedPaths.some(protectedPath => path.startsWith(protectedPath))) {
    const authToken = request.headers.get('authorization');
    if (!authToken) {
      return new NextResponse(null, { status: 401 });
    }
    // 这里可以添加更详细的 token 验证逻辑
  }

  return response;
}

// 配置中间件匹配的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 