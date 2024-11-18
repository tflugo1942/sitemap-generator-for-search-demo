import { NextRequest, NextResponse } from 'next/server';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { promises as fs } from 'fs';
import path from 'path';
import fetch from 'node-fetch';

interface SitemapUrl {
  loc: string;
  [key: string]: string | undefined;
}

const GITHUB_API_URL = 'https://api.github.com/repos/medkrimi/sitemap-generator-for-search-demo/docs'; // Replace with your repo URL
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Replace with your GitHub personal access token

// Ensure the directory exists for temporary storage, in case you want to test locally
const SITEMAP_DIR = path.join('/tmp', 'generated_sitemaps');

function determineContentType(url: string): string {
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/').filter(Boolean);

  // Common content type indicators
  const contentTypeIndicators = ['locations', 'doctors', 'conditions-and-treatments', 'forms', 'about'];

  for (const part of pathParts) {
    const lowercasePart = part.toLowerCase();
    if (contentTypeIndicators.includes(lowercasePart)) {
      return lowercasePart;
    }
    // Check for plural forms
    if (lowercasePart.endsWith('s') && contentTypeIndicators.includes(lowercasePart.slice(0, -1))) {
      return lowercasePart;
    }
  }

  // If no specific content type is found, use the first part of the path
  return pathParts[0] || 'other';
}

async function uploadToGitHub(sitemapXml: string, filePath: string) {
  // Get base64 encoded content for the file
  const encodedContent = Buffer.from(sitemapXml).toString('base64');

  // Create the API request to upload the file to GitHub
  const response = await fetch(GITHUB_API_URL + `/${filePath}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Add generated sitemap ${filePath}`,
      content: encodedContent,
      branch: 'main', // Replace with your desired branch
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub upload failed: ${response.statusText}`);
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const { sitemapUrl, subsetSize } = await request.json();

    const response = await fetch(sitemapUrl);
    const xmlData = await response.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    const result = parser.parse(xmlData);

    if (!result.urlset || !Array.isArray(result.urlset.url)) {
      throw new Error('Invalid sitemap format');
    }

    const urls = result.urlset.url.map((url: SitemapUrl) => typeof url === 'string' ? url : url.loc);

    // Group URLs by content type
    const groupedUrls: { [key: string]: string[] } = {};
    urls.forEach((url: string) => {
      const contentType = determineContentType(url);
      if (!groupedUrls[contentType]) {
        groupedUrls[contentType] = [];
      }
      groupedUrls[contentType].push(url);
    });

    // Get subset for each group
    const subsetUrls: string[] = [];
    Object.entries(groupedUrls).forEach(([contentType, groupUrls]) => {
      const groupSubset = groupUrls.slice(0, subsetSize);
      subsetUrls.push(...groupSubset);
      console.log(`Content type: ${contentType}, Total URLs: ${groupUrls.length}, Subset size: ${groupSubset.length}`);
    });

    // Generate new sitemap XML
    const builder = new XMLBuilder({
      arrayNodeName: "url",
      format: true,
      ignoreAttributes: false,
      suppressEmptyNode: true
    });
    const newSitemap = builder.build({
      '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
      urlset: {
        '@_xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
        url: subsetUrls.map(url => ({ loc: url }))
      }
    });

    // Generate a unique file name for the sitemap
    const sitemapId = Date.now().toString();
    const filePath = `${sitemapId}.xml`;

    // Optionally, write the sitemap to local filesystem (if needed for testing)
    await fs.mkdir(SITEMAP_DIR, { recursive: true });
    const localFilePath = path.join(SITEMAP_DIR, filePath);
    await fs.writeFile(localFilePath, newSitemap);

    // Upload to GitHub
    await uploadToGitHub(newSitemap, filePath);

    return NextResponse.json({
      success: true,
      sitemapId,
      filePath,
      totalUrls: urls.length,
      subsetSize: subsetUrls.length,
      githubUrl: `https://medkrimi.github.io/${filePath}`, // Replace with the GitHub Pages URL
    });
  } catch (error) {
    console.error('Error processing sitemap:', error);
    return NextResponse.json({ error: 'Failed to process sitemap' }, { status: 500 });
  }
}
