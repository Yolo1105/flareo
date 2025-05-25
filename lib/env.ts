import { z } from 'zod';

// 环境变量验证模式
const envSchema = z.object({
  // 数据库配置
  DATABASE_URL: z.string().url(),
  
  // 认证配置
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string(),
  
  // API 配置
  API_URL: z.string().url(),
  API_KEY: z.string().min(16),
  
  // 第三方服务配置
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string(),
  SMTP_USER: z.string().email(),
  SMTP_PASSWORD: z.string().min(8),
  
  // 安全配置
  CORS_ORIGIN: z.string().url(),
  RATE_LIMIT_MAX: z.string().transform(Number),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number),
  
  // 环境标识
  NODE_ENV: z.enum(['development', 'test', 'production']),
  
  // 可选配置
  SENTRY_DSN: z.string().url().optional(),
  GOOGLE_ANALYTICS_ID: z.string().optional(),
});

// 类型定义
type Env = z.infer<typeof envSchema>;

// 验证环境变量
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map(err => err.path.join('.'))
        .join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

// 导出验证后的环境变量
export const env = validateEnv();

// 环境变量类型
declare global {
  namespace NodeJS {
    interface ProcessEnv extends Env {}
  }
} 