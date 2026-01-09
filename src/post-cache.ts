import { Document } from 'flexsearch';
import { SubstackPost } from './types.js';
import { fetchSubstackFeed } from './rss-fetcher.js';

/**
 * In-memory cache for Substack posts with search capabilities
 */
export class PostCache {
  private posts: SubstackPost[] = [];
  private searchIndex: Document<SubstackPost, true>;
  private lastFetched: Date | null = null;
  private readonly cacheTTL: number;
  private readonly feedUrl: string;

  constructor(feedUrl: string, cacheTTLMs: number = 1800000) {
    this.feedUrl = feedUrl;
    this.cacheTTL = cacheTTLMs;

    // Initialize FlexSearch index
    this.searchIndex = new Document({
      document: {
        id: 'id',
        index: ['title', 'contentText', 'description', 'author'],
        store: ['id', 'title', 'link', 'description', 'pubDate', 'author', 'categories']
      },
      tokenize: 'forward',
      context: {
        resolution: 9,
        depth: 3,
        bidirectional: true
      }
    });
  }

  /**
   * Initialize the cache by fetching posts
   */
  async initialize(): Promise<void> {
    console.error('Initializing post cache...');
    await this.refreshCache();
    console.error('Post cache initialized');
  }

  /**
   * Get all posts, refreshing if needed
   */
  async getPosts(): Promise<SubstackPost[]> {
    await this.ensureFreshCache();
    return this.posts;
  }

  /**
   * Search posts by query string
   * @param query - Search query
   * @param limit - Maximum number of results
   */
  async searchPosts(query: string, limit: number = 10): Promise<SubstackPost[]> {
    await this.ensureFreshCache();

    if (!query || query.trim() === '') {
      return this.posts.slice(0, limit);
    }

    try {
      const results = await this.searchIndex.searchAsync(query, {
        limit,
        enrich: true
      });

      // FlexSearch returns results per field, we need to merge and deduplicate
      const postIds = new Set<string>();
      const matchedPosts: SubstackPost[] = [];

      for (const fieldResult of results) {
        if (Array.isArray(fieldResult.result)) {
          for (const item of fieldResult.result) {
            if ('id' in item && !postIds.has(item.id as string)) {
              postIds.add(item.id as string);
              const post = this.posts.find(p => p.id === item.id);
              if (post) {
                matchedPosts.push(post);
              }
            }
          }
        }
      }

      return matchedPosts.slice(0, limit);
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Get post by exact or partial title match
   * @param title - Title to search for
   * @param exact - Require exact match
   */
  async getPostByTitle(title: string, exact: boolean = false): Promise<SubstackPost | null> {
    await this.ensureFreshCache();

    const lowerTitle = title.toLowerCase();

    if (exact) {
      return this.posts.find(p => p.title.toLowerCase() === lowerTitle) || null;
    } else {
      return this.posts.find(p => p.title.toLowerCase().includes(lowerTitle)) || null;
    }
  }

  /**
   * Get recent posts
   * @param limit - Number of posts to return
   * @param offset - Number of posts to skip
   */
  async getRecentPosts(limit: number = 10, offset: number = 0): Promise<SubstackPost[]> {
    await this.ensureFreshCache();

    // Posts are already sorted by date (newest first) from RSS feed
    return this.posts.slice(offset, offset + limit);
  }

  /**
   * Get post by URL
   * @param url - Post URL
   */
  async getPostByUrl(url: string): Promise<SubstackPost | null> {
    await this.ensureFreshCache();
    return this.posts.find(p => p.link === url) || null;
  }

  /**
   * Get posts within a date range
   * @param startDate - Start date
   * @param endDate - End date
   * @param limit - Maximum results
   */
  async getPostsByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 100
  ): Promise<SubstackPost[]> {
    await this.ensureFreshCache();

    return this.posts
      .filter(p => p.pubDate >= startDate && p.pubDate <= endDate)
      .slice(0, limit);
  }

  /**
   * Check if cache needs refresh and refresh if needed
   */
  private async ensureFreshCache(): Promise<void> {
    const now = Date.now();
    const age = this.lastFetched ? now - this.lastFetched.getTime() : Infinity;

    if (age > this.cacheTTL) {
      console.error('Cache is stale, refreshing...');
      await this.refreshCache();
    }
  }

  /**
   * Refresh the cache by fetching new posts
   */
  private async refreshCache(): Promise<void> {
    try {
      const posts = await fetchSubstackFeed(this.feedUrl);
      this.posts = posts;
      this.lastFetched = new Date();

      // Rebuild search index
      await this.rebuildSearchIndex();

      console.error(`Cache refreshed: ${posts.length} posts loaded`);
    } catch (error) {
      console.error('Failed to refresh cache:', error);
      // Don't throw - keep existing cache if refresh fails
      if (this.posts.length === 0) {
        throw error; // Only throw if we have no cache at all
      }
    }
  }

  /**
   * Rebuild the FlexSearch index with current posts
   */
  private async rebuildSearchIndex(): Promise<void> {
    // Clear existing index
    this.searchIndex = new Document({
      document: {
        id: 'id',
        index: ['title', 'contentText', 'description', 'author'],
        store: ['id', 'title', 'link', 'description', 'pubDate', 'author', 'categories']
      },
      tokenize: 'forward',
      context: {
        resolution: 9,
        depth: 3,
        bidirectional: true
      }
    });

    // Add all posts to index
    for (const post of this.posts) {
      await this.searchIndex.addAsync(post.id, post);
    }
  }
}
