# Substack MCP Server

A Model Context Protocol (MCP) server that indexes and enables searching of Substack blog posts. Built for the [Fejl 40](https://fejl40.substack.com/) publication.

## Overview

This MCP server fetches blog posts from a Substack RSS feed and provides tools for searching and querying the content through Claude Desktop. It includes full-text search, in-memory caching, and automatic refresh capabilities.

## Features

- **Full-text Search**: Search across post titles, content, and descriptions using FlexSearch
- **Persistent Disk Cache**: Saves posts to disk for instant startup (~/.cache/substack-mcp/)
- **Smart Caching**: In-memory cache with configurable TTL (default: 30 minutes)
- **Auto-refresh**: Automatically updates when cache expires
- **7 MCP Tools**:
  - `search_posts` - Search by keywords
  - `list_recent_posts` - Get most recent posts
  - `get_post_by_title` - Find by title
  - `get_post_by_url` - Get by URL
  - `get_posts_by_date_range` - Filter by date range
  - `generate_citation` - Generate formatted citations (APA, MLA, Chicago, markdown)
  - `export_to_markdown` - Export posts to markdown files

## Installation

### Prerequisites

- Node.js 18 or higher
- Claude Desktop app
- npm

### Setup

1. **Clone or download this repository**:
   ```bash
   git clone https://github.com/andersschaffner/substack-mcp.git
   cd substack-mcp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Configure Claude Desktop**:

   Add this to your Claude Desktop config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

   ```json
   {
     "mcpServers": {
       "substack-mcp": {
         "command": "node",
         "args": ["/absolute/path/to/substack-mcp/index.js"],
         "env": {
           "SUBSTACK_FEED_URL": "https://fejl40.substack.com/feed"
         }
       }
     }
   }
   ```

   **Important**: Replace `/absolute/path/to/substack-mcp/` with the actual path where you cloned the repo.

5. **Restart Claude Desktop**

## Configuration

### Environment Variables

- `SUBSTACK_FEED_URL` - The RSS feed URL for your Substack publication (required)
- `CACHE_TTL_MS` - Cache time-to-live in milliseconds (default: 1800000 = 30 minutes)

### Using with a Different Substack

To use with a different Substack publication, simply change the `SUBSTACK_FEED_URL` in your Claude Desktop config:

```json
"env": {
  "SUBSTACK_FEED_URL": "https://your-publication.substack.com/feed"
}
```

## Usage

Once installed and configured, you can ask Claude questions about your blog posts:

- "Search my blog posts about AI"
- "What have I written about product management?"
- "Show me my most recent blog posts"
- "Find my post about [specific topic]"
- "What did I write in December 2024?"

Claude will automatically use the MCP tools to search and retrieve your blog content.

## Available Tools

### search_posts
Search blog posts by keywords across title and content.

**Parameters:**
- `query` (string, required) - Search query
- `limit` (number, optional) - Maximum results (default: 10)

### list_recent_posts
List the most recent blog posts.

**Parameters:**
- `limit` (number, optional) - Number of posts (default: 10)
- `offset` (number, optional) - Posts to skip (default: 0)

### get_post_by_title
Get a specific post by exact or partial title match.

**Parameters:**
- `title` (string, required) - Post title or partial title
- `exact` (boolean, optional) - Require exact match (default: false)

### get_post_by_url
Retrieve a specific post by its URL.

**Parameters:**
- `url` (string, required) - Full URL of the Substack post

### get_posts_by_date_range
Get posts published within a date range.

**Parameters:**
- `start_date` (string, required) - Start date (ISO 8601 format)
- `end_date` (string, required) - End date (ISO 8601 format)
- `limit` (number, optional) - Maximum results (default: 100)

### generate_citation
Generate a formatted citation for a blog post.

**Parameters:**
- `url` (string, required) - URL of the blog post to cite
- `style` (string, optional) - Citation style: 'APA', 'MLA', 'Chicago', or 'markdown' (default: 'markdown')

**Example output:**
```json
{
  "citation": "[Post Title](https://fejl40.substack.com/...) by Anders Schaffner, December 15, 2024",
  "style": "markdown",
  "post": {
    "title": "Post Title",
    "link": "https://fejl40.substack.com/...",
    "author": "Anders Schaffner",
    "pubDate": "2024-12-15T..."
  }
}
```

### export_to_markdown
Export blog posts to a markdown file.

**Parameters:**
- `output_path` (string, required) - Output file path (e.g., ~/Desktop/posts.md)
- `query` (string, optional) - Search query to filter posts
- `start_date` (string, optional) - Start date filter (ISO 8601 format)
- `end_date` (string, optional) - End date filter (ISO 8601 format)
- `limit` (number, optional) - Maximum posts to export (default: 100)

**Example usage:**
- Export all posts: `export_to_markdown({ output_path: "~/Desktop/all-posts.md" })`
- Export AI-related posts: `export_to_markdown({ output_path: "~/Desktop/ai-posts.md", query: "AI" })`
- Export 2024 posts: `export_to_markdown({ output_path: "~/Desktop/2024.md", start_date: "2024-01-01", end_date: "2024-12-31" })`

## Development

### Scripts

- `npm run build` - Build the TypeScript project
- `npm run dev` - Build in watch mode
- `npm start` - Run the compiled server

### Project Structure

```
.
├── src/
│   ├── index.ts          # Main MCP server
│   ├── post-cache.ts     # Caching and search logic with disk persistence
│   ├── rss-fetcher.ts    # RSS feed parser
│   ├── citation.ts       # Citation formatting (APA, MLA, Chicago, markdown)
│   ├── export.ts         # Export to markdown/JSON
│   ├── types.ts          # TypeScript interfaces
│   └── utils.ts          # Helper functions
├── build.js              # esbuild configuration
├── package.json
├── tsconfig.json
└── index.js              # Compiled output
```

## How It Works

1. **Server Startup**: When Claude Desktop launches, it starts the MCP server
2. **Disk Cache Load**: Server attempts to load posts from disk cache (~/.cache/substack-mcp/posts.json)
3. **RSS Fetch**: If disk cache is missing or stale, fetches posts from the Substack RSS feed
4. **Indexing**: Posts are indexed with FlexSearch for fast searching
5. **Disk Persistence**: Posts are saved to disk cache for instant startup next time
6. **Memory Caching**: Posts are cached in memory with a 30-minute TTL
7. **Auto-refresh**: Cache automatically refreshes when it expires
8. **Tool Calls**: Claude calls the MCP tools when you ask about your blog

**Performance**: With disk cache, startup is nearly instant (< 1 second). Without disk cache, first startup takes 3-5 seconds to fetch RSS.

## Troubleshooting

### "Command not found" or server won't start

- Ensure the path in `claude_desktop_config.json` is absolute, not relative
- Verify Node.js is installed: `node --version`
- Check that `index.js` exists after running `npm run build`

### No posts found

- Verify the RSS feed URL is correct and accessible
- Check Claude's MCP logs: `~/Library/Logs/Claude/mcp*.log`
- Ensure the RSS feed has posts

### JSON parse errors

- Make sure you're using the latest build
- All logging should go to stderr, not stdout

## Technical Details

- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Build Tool**: esbuild
- **Search Engine**: FlexSearch
- **RSS Parser**: rss-parser
- **MCP SDK**: @modelcontextprotocol/sdk v1.25+

## License

ISC

## Author

Anders Schaffner

## Contributing

Feel free to open issues or submit pull requests for improvements!
