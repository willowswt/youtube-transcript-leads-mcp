#!/usr/bin/env node
/**
 * YouTube Transcript RAG & Channel Business Email Leads MCP Server (youtube-transcript-leads-mcp)
 * Dual-Transport Model Context Protocol (MCP) Server:
 *   1. Local stdio transport (`npx -y github:willowswt/youtube-transcript-leads-mcp`)
 *   2. Streamable HTTP transport (`--http`, or via Apify MCP Gateway `https://mcp.apify.com/?actors=church_of_loujess/youtube-transcript-rag-scraper`)
 *
 * Schema discovery (`initialize`, `tools/list`, `ping`, `resources/list`, `prompts/list`)
 * responds locally with zero latency and requires no API token.
 * Live tool execution (`tools/call`) executes the underlying Apify Actor synchronously via:
 *   POST https://api.apify.com/v2/acts/<actorId>/run-sync-get-dataset-items
 * Get your free Apify API token ($5.00/mo free credit included) at:
 *   https://console.apify.com/settings/integrations
 * Primary Apify Store Actor:
 *   https://apify.com/church_of_loujess/youtube-transcript-rag-scraper
 */

import http from 'node:http';
import readline from 'node:readline';

const SERVER_NAME = "youtube-transcript-leads-mcp";
const SERVER_VERSION = '1.0.0';
const STORE_URL = "https://apify.com/church_of_loujess/youtube-transcript-rag-scraper";
const APIFY_MCP_GATEWAY = "https://mcp.apify.com/?actors=church_of_loujess/youtube-transcript-rag-scraper";
const SUPPORTED_PROTOCOLS = new Set(['2025-06-18', '2025-03-26', '2024-11-05']);
const SERVER_INSTRUCTIONS = "MCP server for extracting YouTube transcripts, timestamped RAG chunks, and verified creator business inquiry emails and sponsor links via Apify Actors. Store docs: https://apify.com/church_of_loujess/youtube-transcript-rag-scraper";

const ACTOR_BY_TOOL = {
  "extract_youtube_transcript_and_rag": "church_of_loujess~youtube-transcript-rag-scraper",
  "find_youtube_channel_emails": "church_of_loujess~youtube-channel-email-leads-scraper"
};
const FIXED_ARGS_BY_TOOL = {};
const TOOLS = [
  {
    "name": "extract_youtube_transcript_and_rag",
    "description": "Extract full multi-language YouTube transcripts, timestamped chapters, metadata, and token-bounded RAG chunks with deep-links from video URLs or IDs.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "videoUrl": {
          "type": "string",
          "description": "Single YouTube video URL, Short URL, or 11-character Video ID."
        },
        "videoUrls": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "List of YouTube video URLs or IDs for batch extraction."
        },
        "targetLanguage": {
          "type": "string",
          "default": "en",
          "description": "Preferred ISO transcript language code (e.g. 'en', 'es', 'fr')."
        },
        "chunkSizeWords": {
          "type": "integer",
          "default": 200,
          "description": "Words per semantic RAG chunk with timestamp deep-links."
        },
        "includeMetadata": {
          "type": "boolean",
          "default": true,
          "description": "Include title, channel metadata, views, and chapters."
        }
      }
    },
    "annotations": {
      "title": "Extract Youtube Transcript And Rag",
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  },
  {
    "name": "find_youtube_channel_emails",
    "description": "Discover YouTube channels by niche keyword or @handle and extract verified business inquiry emails, sponsor links, and social handles.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "searchQueries": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Niche keywords or topics (e.g. ['AI automation agency', 'SaaS marketing'])."
        },
        "channelUrls": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "Specific YouTube channel URLs, @handles, or UC channel IDs."
        },
        "maxResults": {
          "type": "integer",
          "default": 10,
          "description": "Maximum unique channels to discover and enrich."
        },
        "scanRecentVideos": {
          "type": "integer",
          "default": 4,
          "description": "Number of recent video descriptions to scan per channel."
        },
        "crawlExternalLinks": {
          "type": "boolean",
          "default": true,
          "description": "Follow Linktree/Beacons and contact pages for emails."
        },
        "onlyWithEmails": {
          "type": "boolean",
          "default": false,
          "description": "Filter out channels without any discovered email."
        }
      }
    },
    "annotations": {
      "title": "Find Youtube Channel Emails",
      "readOnlyHint": true,
      "destructiveHint": false,
      "idempotentHint": true,
      "openWorldHint": true
    }
  }
];

