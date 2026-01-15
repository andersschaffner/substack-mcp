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

/**
 * Citation style options
 */
export type CitationStyle = 'APA' | 'MLA' | 'Chicago' | 'markdown';

/**
 * Citation result
 */
export interface Citation {
  /** Formatted citation string */
  citation: string;

  /** Style used */
  style: CitationStyle;

  /** Original post */
  post: SubstackPost;
}

/**
 * Disk cache structure for persisting to file
 */
export interface DiskCache {
  /** Cached posts */
  posts: SubstackPost[];

  /** Last fetch timestamp (ISO string for JSON serialization) */
  lastFetched: string;

  /** RSS feed URL */
  feedUrl: string;

  /** Cache version for migration */
  version: string;
}
