import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { mkdirSync } from 'fs';
import { SubstackPost } from './types.js';
import { htmlToText } from './utils.js';

/**
 * Export posts to markdown file
 * @param posts - Posts to export
 * @param outputPath - Output file path
 * @param options - Export options
 */
export function exportToMarkdown(
  posts: SubstackPost[],
  outputPath: string,
  options: {
    includeMetadata?: boolean;
    includeHtmlContent?: boolean;
  } = {}
): void {
  // Validate and resolve path
  const safePath = validateAndResolvePath(outputPath);

  // Ensure directory exists
  const dir = dirname(safePath);
  try {
    mkdirSync(dir, { recursive: true });
  } catch (error) {
    // Directory might already exist, that's okay
  }

  // Generate markdown content
  const markdown = generateMarkdown(posts, options);

  // Write to file
  try {
    writeFileSync(safePath, markdown, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validate and resolve file path for security
 * Prevents path traversal attacks
 */
function validateAndResolvePath(outputPath: string): string {
  // Resolve ~ to home directory
  let resolvedPath = outputPath;
  if (outputPath.startsWith('~/')) {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (!homeDir) {
      throw new Error('Cannot resolve home directory');
    }
    resolvedPath = outputPath.replace('~', homeDir);
  }

  // Resolve to absolute path
  const absolutePath = resolve(resolvedPath);

  // Ensure file has .md extension
  if (!absolutePath.endsWith('.md')) {
    throw new Error('Output file must have .md extension');
  }

  // Prevent writing to system directories
  const dangerousPaths = ['/etc', '/usr', '/bin', '/sbin', '/System', '/Library'];
  for (const dangerous of dangerousPaths) {
    if (absolutePath.startsWith(dangerous)) {
      throw new Error(`Cannot write to system directory: ${dangerous}`);
    }
  }

  return absolutePath;
}

/**
 * Generate markdown content from posts
 */
function generateMarkdown(
  posts: SubstackPost[],
  options: {
    includeMetadata?: boolean;
    includeHtmlContent?: boolean;
  }
): string {
  const { includeMetadata = true, includeHtmlContent = false } = options;

  let markdown = '# Blog Posts Export\n\n';
  markdown += `Generated: ${new Date().toLocaleString()}\n`;
  markdown += `Total Posts: ${posts.length}\n\n`;
  markdown += '---\n\n';

  for (const post of posts) {
    markdown += formatPostAsMarkdown(post, includeMetadata, includeHtmlContent);
    markdown += '\n---\n\n';
  }

  return markdown;
}

/**
 * Format a single post as markdown
 */
function formatPostAsMarkdown(
  post: SubstackPost,
  includeMetadata: boolean,
  includeHtmlContent: boolean
): string {
  let markdown = `# ${post.title}\n\n`;

  if (includeMetadata) {
    markdown += `**Author:** ${post.author}\n\n`;
    markdown += `**Published:** ${post.pubDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}\n\n`;
    markdown += `**URL:** [${post.link}](${post.link})\n\n`;

    if (post.categories && post.categories.length > 0) {
      markdown += `**Categories:** ${post.categories.join(', ')}\n\n`;
    }

    if (post.imageUrl) {
      markdown += `**Featured Image:** ![](${post.imageUrl})\n\n`;
    }

    markdown += '---\n\n';
  }

  // Add description
  if (post.description) {
    markdown += `## Summary\n\n${post.description}\n\n`;
  }

  // Add content
  markdown += `## Content\n\n`;
  if (includeHtmlContent) {
    // Convert HTML to readable text
    const textContent = htmlToText(post.content);
    markdown += textContent;
  } else {
    markdown += post.contentText;
  }

  markdown += '\n\n';

  return markdown;
}

/**
 * Export posts to JSON file
 * @param posts - Posts to export
 * @param outputPath - Output file path
 */
export function exportToJSON(posts: SubstackPost[], outputPath: string): void {
  // Validate and resolve path
  const safePath = validateAndResolvePath(outputPath.replace(/\.md$/, '.json'));

  // Ensure directory exists
  const dir = dirname(safePath);
  try {
    mkdirSync(dir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  // Convert dates to ISO strings for JSON serialization
  const jsonPosts = posts.map(post => ({
    ...post,
    pubDate: post.pubDate.toISOString()
  }));

  // Write to file
  try {
    writeFileSync(safePath, JSON.stringify(jsonPosts, null, 2), 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write file: ${error instanceof Error ? error.message : String(error)}`);
  }
}
