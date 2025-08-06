import { NextRequest, NextResponse } from 'next/server';
import { getSheet, updateMeta } from '../../../../lib/db';
import { defaultBaseData, defaultQuotationData, defaultProductionData, defaultMeta } from '../../../../lib/defaultData';
import { Row } from '../../../../lib/types';

export const runtime = 'nodejs';

function cellsToRows(cells: any[], mode: string): Row[] {
  const modeCells = cells.filter(c => c.mode === mode);
  const map: Record<number, any[]> = {};
  for (const cell of modeCells) {
    const match = cell.id.match(/([A-Z])(\d+)/);
    if (!match) continue;
    const col = match[1].charCodeAt(0) - 65; // 0-based
    const row = parseInt(match[2]) - 1;
    if (!map[row]) map[row] = [];
    map[row][col] = { id: cell.id, type: cell.type, content: cell.content };
  }
  return Object.keys(map).sort((a,b) => Number(a)-Number(b)).map(i => map[Number(i)]);
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const data = getSheet(params.id);
  if (!data) {
    return NextResponse.json({
      meta: defaultMeta,
      baseData: defaultBaseData,
      quotationData: defaultQuotationData,
      productionData: defaultProductionData
    });
  }
  const { sheet, cells } = data;
  return NextResponse.json({
    meta: {
      customerName: sheet.customerName,
      orderId: sheet.orderId,
      contactPerson: sheet.contactPerson,
      notes: sheet.notes
    },
    baseData: cellsToRows(cells, 'base'),
    quotationData: cellsToRows(cells, 'quotation'),
    productionData: cellsToRows(cells, 'production')
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const fields = await req.json();
  updateMeta(params.id, fields);
  return NextResponse.json({ ok: true });
}
