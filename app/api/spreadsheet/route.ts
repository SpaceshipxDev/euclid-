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

export async function GET() {
  const spreadsheetId = 1;
  const meta = db.prepare('SELECT customerName, orderId, contactPerson, notes FROM spreadsheets WHERE id=?').get(spreadsheetId);
  const cells = db.prepare('SELECT row, col, mode, type, content FROM cells WHERE spreadsheet_id=?').all(spreadsheetId);
  const rows = cells.length ? Math.max(...cells.map(c => c.row)) + 1 : 0;

  const baseData: any[] = [];
  const quotationExtraData: any[] = [];
  const productionExtraData: any[] = [];

  for (let r = 0; r < rows; r++) {
    baseData[r] = [];
    for (let c = 0; c < baseColCount; c++) {
      const cell = cells.find((cell: any) => cell.mode === 'base' && cell.row === r && cell.col === c);
      baseData[r][c] = { id: cellId(c, r), type: cell?.type || 'text', content: cell?.content || '' };
    }
    quotationExtraData[r] = [];
    for (let c = 0; c < extraColCount; c++) {
      const cell = cells.find((cell: any) => cell.mode === 'quotation' && cell.row === r && cell.col === c);
      quotationExtraData[r][c] = { id: cellId(baseColCount + c, r), type: cell?.type || 'text', content: cell?.content || '' };
    }
    productionExtraData[r] = [];
    for (let c = 0; c < extraColCount; c++) {
      const cell = cells.find((cell: any) => cell.mode === 'production' && cell.row === r && cell.col === c);
      productionExtraData[r][c] = { id: cellId(baseColCount + c, r), type: cell?.type || 'text', content: cell?.content || '' };
    }
  }

  return NextResponse.json({ meta, baseData, quotationExtraData, productionExtraData });
}

export async function POST(request: Request) {
  const body = await request.json();
  const spreadsheetId = 1;

  if (body.meta) {
    const keys = Object.keys(body.meta);
    const values = keys.map((k) => body.meta[k]);
    const sets = keys.map((k) => `${k}=?`).join(', ');
    db.prepare(`UPDATE spreadsheets SET ${sets} WHERE id=?`).run(...values, spreadsheetId);
    return NextResponse.json({ ok: true });
  }

  const { rowIndex, colIndex, content, type, mode } = body;
  let storedContent = content;

  if (type === 'image' && content.startsWith('data:')) {
    const matches = content.match(/^data:(image\/\w+);base64,(.+)$/);
    if (matches) {
      const ext = matches[1].split('/')[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const dir = path.join(process.cwd(), 'public', 'images');
      fs.mkdirSync(dir, { recursive: true });
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = path.join(dir, filename);
      fs.writeFileSync(filePath, buffer);
      storedContent = `/images/${filename}`;
    }
  }

  const existing = db.prepare('SELECT id FROM cells WHERE spreadsheet_id=? AND row=? AND col=? AND mode=?')
    .get(spreadsheetId, rowIndex, colIndex, mode);

  if (existing) {
    db.prepare('UPDATE cells SET type=?, content=? WHERE id=?').run(type, storedContent, existing.id);
  } else {
    db.prepare('INSERT INTO cells (spreadsheet_id,row,col,mode,type,content) VALUES (?,?,?,?,?,?)')
      .run(spreadsheetId, rowIndex, colIndex, mode, type, storedContent);
  }

  return NextResponse.json({ content: storedContent, type });
}
