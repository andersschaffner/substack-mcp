import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { PostCache } from './post-cache.js';
import { truncate } from './utils.js';

// Configuration
const FEED_URL = process.env.SUBSTACK_FEED_URL || 'https://fejl40.substack.com/feed';
const CACHE_TTL = parseInt(process.env.CACHE_TTL_MS || '1800000'); // 30 minutes

// Initialize cache
const cache = new PostCache(FEED_URL, CACHE_TTL);

// Create MCP server
const server = new Server(
  {
    name: 'substack-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const tools = [
  {
    name: 'search_posts',
    description: 'Search blog posts by keywords across title, content, and description',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to find in posts',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 10)',
          default: 10,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_recent_posts',
    description: 'List the most recent blog posts',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of posts to return (default: 10)',
          default: 10,
        },
        offset: {
          type: 'number',
          description: 'Number of posts to skip (default: 0)',
          default: 0,
        },
      },
    },
  },
  {
    name: 'get_post_by_title',
    description: 'Get a specific post by exact or partial title match',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Post title or partial title to search for',
        },
        exact: {
          type: 'boolean',
          description: 'Require exact match (default: false)',
          default: false,
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'get_post_by_url',
    description: 'Retrieve a specific post by its URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Full URL of the Substack post',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'get_posts_by_date_range',
    description: 'Get posts published within a date range',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: {
          type: 'string',
          description: 'Start date (ISO 8601 format, e.g., 2024-01-01)',
        },
        end_date: {
          type: 'string',
          description: 'End date (ISO 8601 format, e.g., 2024-12-31)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 100)',
          default: 100,
        },
      },
      required: ['start_date', 'end_date'],
    },
  },
];

// Register list_tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Register call_tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_posts': {
        const query = z.string().parse(args.query);
        const limit = z.number().optional().default(10).parse(args.limit);

        const results = await cache.searchPosts(query, limit);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                results.map(post => ({
                  title: post.title,
                  link: post.link,
                  description: truncate(post.description, 200),
                  author: post.author,
                  pubDate: post.pubDate.toISOString(),
                  categories: post.categories,
                })),
                null,
                2
              ),
            },
          ],
        };
      }

      case 'list_recent_posts': {
        const limit = z.number().optional().default(10).parse(args.limit);
        const offset = z.number().optional().default(0).parse(args.offset);

        const results = await cache.getRecentPosts(limit, offset);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                results.map(post => ({
                  title: post.title,
                  link: post.link,
                  description: truncate(post.description, 200),
                  author: post.author,
                  pubDate: post.pubDate.toISOString(),
                  categories: post.categories,
                })),
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_post_by_title': {
        const title = z.string().parse(args.title);
        const exact = z.boolean().optional().default(false).parse(args.exact);

        const post = await cache.getPostByTitle(title, exact);

        if (!post) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: 'Post not found' }),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  title: post.title,
                  link: post.link,
                  description: post.description,
                  content: post.content,
                  contentText: post.contentText,
                  author: post.author,
                  pubDate: post.pubDate.toISOString(),
                  categories: post.categories,
                  imageUrl: post.imageUrl,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_post_by_url': {
        const url = z.string().url().parse(args.url);

        const post = await cache.getPostByUrl(url);

        if (!post) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: 'Post not found' }),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  title: post.title,
                  link: post.link,
                  description: post.description,
                  content: post.content,
                  contentText: post.contentText,
                  author: post.author,
                  pubDate: post.pubDate.toISOString(),
                  categories: post.categories,
                  imageUrl: post.imageUrl,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_posts_by_date_range': {
        const startDate = new Date(z.string().parse(args.start_date));
        const endDate = new Date(z.string().parse(args.end_date));
        const limit = z.number().optional().default(100).parse(args.limit);

        const results = await cache.getPostsByDateRange(startDate, endDate, limit);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                results.map(post => ({
                  title: post.title,
                  link: post.link,
                  description: truncate(post.description, 200),
                  author: post.author,
                  pubDate: post.pubDate.toISOString(),
                  categories: post.categories,
                })),
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: errorMessage }),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  console.error('Starting Substack MCP server...');
  console.error(`Feed URL: ${FEED_URL}`);
  console.error(`Cache TTL: ${CACHE_TTL}ms`);

  try {
    // Initialize cache
    await cache.initialize();
    console.error('Cache initialized successfully');

    // Connect to stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('Substack MCP server running on stdio');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('\nShutting down...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('\nShutting down...');
  await server.close();
  process.exit(0);
});

main();
