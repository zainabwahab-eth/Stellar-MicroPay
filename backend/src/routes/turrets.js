/**
 * src/routes/turrets.js
 * Turrets txFunctions API routes.
 */

"use strict";

const express = require("express");
const { paymentLimiter } = require("../middleware/rateLimit");
const controller = require("../controllers/turretsController");

const router = express.Router();

/**
 * @swagger
 * /api/turrets:
 *   get:
 *     tags: [Turrets]
 *     summary: List txFunction deployments
 *     description: >-
 *       Returns all deployments. Filter by owner using the `ownerPublicKey`
 *       query parameter.
 *     parameters:
 *       - name: ownerPublicKey
 *         in: query
 *         required: false
 *         description: Filter deployments by owner Stellar public key.
 *         schema:
 *           type: string
 *           pattern: ^G[A-Z0-9]{55}$
 *     responses:
 *       "200":
 *         description: Array of deployments
 *         headers:
 *           RateLimit-Limit:
 *             description: Maximum requests allowed in the current window (10 per minute)
 *             schema:
 *               type: integer
 *               example: 10
 *           RateLimit-Remaining:
 *             description: Requests remaining in the current window
 *             schema:
 *               type: integer
 *               example: 9
 *           RateLimit-Reset:
 *             description: Seconds until the rate-limit window resets
 *             schema:
 *               type: integer
 *               example: 45
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TxFunctionDeployment'
 *       "400":
 *         description: Invalid `ownerPublicKey` format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "429":
 *         description: Rate limit exceeded — the payment/turret limiter allows 10 requests per minute per IP
 *         headers:
 *           RateLimit-Limit:
 *             schema:
 *               type: integer
 *               example: 10
 *           RateLimit-Remaining:
 *             schema:
 *               type: integer
 *               example: 0
 *           RateLimit-Reset:
 *             schema:
 *               type: integer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", paymentLimiter, controller.list);

/**
 * @swagger
 * /api/turrets/challenge:
 *   post:
 *     tags: [Turrets]
 *     summary: Create a txFunction signing challenge
 *     description: >-
 *       Returns a ManageData transaction XDR that the user must sign with
 *       their Stellar keypair to prove ownership. The signed XDR is then
 *       passed to `POST /api/turrets/deploy`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TxFunctionChallengeRequest'
 *     responses:
 *       "200":
 *         description: Challenge XDR and deployment hash
 *         headers:
 *           RateLimit-Limit:
 *             schema:
 *               type: integer
 *               example: 10
 *           RateLimit-Remaining:
 *             schema:
 *               type: integer
 *           RateLimit-Reset:
 *             schema:
 *               type: integer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TxFunctionChallengeResponse'
 *       "400":
 *         description: >-
 *           Invalid owner public key, unsupported txFunction type, invalid
 *           configuration for the type, or malformed JSON body.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "429":
 *         description: Rate limit exceeded — the payment/turret limiter allows 10 requests per minute per IP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/challenge", paymentLimiter, controller.createChallenge);

/**
 * @swagger
 * /api/turrets/deploy:
 *   post:
 *     tags: [Turrets]
 *     summary: Deploy a signed txFunction
 *     description: >-
 *       Verifies the signed challenge and registers the txFunction. The
 *       runner begins evaluating the deployment immediately.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TxFunctionDeployRequest'
 *     responses:
 *       "201":
 *         description: Deployment created
 *         headers:
 *           RateLimit-Limit:
 *             schema:
 *               type: integer
 *               example: 10
 *           RateLimit-Remaining:
 *             schema:
 *               type: integer
 *           RateLimit-Reset:
 *             schema:
 *               type: integer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TxFunctionDeployment'
 *       "400":
 *         description: >-
 *           Invalid owner public key, unsupported type or invalid
 *           configuration, signed challenge source-account mismatch,
 *           configuration hash mismatch, missing asset issuer, or malformed
 *           JSON body.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "401":
 *         description: Signed challenge was not signed by the owner account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "429":
 *         description: Rate limit exceeded — the payment/turret limiter allows 10 requests per minute per IP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/deploy", paymentLimiter, controller.deploy);

/**
 * @swagger
 * /api/turrets/{id}:
 *   get:
 *     tags: [Turrets]
 *     summary: Get a single txFunction deployment
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Deployment ID returned when the txFunction was deployed.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       "200":
 *         description: Deployment details
 *         headers:
 *           RateLimit-Limit:
 *             schema:
 *               type: integer
 *               example: 10
 *           RateLimit-Remaining:
 *             schema:
 *               type: integer
 *           RateLimit-Reset:
 *             schema:
 *               type: integer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TxFunctionDeployment'
 *       "404":
 *         description: Deployment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "429":
 *         description: Rate limit exceeded — the payment/turret limiter allows 10 requests per minute per IP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", paymentLimiter, controller.getOne);

/**
 * @swagger
 * /api/turrets/{id}/history:
 *   get:
 *     tags: [Turrets]
 *     summary: Get execution history for a deployment
 *     description: >-
 *       Returns execution log entries for the deployment, most recent first,
 *       paginated with `page` and `limit`.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Deployment ID returned when the txFunction was deployed.
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: page
 *         in: query
 *         required: false
 *         description: Page number to return. Defaults to 1.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Number of entries per page. Defaults to 10.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *     responses:
 *       "200":
 *         description: Execution log entries for the requested page
 *         headers:
 *           RateLimit-Limit:
 *             schema:
 *               type: integer
 *               example: 10
 *           RateLimit-Remaining:
 *             schema:
 *               type: integer
 *           RateLimit-Reset:
 *             schema:
 *               type: integer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExecutionLogEntry'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total entries for the deployment.
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                       description: Total number of pages.
 *       "404":
 *         description: Deployment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "429":
 *         description: Rate limit exceeded — the payment/turret limiter allows 10 requests per minute per IP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id/history", paymentLimiter, controller.getHistory);

/**
 * @swagger
 * /api/turrets/{id}/pause:
 *   post:
 *     tags: [Turrets]
 *     summary: Pause a txFunction deployment
 *     description: >-
 *       Sets the deployment status to `paused`; paused deployments are not
 *       evaluated by the runner until resumed.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Deployment ID returned when the txFunction was deployed.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       "200":
 *         description: Updated deployment with status 'paused'
 *         headers:
 *           RateLimit-Limit:
 *             schema:
 *               type: integer
 *               example: 10
 *           RateLimit-Remaining:
 *             schema:
 *               type: integer
 *           RateLimit-Reset:
 *             schema:
 *               type: integer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TxFunctionDeployment'
 *       "404":
 *         description: Deployment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "429":
 *         description: Rate limit exceeded — the payment/turret limiter allows 10 requests per minute per IP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/:id/pause", paymentLimiter, controller.pause);

/**
 * @swagger
 * /api/turrets/{id}/resume:
 *   post:
 *     tags: [Turrets]
 *     summary: Resume a paused txFunction deployment
 *     description: >-
 *       Sets the deployment status back to `active` so the runner evaluates it
 *       again.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Deployment ID returned when the txFunction was deployed.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       "200":
 *         description: Updated deployment with status 'active'
 *         headers:
 *           RateLimit-Limit:
 *             schema:
 *               type: integer
 *               example: 10
 *           RateLimit-Remaining:
 *             schema:
 *               type: integer
 *           RateLimit-Reset:
 *             schema:
 *               type: integer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/TxFunctionDeployment'
 *       "404":
 *         description: Deployment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       "429":
 *         description: Rate limit exceeded — the payment/turret limiter allows 10 requests per minute per IP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/:id/resume", paymentLimiter, controller.resume);

module.exports = router;
