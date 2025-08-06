import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const filePath = path.join(process.cwd(), 'images', params.filename);
  if (!fs.existsSync(filePath)) {
    return new NextResponse('Not found', { status: 404 });
  }
  const file = await fs.promises.readFile(filePath);
  const ext = path.extname(params.filename).slice(1);
  const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  return new NextResponse(file, {
    headers: {
      'Content-Type': type,
    },
  });
}
