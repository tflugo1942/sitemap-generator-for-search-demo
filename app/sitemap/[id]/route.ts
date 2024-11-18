import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const SITEMAP_DIR = path.join(process.cwd(), 'public', 'generated_sitemaps');

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  const { id } = params;
  const filePath = path.join(SITEMAP_DIR, `${id}.xml`);

  try {
    const sitemap = await fs.readFile(filePath, 'utf-8');
    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (error) {
    console.error('Error reading sitemap file:', error);
    return new Response('Sitemap not found', { status: 404 });
  }
}

// Add this type declaration to resolve the type error
export type RouteSegment = {
  params: { id: string };
};