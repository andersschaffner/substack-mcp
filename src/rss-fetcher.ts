import Parser from 'rss-parser';
import { SubstackPost } from './types.js';
import { htmlToText, cleanText } from './utils.js';

/**
 * Fetch and parse Substack RSS feed
 * @param feedUrl - The RSS feed URL
 * @param retries - Number of retries on failure
 * @returns Array of parsed blog posts
 */
export async function fetchSubstackFeed(
  feedUrl: string,
  retries: number = 3
): Promise<SubstackPost[]> {
  const parser = new Parser({
    customFields: {
      item: [
        ['content:encoded', 'contentEncoded'],
        ['dc:creator', 'creator']
      ]
    }
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.error(`Fetching RSS feed (attempt ${attempt + 1}/${retries}): ${feedUrl}`);
      const feed = await parser.parseURL(feedUrl);

      const posts: SubstackPost[] = feed.items.map((item: any) => {
        const content = item.contentEncoded || item.content || '';
        const contentText = cleanText(htmlToText(content));

        return {
          id: item.guid || item.link || `post-${Date.now()}`,
          title: item.title || 'Untitled',
          link: item.link || '',
          description: item.contentSnippet || item.description || '',
          content: content,
          contentText: contentText,
          pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
          author: item.creator || item.author || 'Unknown',
          categories: item.categories || [],
          imageUrl: item.enclosure?.url
        };
      });

      console.error(`Successfully fetched ${posts.length} posts`);
      return posts;

    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt + 1} failed:`, error);

      // Wait before retrying (exponential backoff)
      if (attempt < retries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.error(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  throw new Error(`Failed to fetch RSS feed after ${retries} attempts: ${lastError?.message}`);
}
