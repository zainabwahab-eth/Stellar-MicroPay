/**
 * src/swagger.js
 * OpenAPI 3.0 specification for Stellar MicroPay backend API.
 */

"use strict";

const path = require("path");

const swaggerJsdoc = require("swagger-jsdoc");

// Route files scanned for JSDoc `@swagger` annotations. Federation, analytics,
// and turrets operations are documented in their route files; the remaining
// operations are defined statically in `definition.paths` below.
const routesGlob = `${path.join(__dirname, "routes").split(path.sep).join("/")}/*.js`;

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Stellar MicroPay API",
      version: "1.0.0",
      description:
        "Backend API for Stellar MicroPay — instant micropayments on the Stellar network.\n\n" +
        "## Rate Limiting\n\n" +
        "All endpoints are rate-limited. Three limiters apply:\n\n" +
        "| Limiter | Window | Limit | Routes |\n" +
        "|---------|--------|-------|--------|\n" +
        "| Global | 15 minutes | 100 req/IP | All routes |\n" +
        "| Strict | 1 minute | 20 req/IP | `/api/analytics/*`, `/api/tips/*`, `/api/webhooks/*`, `/federation`, `/api/accounts/register` |\n" +
        "| Payment | 1 minute | 10 req/IP | `/api/payments/*`, `/api/turrets/*` |\n\n" +
        "Every response includes the following headers so clients can implement back-off:\n\n" +
        "| Header | Description |\n" +
        "|--------|-------------|\n" +
        "| `RateLimit-Limit` | Maximum requests allowed in the current window |\n" +
        "| `RateLimit-Remaining` | Requests remaining before the limit is reached |\n" +
        "| `RateLimit-Reset` | Seconds until the window resets |\n\n" +
        "When the limit is exceeded the server returns **HTTP 429** with `{ \"error\": \"Too many requests, please try again later.\" }`. " +
        "Clients should read `RateLimit-Remaining` on each response and add exponential back-off when the value approaches 0.",
      contact: {
        name: "Stellar MicroPay",
        url: "https://github.com/Emmy123222/Stellar-MicroPay",
      },
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Local development server",
      },
    ],
    components: {
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string", description: "Error message" },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" },
          },
        },
        PaymentRecord: {
          type: "object",
          properties: {
            id: { type: "string", description: "Horizon operation ID" },
            type: {
              type: "string",
              enum: ["sent", "received"],
              description: "Direction relative to the queried account",
            },
            amount: { type: "string", description: "Amount sent/received" },
            asset: { type: "string", description: "Asset code (e.g. XLM)" },
            from: { type: "string", description: "Sender public key" },
            to: { type: "string", description: "Recipient public key" },
            memo: { type: "string", description: "Optional memo text" },
            createdAt: { type: "string", format: "date-time" },
            transactionHash: { type: "string" },
            pagingToken: { type: "string" },
          },
        },
        PaymentStats: {
          type: "object",
          properties: {
            publicKey: { type: "string" },
            totalSentXLM: { type: "string" },
            totalReceivedXLM: { type: "string" },
            sentCount: { type: "integer" },
            receivedCount: { type: "integer" },
            totalTransactions: { type: "integer" },
          },
        },
        AnalyticsSummary: {
          type: "object",
          properties: {
            publicKey: { type: "string" },
            totalSentXLM: { type: "string" },
            totalReceivedXLM: { type: "string" },
            uniqueCounterparties: { type: "integer" },
            averageTransactionSize: { type: "string" },
            totalTransactions: { type: "integer" },
            comparison: {
              type: "object",
              description: "Week-over-week comparison of payment count and volume",
              properties: {
                thisWeekCount: { type: "integer" },
                lastWeekCount: { type: "integer" },
                countChangePercent: { type: "integer" },
                thisWeekVolume: { type: "string" },
                lastWeekVolume: { type: "string" },
                volumeChangePercent: { type: "integer" },
              },
            },
          },
        },
        TopRecipient: {
          type: "object",
          properties: {
            address: { type: "string", description: "Recipient Stellar public key" },
            totalXLMSent: { type: "string", description: "Total XLM sent to the recipient" },
          },
        },
        ActivityDay: {
          type: "object",
          properties: {
            day: {
              type: "string",
              description: "Day of week name",
              example: "Monday",
            },
            dayIndex: {
              type: "integer",
              description: "Day of week index (0 = Sunday, 6 = Saturday)",
              minimum: 0,
              maximum: 6,
            },
            transactionCount: {
              type: "integer",
              description: "Number of payments on that day",
            },
          },
        },
        CohortCounterpartySummary: {
          type: "object",
          properties: {
            oneTimeCounterparties: { type: "integer" },
            repeatCounterparties: { type: "integer" },
            totalCounterparties: { type: "integer" },
          },
        },
        CohortPeriod: {
          type: "object",
          properties: {
            periodStart: { type: "string", format: "date-time" },
            periodEnd: { type: "string", format: "date-time" },
            label: { type: "string" },
            period: { type: "string", enum: ["month", "week"] },
            sent: {
              type: "object",
              properties: {
                paymentCount: { type: "integer" },
                totalXLM: { type: "string" },
                counterparties: { $ref: "#/components/schemas/CohortCounterpartySummary" },
              },
            },
            received: {
              type: "object",
              properties: {
                paymentCount: { type: "integer" },
                totalXLM: { type: "string" },
                counterparties: { $ref: "#/components/schemas/CohortCounterpartySummary" },
              },
            },
            totalCounterparties: { type: "integer" },
            repeatRate: { type: "integer" },
          },
        },
        CohortBreakdown: {
          type: "object",
          properties: {
            publicKey: { type: "string" },
            period: { type: "string", enum: ["month", "week"] },
            periods: { type: "integer" },
            range: {
              type: "object",
              properties: {
                start: { type: "string", format: "date-time", nullable: true },
                end: { type: "string", format: "date-time", nullable: true },
              },
            },
            cohorts: {
              type: "array",
              items: { $ref: "#/components/schemas/CohortPeriod" },
            },
          },
        },
        PaymentStreamEvent: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { type: "string", enum: ["sent", "received"] },
            amount: { type: "string" },
            asset: { type: "string" },
            from: { type: "string" },
            to: { type: "string" },
            memo: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            transactionHash: { type: "string" },
            pagingToken: { type: "string" },
          },
        },
        AccountBalance: {
          type: "object",
          properties: {
            assetCode: { type: "string" },
            balance: { type: "string" },
            asset_type: { type: "string" },
          },
        },
        AccountInfo: {
          type: "object",
          properties: {
            publicKey: { type: "string" },
            sequence: { type: "string" },
            balances: {
              type: "array",
              items: { $ref: "#/components/schemas/AccountBalance" },
            },
            subentryCount: { type: "integer" },
          },
        },
        Tip: {
          type: "object",
          properties: {
            id: { type: "string" },
            from: { type: "string" },
            to: { type: "string" },
            amount: { type: "string" },
            memo: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            transactionHash: { type: "string" },
          },
        },
        TipStats: {
          type: "object",
          properties: {
            totalReceived: { type: "string" },
            totalCount: { type: "integer" },
            averageAmount: { type: "string" },
          },
        },
        TxFunctionChallengeRequest: {
          type: "object",
          required: ["ownerPublicKey", "type", "config"],
          properties: {
            ownerPublicKey: {
              type: "string",
              pattern: "^G[A-Z0-9]{55}$",
              description: "Stellar public key of the txFunction owner",
            },
            type: {
              type: "string",
              enum: ["dca", "stop_loss", "escrow_release"],
              description: "Type of automated txFunction",
            },
            config: {
              type: "object",
              description: "Type-specific configuration — see DcaConfig, StopLossConfig, or EscrowReleaseConfig",
            },
          },
        },
        TxFunctionChallengeResponse: {
          type: "object",
          properties: {
            challengeXDR: {
              type: "string",
              description: "Base64-encoded ManageData transaction XDR the owner must sign",
            },
            deploymentHash: {
              type: "string",
              description: "SHA-256 hash of the normalised config, included in the challenge",
            },
            normalizedConfig: { type: "object" },
            networkPassphrase: { type: "string" },
          },
        },
        TxFunctionDeployRequest: {
          type: "object",
          required: ["ownerPublicKey", "type", "config", "deploymentHash", "signedChallengeXDR"],
          properties: {
            ownerPublicKey: { type: "string", pattern: "^G[A-Z0-9]{55}$" },
            type: { type: "string", enum: ["dca", "stop_loss", "escrow_release"] },
            config: { type: "object" },
            deploymentHash: { type: "string" },
            signedChallengeXDR: {
              type: "string",
              description: "The challenge XDR signed by the owner's Freighter (or Ledger) wallet",
            },
          },
        },
        TxFunctionDeployment: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            ownerPublicKey: { type: "string" },
            type: { type: "string", enum: ["dca", "stop_loss", "escrow_release"] },
            status: { type: "string", enum: ["active", "paused", "completed"] },
            config: { type: "object" },
            deploymentHash: { type: "string" },
            signedChallengeXDR: {
              type: "string",
              description: "Owner-signed challenge transaction XDR used to deploy",
            },
            createdAt: { type: "string", format: "date-time" },
            createdAtMs: {
              type: "integer",
              description: "Creation time in epoch milliseconds",
            },
            nextRunAt: { type: "string", format: "date-time", nullable: true },
            lastExecutedAt: { type: "string", format: "date-time", nullable: true },
            lastCheckedAt: { type: "string", format: "date-time", nullable: true },
            lastObservedPriceUsd: { type: "number", nullable: true },
            lastError: { type: "string", nullable: true },
          },
        },
        ExecutionLogEntry: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            deploymentId: { type: "string", format: "uuid" },
            status: {
              type: "string",
              enum: ["created", "executed", "error", "status"],
              description: "Execution event type",
            },
            message: { type: "string" },
            result: {
              type: "object",
              nullable: true,
              description: "Operation intent generated by the txFunction evaluator",
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Webhook: {
          type: "object",
          properties: {
            id: { type: "string" },
            publicKey: { type: "string", description: "Stellar public key being monitored" },
            url: { type: "string", description: "Destination URL for POST notifications" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        WebhookCreateRequest: {
          type: "object",
          required: ["publicKey", "url", "secret"],
          properties: {
            publicKey: {
              type: "string",
              pattern: "^G[A-Z0-9]{55}$",
              description: "Stellar public key to monitor",
            },
            url: {
              type: "string",
              format: "uri",
              description: "HTTPS URL to receive webhook notifications",
            },
            secret: {
              type: "string",
              minLength: 32,
              description: "HMAC signing secret (min 32 chars)",
            },
          },
        },
        WebhookRegistrationResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            webhook: { $ref: "#/components/schemas/Webhook" },
          },
        },
        WebhookListResponse: {
          type: "object",
          properties: {
            webhooks: {
              type: "array",
              items: { $ref: "#/components/schemas/Webhook" },
            },
          },
        },
        ExportSchedule: {
          type: "object",
          properties: {
            publicKey: { type: "string" },
            email: { type: "string", format: "email" },
            frequency: { type: "string", enum: ["daily", "weekly"] },
            nextRunAt: { type: "string", format: "date-time" },
          },
        },
        ExportScheduleRequest: {
          type: "object",
          required: ["email", "frequency"],
          properties: {
            email: { type: "string", format: "email" },
            frequency: {
              type: "string",
              enum: ["daily", "weekly"],
            },
          },
        },
      },
    },
    paths: {
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          responses: {
            200: {
              description: "Server is healthy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      timestamp: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/auth": {
        get: {
          tags: ["Authentication"],
          summary: "Get SEP-0010 challenge transaction",
          parameters: [
            {
              name: "account",
              in: "query",
              required: true,
              schema: { type: "string", pattern: "^G[A-Z0-9]{55}$" },
              description: "Stellar public key",
            },
          ],
          responses: {
            200: {
              description: "Challenge transaction XDR",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      transaction: { type: "string" },
                    },
                  },
                },
              },
            },
            400: { description: "Missing or invalid account parameter" },
          },
        },
        post: {
          tags: ["Authentication"],
          summary: "Verify signed challenge and get JWT",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    transaction: {
                      type: "string",
                      description: "Signed challenge XDR",
                    },
                  },
                  required: ["transaction"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "JWT token",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      token: { type: "string" },
                    },
                  },
                },
              },
            },
            401: { description: "Invalid signature" },
          },
        },
      },
      "/api/accounts/{publicKey}": {
        get: {
          tags: ["Accounts"],
          summary: "Get account details and balances",
          parameters: [
            {
              name: "publicKey",
              in: "path",
              required: true,
              schema: { type: "string", pattern: "^G[A-Z0-9]{55}$" },
            },
          ],
          responses: {
            200: {
              description: "Account info",
              headers: {
                "RateLimit-Limit": { schema: { type: "integer", example: 100 } },
                "RateLimit-Remaining": { schema: { type: "integer" } },
                "RateLimit-Reset": { schema: { type: "integer" } },
              },
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: { $ref: "#/components/schemas/AccountInfo" },
                    },
                  },
                },
              },
            },
            404: { description: "Account not found" },
            429: { description: "Rate limit exceeded — back off and retry after RateLimit-Reset seconds" },
          },
        },
      },
      "/api/accounts/{publicKey}/balance": {
        get: {
          tags: ["Accounts"],
          summary: "Get native XLM balance",
          parameters: [
            {
              name: "publicKey",
              in: "path",
              required: true,
              schema: { type: "string", pattern: "^G[A-Z0-9]{55}$" },
            },
          ],
          responses: {
            200: {
              description: "XLM balance",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: {
                        type: "object",
                        properties: {
                          balance: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/accounts/resolve/{username}": {
        get: {
          tags: ["Accounts"],
          summary: "Resolve a username to a Stellar public key",
          parameters: [
            {
              name: "username",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Resolved public key",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: {
                        type: "object",
                        properties: {
                          publicKey: { type: "string" },
                          username: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            404: { description: "Username not found" },
          },
        },
      },
      "/api/accounts/register": {
        post: {
          tags: ["Accounts"],
          summary: "Register a username for an account",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    publicKey: {
                      type: "string",
                      pattern: "^G[A-Z0-9]{55}$",
                    },
                    username: { type: "string" },
                  },
                  required: ["publicKey", "username"],
                },
              },
            },
          },
          responses: {
            200: { description: "Username registered" },
            409: { description: "Username already taken" },
          },
        },
      },
      "/api/payments/{publicKey}": {
        get: {
          tags: ["Payments"],
          summary: "Fetch payment history for an account",
          parameters: [
            {
              name: "publicKey",
              in: "path",
              required: true,
              schema: { type: "string", pattern: "^G[A-Z0-9]{55}$" },
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", default: 20, maximum: 100 },
              description: "Number of results per page",
            },
            {
              name: "cursor",
              in: "query",
              schema: { type: "string" },
              description: "Pagination cursor",
            },
          ],
          responses: {
            200: {
              description: "Payment history",
              headers: {
                "RateLimit-Limit": { schema: { type: "integer", example: 100 } },
                "RateLimit-Remaining": { schema: { type: "integer" } },
                "RateLimit-Reset": { schema: { type: "integer" } },
              },
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/PaymentRecord" },
                      },
                    },
                  },
                },
              },
            },
            429: { description: "Rate limit exceeded" },
          },
        },
      },
      "/api/payments/{publicKey}/stats": {
        get: {
          tags: ["Payments"],
          summary: "Get aggregate payment statistics",
          parameters: [
            {
              name: "publicKey",
              in: "path",
              required: true,
              schema: { type: "string", pattern: "^G[A-Z0-9]{55}$" },
            },
          ],
          responses: {
            200: {
              description: "Payment stats",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: { $ref: "#/components/schemas/PaymentStats" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tips/received/{creatorPublicKey}": {
        get: {
          tags: ["Tips"],
          summary: "Get tips received by a creator",
          parameters: [
            {
              name: "creatorPublicKey",
              in: "path",
              required: true,
              schema: { type: "string", pattern: "^G[A-Z0-9]{55}$" },
            },
          ],
          responses: {
            200: {
              description: "Received tips",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Tip" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tips/sent/{senderPublicKey}": {
        get: {
          tags: ["Tips"],
          summary: "Get tips sent by an account",
          parameters: [
            {
              name: "senderPublicKey",
              in: "path",
              required: true,
              schema: { type: "string", pattern: "^G[A-Z0-9]{55}$" },
            },
          ],
          responses: {
            200: {
              description: "Sent tips",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Tip" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tips/stats/{creatorPublicKey}": {
        get: {
          tags: ["Tips"],
          summary: "Get tip statistics for a creator",
          parameters: [
            {
              name: "creatorPublicKey",
              in: "path",
              required: true,
              schema: { type: "string", pattern: "^G[A-Z0-9]{55}$" },
            },
          ],
          responses: {
            200: {
              description: "Tip stats",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: { $ref: "#/components/schemas/TipStats" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tips": {
        post: {
          tags: ["Tips"],
          summary: "Record a new tip",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    from: { type: "string" },
                    to: { type: "string" },
                    amount: { type: "string" },
                    memo: { type: "string" },
                    transactionHash: { type: "string" },
                  },
                  required: ["from", "to", "amount"],
                },
              },
            },
          },
          responses: {
            200: { description: "Tip recorded" },
            400: { description: "Invalid tip data" },
          },
        },
      },
      "/api/auth/refresh": {
        post: {
          tags: ["Authentication"],
          summary: "Refresh an expired access token within the grace window",
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string", description: "Current JWT token" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "New JWT token",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      token: { type: "string" },
                    },
                  },
                },
              },
            },
            401: { description: "Token invalid or expired beyond grace window" },
          },
        },
      },
      "/api/tips/leaderboard/{creatorPublicKey}": {
        get: {
          tags: ["Tips"],
          summary: "Get top tippers for a creator",
          parameters: [
            {
              name: "creatorPublicKey",
              in: "path",
              required: true,
              schema: { type: "string", pattern: "^G[A-Z0-9]{55}$" },
            },
          ],
          responses: {
            200: {
              description: "Top tippers",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            publicKey: { type: "string" },
                            totalAmount: { type: "string" },
                            count: { type: "integer" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/webhooks": {
        post: {
          tags: ["Webhooks"],
          summary: "Register a new webhook",
          description: "Register a webhook to receive notifications when payments occur for a specific Stellar public key.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/WebhookCreateRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "Webhook registered",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/WebhookRegistrationResponse" },
                },
              },
            },
            400: { description: "Invalid request body" },
            429: { description: "Rate limit exceeded" },
          },
        },
      },
      "/api/webhooks/{publicKey}": {
        get: {
          tags: ["Webhooks"],
          summary: "List webhooks for an account",
          parameters: [
            {
              name: "publicKey",
              in: "path",
              required: true,
              schema: { type: "string", pattern: "^G[A-Z0-9]{55}$" },
            },
          ],
          responses: {
            200: {
              description: "List of webhooks (secrets stripped)",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/WebhookListResponse" },
                },
              },
            },
            429: { description: "Rate limit exceeded" },
          },
        },
      },
      "/api/webhooks/{id}": {
        delete: {
          tags: ["Webhooks"],
          summary: "Delete a webhook",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: {
              description: "Webhook deleted",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                    },
                  },
                },
              },
            },
            404: { description: "Webhook not found" },
            429: { description: "Rate limit exceeded" },
          },
        },
      },
      "/.well-known/stellar.toml": {
        get: {
          tags: ["Federation"],
          summary: "SEP-0001 Stellar TOML discovery document",
          responses: {
            200: {
              description: "TOML document containing the federation server URL",
              content: {
                "application/toml": {
                  schema: {
                    type: "string",
                    example: 'FEDERATION_SERVER="https://stellarmicropay.io/federation"',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [routesGlob],
};

module.exports = swaggerJsdoc(options);
