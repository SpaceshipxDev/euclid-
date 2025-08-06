import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  _req: Request,
  { params }: { params: { filename: string } }
) {
  const filePath = path.join(process.cwd(), 'images', params.filename);
  if (!fs.existsSync(filePath)) {
    return new NextResponse('Not Found', { status: 404 });
  }
  const file = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1);
  const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  return new NextResponse(file, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=31536000'
    }
  });
}
