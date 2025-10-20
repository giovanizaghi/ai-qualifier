import * as cheerio from 'cheerio';
import { generateStructuredResponse } from './openai-client';

export interface DomainAnalysisResult {
  domain: string;
  name?: string;
  title?: string;
  description?: string;
  industry?: string;
  mainContent: string[];
  headings: string[];
  metaDescription?: string;
  keywords?: string[];
  error?: string;
}

export interface CompanyAnalysis {
  companyName: string;
  industry: string;
  description: string;
  targetMarket: string;
  keyOfferings: string[];
  companySize?: string;
}

/**
 * Normalize domain to ensure it has proper format
 */
function normalizeDomain(domain: string): string {
  // Remove protocol if present
  domain = domain.replace(/^https?:\/\//, '');
  // Remove trailing slash
  domain = domain.replace(/\/$/, '');
  // Remove www. if present for consistency
  domain = domain.replace(/^www\./, '');
  return domain;
}

/**
 * Get full URL from domain
 */
function getUrlFromDomain(domain: string): string {
  const normalized = normalizeDomain(domain);
  return `https://${normalized}`;
}

/**
 * Scrape website content from a domain
 */
export async function scrapeWebsite(domain: string): Promise<DomainAnalysisResult> {
  const url = getUrlFromDomain(domain);
  const normalizedDomain = normalizeDomain(domain);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ICP-Qualifier/1.0)',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script and style elements
    $('script, style, nav, footer, header').remove();

    // Extract title
    const title = $('title').text().trim() || undefined;

    // Extract meta description
    const metaDescription = 
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      undefined;

    // Extract keywords
    const keywordsContent = $('meta[name="keywords"]').attr('content');
    const keywords = keywordsContent
      ? keywordsContent.split(',').map((k) => k.trim())
      : undefined;

    // Extract all headings
    const headings: string[] = [];
    $('h1, h2, h3').each((_, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length < 200) {
        headings.push(text);
      }
    });

    // Extract main content from paragraphs
    const mainContent: string[] = [];
    $('p, li').each((_, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length > 20 && text.length < 500) {
        mainContent.push(text);
      }
    });

    return {
      domain: normalizedDomain,
      title,
      metaDescription,
      keywords,
      headings: headings.slice(0, 20), // Limit to first 20 headings
      mainContent: mainContent.slice(0, 30), // Limit to first 30 paragraphs
    };
  } catch (error) {
    console.error(`Error scraping ${domain}:`, error);
    return {
      domain: normalizedDomain,
      mainContent: [],
      headings: [],
      error: error instanceof Error ? error.message : 'Failed to scrape website',
    };
  }
}

/**
 * Analyze company using AI based on scraped data
 */
export async function analyzeCompanyWithAI(
  scrapedData: DomainAnalysisResult
): Promise<CompanyAnalysis> {
  if (scrapedData.error) {
    throw new Error(`Cannot analyze company: ${scrapedData.error}`);
  }

  const systemPrompt = `You are an expert business analyst. Analyze the provided website data and extract key information about the company.
Return a JSON object with the following structure:
{
  "companyName": "Company name",
  "industry": "Primary industry/vertical",
  "description": "2-3 sentence company description",
  "targetMarket": "Who they serve (e.g., 'Enterprise B2B', 'SMB SaaS', 'E-commerce brands')",
  "keyOfferings": ["main product/service 1", "main product/service 2"],
  "companySize": "estimated size if mentioned (e.g., 'Startup', 'Mid-market', 'Enterprise') or null"
}`;

  const userPrompt = `Analyze this company website data:

Domain: ${scrapedData.domain}
Title: ${scrapedData.title || 'N/A'}
Meta Description: ${scrapedData.metaDescription || 'N/A'}
Keywords: ${scrapedData.keywords?.join(', ') || 'N/A'}

Headings:
${scrapedData.headings.slice(0, 10).join('\n')}

Content Excerpts:
${scrapedData.mainContent.slice(0, 15).join('\n\n')}

Provide a comprehensive analysis.`;

  try {
    const analysis = await generateStructuredResponse<CompanyAnalysis>(
      systemPrompt,
      userPrompt,
      {},
      'gpt-4o-mini',
      0.3 // Lower temperature for more consistent analysis
    );

    return analysis;
  } catch (error) {
    console.error('Error analyzing company:', error);
    throw new Error(`Failed to analyze company: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Full domain analysis: scrape + AI analysis
 */
export async function analyzeCompanyDomain(domain: string): Promise<{
  scrapedData: DomainAnalysisResult;
  aiAnalysis: CompanyAnalysis;
}> {
  // Step 1: Scrape website
  const scrapedData = await scrapeWebsite(domain);

  if (scrapedData.error) {
    throw new Error(`Failed to scrape domain: ${scrapedData.error}`);
  }

  // Step 2: Analyze with AI
  const aiAnalysis = await analyzeCompanyWithAI(scrapedData);

  return {
    scrapedData,
    aiAnalysis,
  };
}
