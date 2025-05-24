import { NextResponse } from 'next/server';
import { z } from 'zod';

const EarningsSchema = z.object({
  totalEarnings: z.number(),
  totalTasksCompleted: z.number(),
  lastPayoutDate: z.string(),
  pendingPayouts: z.number(),
});

export async function GET() {
  const data = {
    totalEarnings: 1234,
    totalTasksCompleted: 10,
    lastPayoutDate: '2025-05-20',
    pendingPayouts: 2,
  };
  EarningsSchema.parse(data);
  return NextResponse.json(data);
}
