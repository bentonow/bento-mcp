#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Analytics } from "@bentonow/bento-node-sdk";

// Initialize Bento client from environment variables
function getBentoClient(): Analytics {
  const publishableKey = process.env.BENTO_PUBLISHABLE_KEY;
  const secretKey = process.env.BENTO_SECRET_KEY;
  const siteUuid = process.env.BENTO_SITE_UUID;

  if (!publishableKey || !secretKey || !siteUuid) {
    throw new Error(
      "Missing required environment variables: BENTO_PUBLISHABLE_KEY, BENTO_SECRET_KEY, BENTO_SITE_UUID"
    );
  }

  return new Analytics({
    authentication: {
      publishableKey,
      secretKey,
    },
    siteUuid,
  });
}

// Create MCP server
const server = new McpServer({
  name: "bento",
  version: "1.0.0",
});

// Helper to format responses
function formatResponse(data: unknown): string {
  if (data === null || data === undefined) {
    return "No data returned";
  }
  if (typeof data === "boolean") {
    return data ? "Success" : "Operation failed";
  }
  if (typeof data === "number") {
    return `Count: ${data}`;
  }
  return JSON.stringify(data, null, 2);
}

// Helper for error handling
function handleError(error: unknown): string {
  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }
  return `Error: ${String(error)}`;
}

// =============================================================================
// SUBSCRIBER TOOLS
// =============================================================================

