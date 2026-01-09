/**
 * Represents a blog post from Substack
 */
export interface SubstackPost {
  /** Unique identifier (GUID from RSS) */
  id: string;

  /** Post title */
  title: string;

  /** URL to the full article */
  link: string;

  /** Brief excerpt/summary */
  description: string;

  /** Full HTML content */
  content: string;

  /** Plain text version for searching */
  contentText: string;

  /** Publication date */
  pubDate: Date;

  /** Author name */
  author: string;

  /** Tags/categories */
  categories: string[];

  /** Featured image URL (optional) */
  imageUrl?: string;
}

/**
 * Cache for storing feed data
 */
export interface FeedCache {
  /** Cached posts */
  posts: SubstackPost[];

  /** Last fetch timestamp */
  lastFetched: Date;

  /** RSS feed URL */
  feedUrl: string;
}

/**
 * Search result with relevance score
 */
export interface SearchResult {
  /** The matching post */
  post: SubstackPost;

  /** Relevance score (optional) */
  score?: number;
}
