[![Glama MCP Server](https://glama.ai/mcp/servers/willowswt/youtube-transcript-leads-mcp/badges/score.svg)](https://glama.ai/mcp/servers/willowswt/youtube-transcript-leads-mcp) [![Apify Store](https://img.shields.io/badge/Apify_Store-youtube_transcript_rag_scraper-00C853?logo=apify&logoColor=white)](https://apify.com/church_of_loujess/youtube-transcript-rag-scraper) [![MCP Protocol](https://img.shields.io/badge/MCP-2025--06--18_Streamable_HTTP_%26_stdio-blue)](https://modelcontextprotocol.io) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# YouTube Transcript RAG & Channel Business Email Leads MCP Server

MCP server for extracting YouTube transcripts, timestamped RAG chunks, and verified creator business inquiry emails and sponsor links via Apify Actors.

> **Hosted Apify MCP Gateway URL:** `https://mcp.apify.com/?actors=church_of_loujess/youtube-transcript-rag-scraper`  
> **Get Your Free API Token (`$5.00/mo` Free Credit Included):** [Apify Console -> Settings -> Integrations](https://console.apify.com/settings/integrations)  
> **Primary Apify Store Actor:** [https://apify.com/church_of_loujess/youtube-transcript-rag-scraper](https://apify.com/church_of_loujess/youtube-transcript-rag-scraper)

## Included MCP Tools

| Tool Name | Backing Apify Actor | Description |
| :--- | :--- | :--- |
| `extract_youtube_transcript_and_rag` | `youtube-transcript-rag-scraper` | Extract full multi-language YouTube transcripts, timestamped chapters, metadata, and token-bounded RAG chunks with deep-links from video URLs or IDs. |
| `find_youtube_channel_emails` | `youtube-channel-email-leads-scraper` | Discover YouTube channels by niche keyword or @handle and extract verified business inquiry emails, sponsor links, and social handles. |

## Quick Start (Claude Desktop, Cursor, Windsurf, VS Code)

### Option 1: Local `stdio` via `npx`
```json
{
  "mcpServers": {
    "youtube-transcript-leads-mcp": {
      "command": "npx",
      "args": ["-y", "github:willowswt/youtube-transcript-leads-mcp"],
      "env": {
        "APIFY_API_TOKEN": "<YOUR_APIFY_API_TOKEN>"
      }
    }
  }
}
```

### Option 2: Remote Hosted Apify MCP Gateway (Zero Install)
```json
{
  "mcpServers": {
    "youtube-transcript-leads-mcp": {
      "url": "https://mcp.apify.com/?actors=church_of_loujess/youtube-transcript-rag-scraper",
      "headers": {
        "Authorization": "Bearer <YOUR_APIFY_API_TOKEN>"
      }
    }
  }
}
```

## Free Trial vs. Paid Apify Plan

- **Apify Free Tier (`$5.00/mo` included credit):** Returns up to `5` items per run (`items 1-2` 100% unmasked, `items 3-5` preview-masked) so you can verify live email/data quality risk-free.
- **Apify Starter (`$29/mo`) & Higher:** Unlocks unlimited batch sizes (`1,000+` items), `100%` unmasked emails and payloads, and up to `76%` lower per-item rates. Upgrade anytime at [https://console.apify.com/billing/subscription](https://console.apify.com/billing/subscription).
