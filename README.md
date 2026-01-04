# Bento MCP Server

A Model Context Protocol (MCP) server for [Bento](https://bentonow.com) - the email marketing and analytics platform. This server enables AI assistants like Claude, Cursor, and others to interact with your Bento account.

## Features

- **Subscriber Management** - Create, lookup, and update subscribers
- **Tagging** - Add and remove tags from subscribers
- **Event Tracking** - Track custom events and purchases
- **Field Management** - Manage custom subscriber fields
- **Email Sending** - Send transactional emails
- **Broadcasts** - Create and list email campaigns
- **Statistics** - Get site, segment, and report stats
- **Experimental** - Email validation, gender guessing, geolocation, and more

## Installation

```bash
npm install -g @bentonow/bento-mcp
```

Or run directly with npx:

```bash
npx @bentonow/bento-mcp
```

## Configuration

The server requires three environment variables:

| Variable | Description |
|----------|-------------|
| `BENTO_PUBLISHABLE_KEY` | Your Bento publishable API key |
| `BENTO_SECRET_KEY` | Your Bento secret API key |
| `BENTO_SITE_UUID` | Your Bento site UUID |

You can find these in your [Bento account settings](https://app.bentonow.com).

## Usage with Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "bento": {
      "command": "npx",
      "args": ["-y", "@bentonow/bento-mcp"],
      "env": {
        "BENTO_PUBLISHABLE_KEY": "your-publishable-key",
        "BENTO_SECRET_KEY": "your-secret-key",
        "BENTO_SITE_UUID": "your-site-uuid"
      }
    }
  }
}
```

## Usage with OpenCode

Add to your `opencode.json`:

```json
{
  "mcp": {
    "bento": {
      "type": "local",
      "command": ["npx", "-y", "@bentonow/bento-mcp"],
      "environment": {
        "BENTO_PUBLISHABLE_KEY": "your-publishable-key",
        "BENTO_SECRET_KEY": "your-secret-key",
        "BENTO_SITE_UUID": "your-site-uuid"
      }
    }
  }
}
```

## Usage with Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "bento": {
      "command": "npx",
      "args": ["-y", "@bentonow/bento-mcp"],
      "env": {
        "BENTO_PUBLISHABLE_KEY": "your-publishable-key",
        "BENTO_SECRET_KEY": "your-secret-key",
        "BENTO_SITE_UUID": "your-site-uuid"
      }
    }
  }
}
```

## Available Tools

### Subscriber Management

| Tool | Description |
|------|-------------|
| `bento_get_subscriber` | Look up a subscriber by email or UUID |
| `bento_create_subscriber` | Create a new subscriber |
| `bento_upsert_subscriber` | Create or update subscriber with fields and tags |
| `bento_add_subscriber` | Subscribe a user (triggers automations) |
| `bento_remove_subscriber` | Unsubscribe a user |

### Tagging

| Tool | Description |
|------|-------------|
| `bento_tag_subscriber` | Add a tag to a subscriber (triggers automations) |
| `bento_remove_tag` | Remove a tag from a subscriber |
| `bento_list_tags` | List all tags in your account |
| `bento_create_tag` | Create a new tag |

### Event Tracking

| Tool | Description |
|------|-------------|
| `bento_track_event` | Track a custom event |
| `bento_track_purchase` | Track a purchase (for LTV calculations) |

### Field Management

| Tool | Description |
|------|-------------|
| `bento_update_fields` | Update custom fields on a subscriber |
| `bento_list_fields` | List all custom fields |
| `bento_create_field` | Create a new custom field |

### Email & Broadcasts

| Tool | Description |
|------|-------------|
| `bento_send_email` | Send a transactional email |
| `bento_list_broadcasts` | List all broadcasts/campaigns |
| `bento_create_broadcast` | Create a new broadcast |
| `bento_batch_import_subscribers` | Bulk import subscribers (up to 1000) |

### Statistics

| Tool | Description |
|------|-------------|
| `bento_get_site_stats` | Get overall site statistics |
| `bento_get_segment_stats` | Get statistics for a segment |
| `bento_get_report_stats` | Get statistics for a broadcast/report |

### Experimental

| Tool | Description |
|------|-------------|
| `bento_validate_email` | Validate an email address |
| `bento_guess_gender` | Guess gender from a first name |
| `bento_geolocate_ip` | Get location data for an IP address |
| `bento_check_blacklist` | Check if domain/IP is blacklisted |
| `bento_moderate_content` | AI content moderation |

### Forms

| Tool | Description |
|------|-------------|
| `bento_get_form_responses` | Get responses for a Bento form |

## Example Prompts

Once configured, you can ask your AI assistant things like:

- "Look up the subscriber john@example.com in Bento"
- "Add the tag 'premium-user' to jane@example.com"
- "Track a purchase of $99.99 for order #12345 for customer@example.com"
- "Show me the site statistics from Bento"
- "Create a new broadcast email for users tagged as 'newsletter'"
- "What are all the tags in my Bento account?"

## Development

```bash
# Clone the repository
git clone https://github.com/bentonow/bento-mcp.git
cd bento-mcp

# Install dependencies
npm install

# Build
npm run build

# Run locally
BENTO_PUBLISHABLE_KEY=xxx BENTO_SECRET_KEY=xxx BENTO_SITE_UUID=xxx npm start
```

## License

MIT - see [LICENSE](LICENSE)

## Links

- [Bento](https://bentonow.com) - Email marketing platform
- [Bento Node SDK](https://github.com/bentonow/bento-node-sdk) - The underlying SDK
- [Model Context Protocol](https://modelcontextprotocol.io) - MCP specification