server.tool(
  "bento_get_subscriber",
  "Look up a Bento subscriber by email or UUID. Returns subscriber details including tags, fields, and subscription status.",
  {
    email: z.string().email().optional().describe("Subscriber email address"),
    uuid: z.string().optional().describe("Subscriber UUID"),
  },
  async ({ email, uuid }) => {
    try {
      if (!email && !uuid) {
        return {
          content: [{ type: "text", text: "Either email or uuid is required" }],
        };
      }

      const bento = getBentoClient();
      const subscriber = await bento.V1.Subscribers.getSubscribers(
        email ? { email } : { uuid: uuid! }
      );

      return {
        content: [{ type: "text", text: formatResponse(subscriber) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

server.tool(
  "bento_create_subscriber",
  "Create a new subscriber in Bento. If the subscriber already exists, returns the existing subscriber.",
  {
    email: z.string().email().describe("Email address for the new subscriber"),
  },
  async ({ email }) => {
    try {
      const bento = getBentoClient();
      const subscriber = await bento.V1.Subscribers.createSubscriber({ email });

      return {
        content: [{ type: "text", text: formatResponse(subscriber) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

server.tool(
  "bento_upsert_subscriber",
  "Create or update a subscriber with custom fields and tags. This is the most flexible way to manage subscribers.",
  {
    email: z.string().email().describe("Subscriber email address"),
    fields: z
      .record(z.unknown())
      .optional()
      .describe(
        "Custom fields to set on the subscriber (e.g., { firstName: 'John', company: 'Acme' })"
      ),
    tags: z
      .string()
      .optional()
      .describe("Comma-separated list of tags to add (e.g., 'lead,newsletter')"),
    removeTags: z
      .string()
      .optional()
      .describe("Comma-separated list of tags to remove"),
  },
  async ({ email, fields, tags, removeTags }) => {
    try {
      const bento = getBentoClient();
      const subscriber = await bento.V1.upsertSubscriber({
        email,
        fields,
        tags,
        remove_tags: removeTags,
      });

      return {
        content: [{ type: "text", text: formatResponse(subscriber) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

server.tool(
  "bento_add_subscriber",
  "Subscribe a user to your Bento account. This triggers automations and is processed via the batch API (1-3 min delay).",
  {
    email: z.string().email().describe("Subscriber email address"),
    fields: z
      .record(z.unknown())
      .optional()
      .describe("Custom fields to set on the subscriber"),
  },
  async ({ email, fields }) => {
    try {
      const bento = getBentoClient();
      const result = await bento.V1.addSubscriber({ email, fields });

      return {
        content: [{ type: "text", text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

server.tool(
  "bento_remove_subscriber",
  "Unsubscribe a user from your Bento account. This triggers automations.",
  {
    email: z.string().email().describe("Subscriber email address to unsubscribe"),
  },
  async ({ email }) => {
    try {
      const bento = getBentoClient();
      const result = await bento.V1.removeSubscriber({ email });

      return {
        content: [{ type: "text", text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

// =============================================================================
// TAGGING TOOLS
// =============================================================================

server.tool(
  "bento_tag_subscriber",
  "Add a tag to a subscriber. Creates the tag and/or subscriber if they don't exist. Triggers automations (1-3 min delay).",
  {
    email: z.string().email().describe("Subscriber email address"),
    tagName: z.string().describe("Name of the tag to add"),
  },
  async ({ email, tagName }) => {
    try {
      const bento = getBentoClient();
      const result = await bento.V1.tagSubscriber({ email, tagName });

      return {
        content: [{ type: "text", text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

server.tool(
  "bento_remove_tag",
  "Remove a tag from a subscriber.",
  {
    email: z.string().email().describe("Subscriber email address"),
    tagName: z.string().describe("Name of the tag to remove"),
  },
  async ({ email, tagName }) => {
    try {
      const bento = getBentoClient();
      const result = await bento.V1.Commands.removeTag({ email, tagName });

      return {
        content: [{ type: "text", text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

server.tool(
  "bento_list_tags",
  "List all tags in your Bento account.",
  {},
  async () => {
    try {
      const bento = getBentoClient();
      const tags = await bento.V1.Tags.getTags();

      return {
        content: [{ type: "text", text: formatResponse(tags) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

server.tool(
  "bento_create_tag",
  "Create a new tag in your Bento account.",
  {
    name: z.string().describe("Name of the tag to create"),
  },
  async ({ name }) => {
    try {
      const bento = getBentoClient();
      const tags = await bento.V1.Tags.createTag({ name });

      return {
        content: [{ type: "text", text: formatResponse(tags) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

// =============================================================================
// EVENT TRACKING TOOLS
// =============================================================================

server.tool(
  "bento_track_event",
  "Track a custom event for a subscriber. Events can trigger automations. Common event types: $pageView, $signup, $login, or any custom event name.",
  {
    email: z.string().email().describe("Subscriber email address"),
    type: z
      .string()
      .describe(
        "Event type/name (e.g., '$pageView', 'signup_completed', 'feature_used')"
      ),
    fields: z
      .record(z.unknown())
      .optional()
      .describe("Custom fields to update on the subscriber"),
    details: z
      .record(z.unknown())
      .optional()
      .describe("Additional event details (e.g., { url: '/pricing', source: 'campaign' })"),
  },
  async ({ email, type, fields, details }) => {
    try {
      const bento = getBentoClient();
      const result = await bento.V1.track({
        email,
        type,
        fields: fields as Record<string, unknown>,
        details,
      });

      return {
        content: [{ type: "text", text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

server.tool(
  "bento_track_purchase",
  "Track a purchase event for a subscriber. Used for calculating LTV (Lifetime Value). Amount should be in cents (e.g., 9999 = $99.99).",
  {
    email: z.string().email().describe("Subscriber email address"),
    orderId: z
      .string()
      .describe("Unique order/transaction ID to prevent duplicates"),
    amount: z
      .number()
      .describe("Purchase amount in cents (e.g., 9999 for $99.99)"),
    currency: z
      .string()
      .default("USD")
      .describe("Currency code (default: USD)"),
    cart: z
      .object({
        abandonedCheckoutUrl: z.string().optional(),
        items: z
          .array(
            z.object({
              productId: z.string().optional(),
              productSku: z.string().optional(),
              productName: z.string().optional(),
              quantity: z.number().optional(),
              productPrice: z.number().optional(),
            })
          )
          .optional(),
      })
      .optional()
      .describe("Optional cart details including items"),
  },
  async ({ email, orderId, amount, currency, cart }) => {
    try {
      const bento = getBentoClient();
      const result = await bento.V1.trackPurchase({
        email,
        purchaseDetails: {
          unique: { key: orderId },
          value: { currency, amount },
          cart: cart
            ? {
                abandoned_checkout_url: cart.abandonedCheckoutUrl,
                items: cart.items?.map((item) => ({
                  product_id: item.productId,
                  product_sku: item.productSku,
                  product_name: item.productName,
                  quantity: item.quantity,
                  product_price: item.productPrice,
                })) as unknown as Array<{ [key: string]: string }>,
              }
            : undefined,
        },
      });

      return {
        content: [{ type: "text", text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

// =============================================================================
// FIELD TOOLS
// =============================================================================

server.tool(
  "bento_update_fields",
  "Update custom fields on a subscriber. Triggers automations.",
  {
    email: z.string().email().describe("Subscriber email address"),
    fields: z
      .record(z.unknown())
      .describe(
        "Fields to update (e.g., { firstName: 'John', company: 'Acme', plan: 'pro' })"
      ),
  },
  async ({ email, fields }) => {
    try {
      const bento = getBentoClient();
      const result = await bento.V1.updateFields({ email, fields });

      return {
        content: [{ type: "text", text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

server.tool(
  "bento_list_fields",
  "List all custom fields defined in your Bento account.",
  {},
  async () => {
    try {
      const bento = getBentoClient();
      const fields = await bento.V1.Fields.getFields();

      return {
        content: [{ type: "text", text: formatResponse(fields) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

server.tool(
  "bento_create_field",
  "Create a new custom field in your Bento account. The key is automatically converted to a display name (e.g., 'firstName' becomes 'First Name').",
  {
    key: z
      .string()
      .describe(
        "Field key in camelCase or snake_case (e.g., 'firstName', 'company_name')"
      ),
  },
  async ({ key }) => {
    try {
      const bento = getBentoClient();
      const fields = await bento.V1.Fields.createField({ key });

      return {
        content: [{ type: "text", text: formatResponse(fields) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

// =============================================================================
// STATISTICS TOOLS
// =============================================================================

server.tool(
  "bento_get_site_stats",
  "Get overall statistics for your Bento site including subscriber counts, broadcast counts, and engagement rates.",
  {},
  async () => {
    try {
      const bento = getBentoClient();
      const stats = await bento.V1.Stats.getSiteStats();

      return {
        content: [{ type: "text", text: formatResponse(stats) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

server.tool(
  "bento_get_segment_stats",
  "Get statistics for a specific segment including subscriber count and engagement metrics.",
  {
    segmentId: z.string().describe("The segment ID to get stats for"),
  },
  async ({ segmentId }) => {
    try {
      const bento = getBentoClient();
      const stats = await bento.V1.Stats.getSegmentStats(segmentId);

      return {
        content: [{ type: "text", text: formatResponse(stats) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

server.tool(
  "bento_get_report_stats",
  "Get statistics for a specific email report/broadcast including opens, clicks, and unsubscribes.",
  {
    reportId: z.string().describe("The report/broadcast ID to get stats for"),
  },
  async ({ reportId }) => {
    try {
      const bento = getBentoClient();
      const stats = await bento.V1.Stats.getReportStats(reportId);

      return {
        content: [{ type: "text", text: formatResponse(stats) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

// =============================================================================
// EMAIL TOOLS
// =============================================================================

server.tool(
  "bento_send_email",
  "Send a transactional email to a subscriber. The 'from' address must be an authorized Author in your Bento account.",
  {
    to: z.string().email().describe("Recipient email address"),
    from: z
      .string()
      .email()
      .describe("Sender email address (must be an authorized Author in Bento)"),
    subject: z
      .string()
      .describe("Email subject line (can include {{ personalization }} tags)"),
    htmlBody: z
      .string()
      .describe(
        "HTML content of the email (can include {{ personalization }} tags)"
      ),
    transactional: z
      .boolean()
      .default(true)
      .describe(
        "If true, sends even to unsubscribed users (use for receipts, password resets, etc.)"
      ),
    personalizations: z
      .record(z.string())
      .optional()
      .describe(
        "Key-value pairs for personalization tags (e.g., { name: 'John', orderNumber: '12345' })"
      ),
  },
  async ({ to, from, subject, htmlBody, transactional, personalizations }) => {
    try {
      const bento = getBentoClient();
      const result = await bento.V1.Batch.sendTransactionalEmails({
        emails: [
          {
            to,
            from,
            subject,
            html_body: htmlBody,
            transactional,
            personalizations,
          },
        ],
      });

      return {
        content: [
          {
            type: "text",
            text: result > 0 ? "Email sent successfully" : "Failed to send email",
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

// =============================================================================
// BROADCAST TOOLS
// =============================================================================

server.tool(
  "bento_list_broadcasts",
  "List all email broadcasts/campaigns in your Bento account.",
  {},
  async () => {
    try {
      const bento = getBentoClient();
      const broadcasts = await bento.V1.Broadcasts.getBroadcasts();

      return {
        content: [{ type: "text", text: formatResponse(broadcasts) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

server.tool(
  "bento_create_broadcast",
  "Create a new email broadcast/campaign. The broadcast will be created as a draft.",
  {
    name: z.string().describe("Internal name for the broadcast"),
    subject: z
      .string()
      .describe("Email subject line (can include {{ personalization }} tags)"),
    content: z.string().describe("Email content (HTML, plain text, or markdown)"),
    type: z
      .enum(["plain", "html", "markdown"])
      .default("html")
      .describe("Content type"),
    fromName: z.string().describe("Sender name"),
    fromEmail: z
      .string()
      .email()
      .describe("Sender email (must be an authorized Author)"),
    inclusiveTags: z
      .string()
      .optional()
      .describe("Comma-separated tags - subscribers must have at least one"),
    exclusiveTags: z
      .string()
      .optional()
      .describe("Comma-separated tags - subscribers with these tags are excluded"),
    segmentId: z.string().optional().describe("Target a specific segment"),
    batchSizePerHour: z
      .number()
      .optional()
      .describe("Limit sending rate (emails per hour)"),
  },
  async ({
    name,
    subject,
    content,
    type,
    fromName,
    fromEmail,
    inclusiveTags,
    exclusiveTags,
    segmentId,
    batchSizePerHour,
  }) => {
    try {
      const bento = getBentoClient();
      const broadcasts = await bento.V1.Broadcasts.createBroadcast([
        {
          name,
          subject,
          content,
          type,
          from: { name: fromName, email: fromEmail },
          inclusive_tags: inclusiveTags,
          exclusive_tags: exclusiveTags,
          segment_id: segmentId,
          batch_size_per_hour: batchSizePerHour ?? 1000,
        },
      ]);

      return {
        content: [{ type: "text", text: formatResponse(broadcasts) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

// =============================================================================
// SEQUENCE & WORKFLOW TOOLS
// =============================================================================

server.tool(
  "bento_list_sequences",
  "List all email sequences in your Bento account. Returns each sequence with its name, ID, and email templates (id, subject, stats). Use this to discover what automated email sequences exist and get template IDs for reading/editing content.",
  {},
  async () => {
    try {
      const bento = getBentoClient();
      const sequences = await bento.V1.Sequences.getSequences();

      return {
        content: [{ type: "text", text: formatResponse(sequences) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

server.tool(
  "bento_list_workflows",
  "List all workflows (automation flows) in your Bento account. Returns each workflow with its name, ID, and email templates (id, subject, stats). Use this to discover what automated workflows exist and get template IDs for reading/editing content.",
  {},
  async () => {
    try {
      const bento = getBentoClient();
      const workflows = await bento.V1.Workflows.getWorkflows();

      return {
        content: [{ type: "text", text: formatResponse(workflows) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

server.tool(
  "bento_get_email_template",
  "Get the full content of an email template by ID. Returns the template's name, subject, HTML content, and stats. Use this after listing sequences/workflows to read the actual email content for review or editing.",
  {
    id: z
      .number()
      .describe(
        "The email template ID (numeric ID from the email_templates array in sequences or workflows)"
      ),
  },
  async ({ id }) => {
    try {
      const bento = getBentoClient();
      const template = await bento.V1.EmailTemplates.getEmailTemplate({ id });

      return {
        content: [{ type: "text", text: formatResponse(template) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

server.tool(
  "bento_update_email_template",
  "Update an email template's subject line and/or HTML content. Use this to improve email copy, fix typos, update designs, or make any changes to emails in sequences or workflows. Changes take effect immediately for future sends.",
  {
    id: z.number().describe("The email template ID to update"),
    subject: z
      .string()
      .optional()
      .describe("New subject line for the email (can include {{ liquid }} personalization tags)"),
    html: z
      .string()
      .optional()
      .describe(
        "New HTML content for the email body (can include {{ liquid }} personalization tags). Must include {{ visitor.unsubscribe_url }} for compliance."
      ),
  },
  async ({ id, subject, html }) => {
    try {
      if (!subject && !html) {
        return {
          content: [
            { type: "text", text: "Either subject or html (or both) is required to update" },
          ],
        };
      }

      const bento = getBentoClient();
      const template = await bento.V1.EmailTemplates.updateEmailTemplate({
        id,
        subject,
        html,
      });

      return {
        content: [{ type: "text", text: formatResponse(template) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

// =============================================================================
// BATCH TOOLS
// =============================================================================

server.tool(
  "bento_batch_import_subscribers",
  "Import multiple subscribers at once (up to 1000). Does NOT trigger automations - use for bulk imports only.",
  {
    subscribers: z
      .array(
        z.object({
          email: z.string().email(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          tags: z.string().optional(),
        }).passthrough()
      )
      .describe("Array of subscribers to import (max 1000)"),
  },
  async ({ subscribers }) => {
    try {
      if (subscribers.length > 1000) {
        return {
          content: [
            { type: "text", text: "Error: Maximum 1000 subscribers per batch" },
          ],
        };
      }

      const bento = getBentoClient();
      const count = await bento.V1.Batch.importSubscribers({
        subscribers: subscribers.map((s) => {
          const { firstName, lastName, ...rest } = s;
          return {
            ...rest,
            first_name: firstName,
            last_name: lastName,
          };
        }),
      });

      return {
        content: [
          { type: "text", text: `Successfully imported ${count} subscribers` },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

// =============================================================================
// EXPERIMENTAL TOOLS
// =============================================================================

server.tool(
  "bento_validate_email",
  "Validate an email address using Bento's email validation service. Checks for syntax, deliverability, and spam traps.",
  {
    email: z.string().email().describe("Email address to validate"),
    name: z.string().optional().describe("Name associated with the email"),
    ip: z.string().optional().describe("IP address of the user"),
    userAgent: z.string().optional().describe("User agent string"),
  },
  async ({ email, name, ip, userAgent }) => {
    try {
      const bento = getBentoClient();
      const isValid = await bento.V1.Experimental.validateEmail({
        email,
        name,
        ip,
        userAgent,
      });

      return {
        content: [
          {
            type: "text",
            text: isValid
              ? "Email is valid"
              : "Email appears to be invalid or risky",
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

server.tool(
  "bento_guess_gender",
  "Guess the gender based on a first name. Returns gender and confidence score.",
  {
    name: z.string().describe("First name to analyze"),
  },
  async ({ name }) => {
    try {
      const bento = getBentoClient();
      const result = await bento.V1.Experimental.guessGender({ name });

      return {
        content: [{ type: "text", text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

server.tool(
  "bento_geolocate_ip",
  "Get geographic location data for an IP address.",
  {
    ip: z.string().describe("IP address to geolocate"),
  },
  async ({ ip }) => {
    try {
      const bento = getBentoClient();
      const location = await bento.V1.Experimental.geoLocateIP(ip);

      return {
        content: [{ type: "text", text: formatResponse(location) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

server.tool(
  "bento_check_blacklist",
  "Check if a domain or IP address is on any email blacklists.",
  {
    domain: z.string().optional().describe("Domain to check"),
    ip: z.string().optional().describe("IP address to check"),
  },
  async ({ domain, ip }) => {
    try {
      if (!domain && !ip) {
        return {
          content: [{ type: "text", text: "Either domain or ip is required" }],
        };
      }

      const bento = getBentoClient();
      const result = await bento.V1.Experimental.getBlacklistStatus(
        domain ? { domain } : { ipAddress: ip! }
      );

      return {
        content: [{ type: "text", text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

server.tool(
  "bento_moderate_content",
  "Check content for potential issues using AI content moderation.",
  {
    content: z.string().describe("Content to moderate"),
  },
  async ({ content }) => {
    try {
      const bento = getBentoClient();
      const result = await bento.V1.Experimental.getContentModeration(content);

      return {
        content: [{ type: "text", text: formatResponse(result) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

// =============================================================================
// FORM TOOLS
// =============================================================================

server.tool(
  "bento_get_form_responses",
  "Get all responses for a specific Bento form.",
  {
    formId: z.string().describe("The form ID to get responses for"),
  },
  async ({ formId }) => {
    try {
      const bento = getBentoClient();
      const responses = await bento.V1.Forms.getResponses(formId);

      return {
        content: [{ type: "text", text: formatResponse(responses) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleError(error) }],
      };
    }
  }
);

// =============================================================================
// RUN SERVER
// =============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Bento MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
