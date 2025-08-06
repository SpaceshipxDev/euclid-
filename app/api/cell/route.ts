import { NextRequest, NextResponse } from 'next/server';
import { upsertCell } from '../../../lib/db';
import { Cell } from '../../../lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { sheetId, mode, cellId, type, content } = await req.json();
  const cell: Cell = { id: cellId, type, content };
  upsertCell(sheetId, mode, cell);
  return NextResponse.json({ ok: true });
}
