import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const rows = db.prepare('SELECT id, meta FROM tasks').all();
  const tasks = rows.map((r: any) => ({ id: r.id, meta: JSON.parse(r.meta || '{}') }));
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const body = await request.json();
  const meta = JSON.stringify(body.meta || {});
  const info = db.prepare('INSERT INTO tasks (meta) VALUES (?)').run(meta);
  return NextResponse.json({ id: info.lastInsertRowid });
}
