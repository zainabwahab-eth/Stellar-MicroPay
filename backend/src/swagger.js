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
        "Backend API for Stellar MicroPay — instant micropayments on the Stellar network.",
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
          },
        },
        TopRecipient: {
          type: "object",
          properties: {
            address: { type: "string" },
            totalXLMSent: { type: "string" },
          },
        },
        ActivityDay: {
          type: "object",
          properties: {
            day: { type: "string", example: "Monday" },
            dayIndex: { type: "integer", minimum: 0, maximum: 6 },
            transactionCount: { type: "integer" },
          },
        },
        TurretsChallenge: {
          type: "object",
          properties: {
            challengeXDR: {
              type: "string",
              description: "ManageData challenge transaction to sign and deploy.",
            },
            deploymentHash: { type: "string" },
            normalizedConfig: {
              type: "object",
              description: "Configuration after validation and normalization.",
            },
            networkPassphrase: { type: "string" },
          },
        },
        TxFunctionDeployment: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            ownerPublicKey: { type: "string" },
            type: { type: "string", enum: ["dca", "stop_loss"] },
            status: { type: "string", enum: ["active", "paused"] },
            config: { type: "object" },
            deploymentHash: { type: "string" },
            signedChallengeXDR: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            nextRunAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            lastExecutedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            lastCheckedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            lastObservedPriceUsd: {
              type: "number",
              nullable: true,
            },
            lastError: {
              type: "string",
              nullable: true,
            },
          },
        },
        ExecutionLogEntry: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            deploymentId: { type: "string", format: "uuid" },
            status: { type: "string", example: "executed" },
            message: { type: "string" },
            result: { type: "object", nullable: true },
            createdAt: { type: "string", format: "date-time" },
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
    },
  },
  apis: [routesGlob],
};

module.exports = swaggerJsdoc(options);
