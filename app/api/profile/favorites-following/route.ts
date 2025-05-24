import { NextResponse } from 'next/server';
import { z } from 'zod';

const DeveloperSchema = z.object({
  id: z.string(),
  name: z.string(),
  bio: z.string(),
  avatarUrl: z.string(),
  pluginsCount: z.number(),
  followersCount: z.number(),
  followedAt: z.string(),
  latestPlugin: z.string(),
});

const FollowingResponseSchema = z.object({
  following: z.array(DeveloperSchema),
});

export async function GET() {
  try {
    // TODO: Replace with actual database query
    const data = {
      following: [
        {
          id: "1",
          name: "张开发",
          bio: "全栈开发者，专注于 React 和 Node.js",
          avatarUrl: "/placeholder.svg?height=48&width=48&query=developer avatar",
          pluginsCount: 12,
          followersCount: 1250,
          followedAt: "2025-05-01",
          latestPlugin: "代码格式化工具",
        },
        {
          id: "2",
          name: "李程序",
          bio: "前端工程师，UI/UX 设计爱好者",
          avatarUrl: "/placeholder.svg?height=48&width=48&query=developer avatar",
          pluginsCount: 8,
          followersCount: 890,
          followedAt: "2025-04-28",
          latestPlugin: "API 测试助手",
        },
        {
          id: "3",
          name: "王数据",
          bio: "数据科学家，机器学习专家",
          avatarUrl: "/placeholder.svg?height=48&width=48&query=developer avatar",
          pluginsCount: 15,
          followersCount: 2100,
          followedAt: "2025-04-20",
          latestPlugin: "数据库查询器",
        },
      ],
    };

    const validatedData = FollowingResponseSchema.parse(data);
    return NextResponse.json(validatedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data format', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