async function executeApifyActor(toolName, args) {
    const token = (
        process.env.APIFY_API_TOKEN ||
        process.env.APIFY_TOKEN ||
        process.env.MCP_API_TOKEN ||
        ''
    ).trim();

    const actorId = ACTOR_BY_TOOL[toolName];
    if (!token) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            status: 'configuration_required',
                            server: SERVER_NAME,
                            tool: toolName,
                            apifyActor: actorId,
                            message:
                                'APIFY_API_TOKEN is required to run live extractions. Create a free Apify account ' +
                                '($5.00/mo free credit included) and copy your token from https://console.apify.com/settings/integrations, ' +
                                `or connect via the hosted Apify MCP Gateway: ${APIFY_MCP_GATEWAY}`,
                            apifyMcpGateway: APIFY_MCP_GATEWAY,
                            apifyStoreUrl: STORE_URL,
                        },
                        null,
                        2
                    ),
                },
            ],
            isError: true,
        };
    }

    const mergedInput = { ...(args || {}), ...(FIXED_ARGS_BY_TOOL[toolName] || {}) };
    const runUrl = `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?timeout=120`;

    const resp = await fetch(runUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(mergedInput),
    });

    if (!resp.ok) {
        const errTxt = await resp.text();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: `Apify Actor HTTP ${resp.status}: ${errTxt.slice(0, 400)}`,
                        actor: actorId,
                        storeUrl: STORE_URL,
                    }),
                },
            ],
            isError: true,
        };
    }

    const items = await resp.json();
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(
                    {
                        tool: toolName,
                        apifyActor: actorId,
                        itemCount: Array.isArray(items) ? items.length : 1,
                        items,
                    },
                    null,
                    2
                ),
            },
        ],
        isError: false,
    };
}

async function handleRpcMessage(msg) {
    if (!msg || typeof msg !== 'object' || msg.jsonrpc !== '2.0') {
        return { jsonrpc: '2.0', id: msg?.id ?? null, error: { code: -32600, message: 'Invalid JSON-RPC 2.0 request' } };
    }
    const method = String(msg.method || '');
    const hasId = msg.id !== undefined && msg.id !== null;
    if (!hasId || method.startsWith('notifications/')) {
        return null;
    }
    const id = msg.id;
    const params = msg.params && typeof msg.params === 'object' ? msg.params : {};

    if (method === 'initialize') {
        const clientPv = String(params.protocolVersion || '2025-06-18');
        const protocolVersion = SUPPORTED_PROTOCOLS.has(clientPv) ? clientPv : '2025-06-18';
        return {
            jsonrpc: '2.0',
            id,
            result: {
                protocolVersion,
                capabilities: {
                    tools: { listChanged: false },
                    resources: { subscribe: false, listChanged: false },
                    prompts: { listChanged: false },
                },
                serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
                instructions: SERVER_INSTRUCTIONS,
            },
        };
    }

    if (method === 'ping') return { jsonrpc: '2.0', id, result: {} };
    if (method === 'tools/list') return { jsonrpc: '2.0', id, result: { tools: TOOLS } };
    if (method === 'resources/list') return { jsonrpc: '2.0', id, result: { resources: [] } };
    if (method === 'resources/templates/list') return { jsonrpc: '2.0', id, result: { resourceTemplates: [] } };
    if (method === 'prompts/list') return { jsonrpc: '2.0', id, result: { prompts: [] } };

    if (method === 'tools/call') {
        const toolName = String(params.name || '').trim();
        const toolArgs = params.arguments && typeof params.arguments === 'object' ? params.arguments : {};
        const toolDef = TOOLS.find((t) => t.name === toolName);
        if (!toolDef) {
            return { jsonrpc: '2.0', id, error: { code: -32602, message: `Unknown tool: ${toolName}` } };
        }
        for (const reqField of toolDef.inputSchema?.required || []) {
            if (toolArgs[reqField] === undefined || toolArgs[reqField] === null || String(toolArgs[reqField]).trim() === '') {
                return { jsonrpc: '2.0', id, error: { code: -32602, message: `Missing required parameter: ${reqField}` } };
            }
        }
        try {
            const toolResult = await executeApifyActor(toolName, toolArgs);
            return { jsonrpc: '2.0', id, result: toolResult };
        } catch (err) {
            return {
                jsonrpc: '2.0',
                id,
                result: {
                    content: [{ type: 'text', text: JSON.stringify({ error: String(err?.message || err) }) }],
                    isError: true,
                },
            };
        }
    }

    return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
}

const isHttpMode = process.argv.includes('--http') || process.env.MCP_TRANSPORT === 'http';

if (isHttpMode) {
    const port = Number(process.env.PORT || 4321);
    const server = http.createServer(async (req, res) => {
        const urlPath = (req.url || '/').split('?')[0];
        if (req.method === 'GET' && (urlPath === '/' || urlPath === '/health')) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', server: SERVER_NAME, version: SERVER_VERSION, tools: TOOLS.map((t) => t.name) }));
            return;
        }
        if (urlPath === '/mcp' && req.method === 'POST') {
            const chunks = [];
            for await (const ch of req) chunks.push(ch);
            let body;
            try {
                body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            } catch {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }));
                return;
            }
            const out = await handleRpcMessage(body);
            if (!out) {
                res.writeHead(202);
                res.end();
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(out));
            return;
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    });
    server.listen(port, '0.0.0.0', () => {
        console.error(`[${SERVER_NAME}] HTTP MCP server listening on 0.0.0.0:${port}/mcp`);
    });
} else {
    const rl = readline.createInterface({ input: process.stdin, terminal: false });
    rl.on('line', async (line) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        let parsed;
        try {
            parsed = JSON.parse(trimmed);
        } catch {
            process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n');
            return;
        }
        if (Array.isArray(parsed)) {
            const responses = [];
            for (const item of parsed) {
                const r = await handleRpcMessage(item);
                if (r) responses.push(r);
            }
            if (responses.length > 0) process.stdout.write(JSON.stringify(responses) + '\n');
            return;
        }
        const resp = await handleRpcMessage(parsed);
        if (resp) process.stdout.write(JSON.stringify(resp) + '\n');
    });
}
