import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const SITEMAP_DIR = path.join(process.cwd(), 'public', 'generated_sitemaps');

// Define dynamic route handler
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ): Promise<Response> {
  const { id } = await context.params; // Extract 'id' from context.params
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