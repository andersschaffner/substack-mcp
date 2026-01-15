import { SubstackPost, CitationStyle, Citation } from './types.js';

/**
 * Generate a citation for a blog post
 * @param post - The blog post to cite
 * @param style - Citation style (APA, MLA, Chicago, markdown)
 * @returns Formatted citation
 */
export function generateCitation(post: SubstackPost, style: CitationStyle): Citation {
  const citation = formatCitation(post, style);

  return {
    citation,
    style,
    post
  };
}

/**
 * Format citation based on style
 */
function formatCitation(post: SubstackPost, style: CitationStyle): string {
  const year = post.pubDate.getFullYear();
  const month = post.pubDate.toLocaleString('en-US', { month: 'long' });
  const day = post.pubDate.getDate();

  switch (style) {
    case 'APA':
      return formatAPA(post, year, month, day);

    case 'MLA':
      return formatMLA(post, year, month, day);

    case 'Chicago':
      return formatChicago(post, year, month, day);

    case 'markdown':
      return formatMarkdown(post, year, month, day);

    default:
      return formatMarkdown(post, year, month, day);
  }
}

/**
 * Format in APA style (simplified)
 * Author, A. (Year, Month Day). Title. Publication. URL
 */
function formatAPA(post: SubstackPost, year: number, month: string, day: number): string {
  const author = formatAuthorAPA(post.author);
  const date = `${year}, ${month} ${day}`;
  const title = post.title;
  const publication = extractPublication(post.link);

  return `${author} (${date}). ${title}. ${publication}. ${post.link}`;
}

/**
 * Format in MLA style (simplified)
 * Author. "Title." Publication, Day Month Year, URL.
 */
function formatMLA(post: SubstackPost, year: number, month: string, day: number): string {
  const author = post.author;
  const title = post.title;
  const publication = extractPublication(post.link);
  const date = `${day} ${month} ${year}`;

  return `${author}. "${title}." ${publication}, ${date}, ${post.link}.`;
}

/**
 * Format in Chicago style (simplified)
 * Author. "Title." Publication. Month Day, Year. URL.
 */
function formatChicago(post: SubstackPost, year: number, month: string, day: number): string {
  const author = post.author;
  const title = post.title;
  const publication = extractPublication(post.link);
  const date = `${month} ${day}, ${year}`;

  return `${author}. "${title}." ${publication}. ${date}. ${post.link}.`;
}

/**
 * Format in markdown style
 * [Title](URL) by Author, Month Day, Year
 */
function formatMarkdown(post: SubstackPost, year: number, month: string, day: number): string {
  const author = post.author;
  const title = post.title;
  const date = `${month} ${day}, ${year}`;

  return `[${title}](${post.link}) by ${author}, ${date}`;
}

/**
 * Format author name for APA (Last, First Initial.)
 * Simplified - just uses the full name as-is
 */
function formatAuthorAPA(author: string): string {
  // For now, just return the author name as-is
  // A full implementation would parse "First Last" to "Last, F."
  return author;
}

/**
 * Extract publication name from Substack URL
 * e.g., https://fejl40.substack.com/p/... -> "Fejl 40"
 */
function extractPublication(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Extract subdomain (e.g., "fejl40" from "fejl40.substack.com")
    const subdomain = hostname.split('.')[0];

    // Capitalize and format (fejl40 -> Fejl 40)
    return formatPublicationName(subdomain);
  } catch {
    return 'Substack';
  }
}

/**
 * Format publication name (basic capitalization)
 */
function formatPublicationName(name: string): string {
  // Simple capitalization - just capitalize first letter
  // A more sophisticated version could handle special cases
  return name.charAt(0).toUpperCase() + name.slice(1);
}
