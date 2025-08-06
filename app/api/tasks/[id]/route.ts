import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import db from '@/lib/db';

const baseColCount = 6;
const extraColCount = 2;

export const runtime = 'nodejs';

function cellId(col: number, row: number) {
  return `${String.fromCharCode(65 + col)}${row + 1}`;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const taskId = params.id;
  const meta = db.prepare('SELECT customerName, orderId, contactPerson, notes FROM tasks WHERE id=?').get(taskId) || {};
  const cells = db.prepare('SELECT row, col, type, content FROM cells WHERE task_id=?').all(taskId);
  const rows = cells.length ? Math.max(...cells.map((c: any) => c.row)) + 1 : 0;

  const baseData: any[] = [];
  const quotationExtraData: any[] = [];
  const productionExtraData: any[] = [];

  for (let r = 0; r < rows; r++) {
    baseData[r] = [];
    quotationExtraData[r] = [];
    productionExtraData[r] = [];
    for (let c = 0; c < baseColCount; c++) {
      const cell = cells.find((cell: any) => cell.row === r && cell.col === c);
      baseData[r][c] = { id: cellId(c, r), type: cell?.type || 'text', content: cell?.content || '' };
    }
    for (let c = 0; c < extraColCount; c++) {
      const qCell = cells.find((cell: any) => cell.row === r && cell.col === baseColCount + c);
      quotationExtraData[r][c] = { id: cellId(baseColCount + c, r), type: qCell?.type || 'text', content: qCell?.content || '' };
      const pCell = cells.find((cell: any) => cell.row === r && cell.col === baseColCount + extraColCount + c);
      productionExtraData[r][c] = { id: cellId(baseColCount + extraColCount + c, r), type: pCell?.type || 'text', content: pCell?.content || '' };
    }
  }

  return NextResponse.json({ meta, baseData, quotationExtraData, productionExtraData });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const taskId = params.id;
  const body = await req.json();

  if (body.meta) {
    const keys = Object.keys(body.meta);
    const values = keys.map((k) => body.meta[k]);
    const sets = keys.map((k) => `${k}=?`).join(', ');
    db.prepare(`UPDATE tasks SET ${sets} WHERE id=?`).run(...values, taskId);
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
      storedContent = `/images/${filename}`;
    }
  }

  const existing = db
    .prepare('SELECT id FROM cells WHERE task_id=? AND row=? AND col=?')
    .get(taskId, rowIndex, colIndex);

  if (existing) {
    db.prepare('UPDATE cells SET type=?, content=? WHERE id=?').run(type, storedContent, existing.id);
  } else {
    db.prepare('INSERT INTO cells (task_id,row,col,type,content) VALUES (?,?,?,?,?)').run(
      taskId,
      rowIndex,
      colIndex,
      type,
      storedContent
    );
  }

  return NextResponse.json({ content: storedContent, type });
}
