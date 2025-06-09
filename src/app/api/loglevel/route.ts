// app/api/admin/log-level/route.ts
import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

const validLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];

export async function POST(req: NextRequest) {
  const body = await req.json();

//   // Optional admin token check (add your real secret here)
//   const authHeader = req.headers.get('authorization');
//   const adminToken = process.env.ADMIN_LOG_TOKEN;
//   if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }
  
  const level = body.level?.toLowerCase();

  if (!validLevels.includes(level)) {
    return NextResponse.json({ error: 'Invalid log level' }, { status: 400 });
  }

  logger.level = level;
  logger.info(`🔧 Log level changed to: ${level}`);

  return NextResponse.json({ message: `🔧 Log level set to ${level}` });
}

export async function GET() {
  return NextResponse.json({ currentLevel: logger.level });
}