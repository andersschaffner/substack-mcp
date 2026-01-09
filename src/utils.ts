import { convert } from 'html-to-text';

/**
 * Convert HTML content to plain text for search indexing
 * @param html - HTML content to convert
 * @returns Plain text version
 */
export function htmlToText(html: string): string {
  try {
    return convert(html, {
      wordwrap: false,
      preserveNewlines: false,
      selectors: [
        { selector: 'a', options: { ignoreHref: true } },
        { selector: 'img', format: 'skip' },
        { selector: 'script', format: 'skip' },
        { selector: 'style', format: 'skip' }
      ]
    });
  } catch (error) {
    console.error('Error converting HTML to text:', error);
    return '';
  }
}

/**
 * Truncate text to a specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

/**
 * Clean and normalize text for search
 * @param text - Text to clean
 * @returns Cleaned text
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/\n+/g, ' ')  // Replace newlines with spaces
    .trim();
}
