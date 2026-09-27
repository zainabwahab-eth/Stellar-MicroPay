/**
 * src/routes/analytics.js
 * Analytics endpoints for transaction volume insights.
 */

"use strict";

const express = require("express");
const router = express.Router();
const { strictLimiter } = require("../middleware/rateLimit");
const { sanitizePublicKey } = require("../middleware/sanitization");
const analyticsController = require("../controllers/analyticsController");

/**
 * @swagger
 * /api/analytics/{publicKey}/summary:
 *   get:
 *     tags: [Analytics]
 *     summary: Get payment summary for an account
 *     description: >-
 *       Aggregates the account's most recent payments (up to 200) into totals
 *       sent and received, unique counterparties, average transaction size, and
 *       a week-over-week comparison of count and volume. Results are cached for
 *       60 seconds.
 *     parameters:
 *       - name: publicKey
 *         in: path
 *         required: true
 *         description: Stellar public key of the account to summarize.
 *         schema:
 *           type: string
 *           pattern: ^G[A-Z0-9]{55}$
 *     responses:
 *       "200":
 *         description: Analytics summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AnalyticsSummary'
 *       "400":
 *         description: Invalid Stellar public key format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "429":
 *         description: >-
 *           Rate limit exceeded — the strict limiter allows 20 requests per
 *           minute per IP.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:publicKey/summary",
  strictLimiter,
  sanitizePublicKey,
  analyticsController.getSummary
);

/**
 * @swagger
 * /api/analytics/{publicKey}/top-recipients:
 *   get:
 *     tags: [Analytics]
 *     summary: Get top payment recipients
 *     description: >-
 *       Ranks the top 5 recipients by total XLM sent, counting sent payments
 *       from the account's most recent payments (up to 200), sorted descending
 *       by total. Results are cached for 60 seconds.
 *     parameters:
 *       - name: publicKey
 *         in: path
 *         required: true
 *         description: Stellar public key of the sending account.
 *         schema:
 *           type: string
 *           pattern: ^G[A-Z0-9]{55}$
 *     responses:
 *       "200":
 *         description: Top recipients by total XLM sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     publicKey:
 *                       type: string
 *                     topRecipients:
 *                       type: array
 *                       description: Up to 5 entries, highest total first.
 *                       items:
 *                         $ref: '#/components/schemas/TopRecipient'
 *                     count:
 *                       type: integer
 *                       description: Number of recipients returned.
 *       "400":
 *         description: Invalid Stellar public key format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "429":
 *         description: >-
 *           Rate limit exceeded — the strict limiter allows 20 requests per
 *           minute per IP.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:publicKey/top-recipients",
  strictLimiter,
  sanitizePublicKey,
  analyticsController.getTopRecipients
);

/**
 * @swagger
 * /api/analytics/{publicKey}/activity:
 *   get:
 *     tags: [Analytics]
 *     summary: Get payment activity by day of week
 *     description: >-
 *       Counts the account's most recent payments (up to 200) by day of week,
 *       always returning all seven days (Sunday first). Results are cached for
 *       60 seconds.
 *     parameters:
 *       - name: publicKey
 *         in: path
 *         required: true
 *         description: Stellar public key of the account.
 *         schema:
 *           type: string
 *           pattern: ^G[A-Z0-9]{55}$
 *     responses:
 *       "200":
 *         description: Payment counts for each day of the week
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     publicKey:
 *                       type: string
 *                     activityByDay:
 *                       type: array
 *                       description: Always 7 entries, Sunday through Saturday.
 *                       items:
 *                         $ref: '#/components/schemas/ActivityDay'
 *       "400":
 *         description: Invalid Stellar public key format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "429":
 *         description: >-
 *           Rate limit exceeded — the strict limiter allows 20 requests per
 *           minute per IP.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:publicKey/activity",
  strictLimiter,
  sanitizePublicKey,
  analyticsController.getActivityByDay
);

/**
 * @swagger
 * /api/analytics/{publicKey}/cohorts:
 *   get:
 *     tags: [Analytics]
 *     summary: Get repeat-vs-one-time counterparty cohorts
 *     description: >-
 *       Groups the account's most recent payments (up to 200) into calendar
 *       buckets and reports, per bucket, how many counterparties appeared once
 *       (one-time) versus more than once (repeat), split by sent and received
 *       payments. Results are cached for 60 seconds.
 *     parameters:
 *       - name: publicKey
 *         in: path
 *         required: true
 *         description: Stellar public key of the account.
 *         schema:
 *           type: string
 *           pattern: ^G[A-Z0-9]{55}$
 *       - name: period
 *         in: query
 *         required: false
 *         description: >-
 *           Bucket size for the cohort breakdown. Defaults to month; any value
 *           other than week falls back to month.
 *         schema:
 *           type: string
 *           enum: [month, week]
 *           default: month
 *       - name: periods
 *         in: query
 *         required: false
 *         description: >-
 *           How many buckets to return, ending with the current period.
 *           Defaults to 6; values below 1 or that are not numeric fall back to
 *           6, and values above 12 are capped at 12.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           default: 6
 *     responses:
 *       "200":
 *         description: Cohort breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CohortBreakdown'
 *       "400":
 *         description: Invalid Stellar public key format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "429":
 *         description: >-
 *           Rate limit exceeded — the strict limiter allows 20 requests per
 *           minute per IP.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:publicKey/cohorts",
  strictLimiter,
  sanitizePublicKey,
  analyticsController.getCohortBreakdown
);

/**
 * @swagger
 * /api/analytics/{publicKey}/stream:
 *   get:
 *     tags: [Analytics]
 *     summary: Stream new payment events as server-sent events
 *     description: >-
 *       Opens a `text/event-stream` connection that emits `event: payment`
 *       with a JSON payment payload for each new operation on the account,
 *       `event: error` with `{ "message": string }` when the underlying
 *       Horizon stream fails, and a `: heartbeat` comment every 25 seconds.
 *       The stream is opened with `retry: 5000`.
 *     parameters:
 *       - name: publicKey
 *         in: path
 *         required: true
 *         description: Stellar public key to stream payments for.
 *         schema:
 *           type: string
 *           pattern: ^G[A-Z0-9]{55}$
 *     responses:
 *       "200":
 *         description: >-
 *           Server-sent event stream. Each `payment` event carries a
 *           PaymentStreamEvent payload; `error` events carry `{ message }`.
 *         content:
 *           text/event-stream:
 *             schema:
 *               $ref: '#/components/schemas/PaymentStreamEvent'
 *       "400":
 *         description: Invalid Stellar public key format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "429":
 *         description: >-
 *           Rate limit exceeded — the strict limiter allows 20 requests per
 *           minute per IP.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:publicKey/stream",
  strictLimiter,
  sanitizePublicKey,
  analyticsController.streamPayments
);

/**
 * @swagger
 * /api/analytics/{publicKey}/export-schedule:
 *   post:
 *     tags: [Analytics]
 *     summary: Set up recurring email export
 *     description: >-
 *       Creates or replaces the recurring email export schedule for the
 *       account. Schedules are held in memory, so they do not survive a
 *       server restart.
 *     parameters:
 *       - name: publicKey
 *         in: path
 *         required: true
 *         description: Stellar public key the schedule applies to.
 *         schema:
 *           type: string
 *           pattern: ^G[A-Z0-9]{55}$
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExportScheduleRequest'
 *     responses:
 *       "201":
 *         description: Export scheduled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ExportSchedule'
 *                 message:
 *                   type: string
 *                   example: Recurring export scheduled successfully
 *       "400":
 *         description: >-
 *           Missing `email`/`frequency`, `frequency` other than `daily` or
 *           `weekly`, invalid Stellar public key format, or malformed JSON
 *           body.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "429":
 *         description: >-
 *           Rate limit exceeded — the strict limiter allows 20 requests per
 *           minute per IP.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/:publicKey/export-schedule",
  strictLimiter,
  sanitizePublicKey,
  analyticsController.scheduleExport
);

/**
 * @swagger
 * /api/analytics/{publicKey}/export-schedule:
 *   get:
 *     tags: [Analytics]
 *     summary: Get scheduled export configuration
 *     description: >-
 *       Returns the stored export schedule for the account, or `data: null`
 *       when no schedule has been created.
 *     parameters:
 *       - name: publicKey
 *         in: path
 *         required: true
 *         description: Stellar public key the schedule applies to.
 *         schema:
 *           type: string
 *           pattern: ^G[A-Z0-9]{55}$
 *     responses:
 *       "200":
 *         description: Export schedule, or null when none exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   nullable: true
 *                   allOf:
 *                     - $ref: '#/components/schemas/ExportSchedule'
 *       "400":
 *         description: Invalid Stellar public key format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "429":
 *         description: >-
 *           Rate limit exceeded — the strict limiter allows 20 requests per
 *           minute per IP.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:publicKey/export-schedule",
  strictLimiter,
  sanitizePublicKey,
  analyticsController.getExportSchedule
);

/**
 * @swagger
 * /api/analytics/{publicKey}/export-trigger:
 *   post:
 *     tags: [Analytics]
 *     summary: Manually trigger sending export email
 *     description: >-
 *       Sends the export email immediately using the account's stored schedule.
 *       Fails with 404 when no schedule exists for the account.
 *     parameters:
 *       - name: publicKey
 *         in: path
 *         required: true
 *         description: Stellar public key the schedule applies to.
 *         schema:
 *           type: string
 *           pattern: ^G[A-Z0-9]{55}$
 *     responses:
 *       "200":
 *         description: Export email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: Export email sent
 *       "400":
 *         description: Invalid Stellar public key format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "404":
 *         description: No export schedule exists for this public key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "429":
 *         description: >-
 *           Rate limit exceeded — the strict limiter allows 20 requests per
 *           minute per IP.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/:publicKey/export-trigger",
  strictLimiter,
  sanitizePublicKey,
  analyticsController.triggerExport
);

module.exports = router;
