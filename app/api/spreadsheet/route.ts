import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import db from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = Number(searchParams.get('taskId')) || 1;

  let task = db.prepare('SELECT meta FROM tasks WHERE id=?').get(taskId);
  if (!task) {
    db.prepare('INSERT INTO tasks (id, meta) VALUES (?, ?)').run(taskId, '{}');
    task = { meta: '{}' };
  }

  const cells = db
    .prepare('SELECT row, col, type, content FROM cells WHERE task_id=?')
    .all(taskId);

  return NextResponse.json({ meta: JSON.parse(task.meta || '{}'), cells });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = Number(searchParams.get('taskId')) || 1;
  const body = await request.json();

  let task = db.prepare('SELECT id, meta FROM tasks WHERE id=?').get(taskId);
  if (!task) {
    db.prepare('INSERT INTO tasks (id, meta) VALUES (?, ?)').run(taskId, '{}');
    task = { id: taskId, meta: '{}' };
  }

  if (body.meta) {
    const current = JSON.parse(task.meta || '{}');
    const updated = { ...current, ...body.meta };
    db.prepare('UPDATE tasks SET meta=? WHERE id=?').run(JSON.stringify(updated), taskId);
    return NextResponse.json({ ok: true });
  }

  const { rowIndex, colIndex, content, type } = body;
  let storedContent = content;

  if (type === 'image' && content.startsWith('data:')) {
    const matches = content.match(/^data:(image\/\w+);base64,(.+)$/);
    if (matches) {
      const ext = matches[1].split('/')[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const dir = path.join(process.cwd(), 'images');
      fs.mkdirSync(dir, { recursive: true });
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = path.join(dir, filename);
      fs.writeFileSync(filePath, buffer);
      storedContent = `/api/images/${filename}`;
    }
  }

  const existing = db
    .prepare('SELECT id FROM cells WHERE task_id=? AND row=? AND col=?')
    .get(taskId, rowIndex, colIndex);

  if (existing) {
    db.prepare('UPDATE cells SET type=?, content=? WHERE id=?').run(type, storedContent, existing.id);
  } else {
    db.prepare('INSERT INTO cells (task_id,row,col,type,content) VALUES (?,?,?,?,?)')
      .run(taskId, rowIndex, colIndex, type, storedContent);
  }

  return NextResponse.json({ content: storedContent, type });
}
